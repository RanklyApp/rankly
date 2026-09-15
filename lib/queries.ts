import "server-only";
import { and, asc, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { App, Category } from "@/db/schema";

const { apps, categories, events } = schema;

/** Wraps a DB read so a missing/unreachable database yields a safe fallback
 * (empty state) instead of a crashed page. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error("[queries] DB read failed, returning fallback:", err);
    return fallback;
  }
}

export type AppWithCategory = App & { category: Category };

// --- Categories ---

export function getCategories(): Promise<Category[]> {
  return safe(
    () => getDb().select().from(categories).orderBy(asc(categories.name)),
    [],
  );
}

export function getCategoryBySlug(slug: string): Promise<Category | null> {
  return safe(async () => {
    const rows = await getDb()
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    return rows[0] ?? null;
  }, null);
}

// --- Apps (public, approved only) ---

export function getApprovedApps(): Promise<App[]> {
  return safe(
    () =>
      getDb().select().from(apps).where(eq(apps.status, "approved")),
    [],
  );
}

export interface ApprovedAppRow {
  name: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  logoUrl: string;
  categoryName: string;
  plan: "free" | "paid";
  monthlyAmountCents: number;
}

/** Approved apps + their category, shaped for the ranked list. Ordered by
 *  clicks then newest (real ranking wiring comes later). */
export function getApprovedAppsWithCategory(): Promise<ApprovedAppRow[]> {
  return safe(
    () =>
      getDb()
        .select({
          name: apps.name,
          tagline: apps.tagline,
          description: apps.description,
          websiteUrl: apps.websiteUrl,
          logoUrl: apps.logoUrl,
          categoryName: categories.name,
          plan: apps.plan,
          monthlyAmountCents: apps.monthlyAmountCents,
        })
        .from(apps)
        .innerJoin(categories, eq(apps.categoryId, categories.id))
        .where(eq(apps.status, "approved"))
        .orderBy(desc(apps.clicksCount), desc(apps.createdAt)),
    [],
  );
}

export function getRecentApps(limit = 12): Promise<App[]> {
  return safe(
    () =>
      getDb()
        .select()
        .from(apps)
        .where(eq(apps.status, "approved"))
        .orderBy(desc(apps.createdAt))
        .limit(limit),
    [],
  );
}

export function getApprovedAppsByCategory(
  categoryId: string,
  q?: string,
): Promise<App[]> {
  return safe(() => {
    const base = and(
      eq(apps.status, "approved"),
      eq(apps.categoryId, categoryId),
    );
    const where =
      q && q.trim()
        ? and(
            base,
            or(
              ilike(apps.name, `%${q}%`),
              ilike(apps.tagline, `%${q}%`),
              ilike(apps.description, `%${q}%`),
            ),
          )
        : base;
    return getDb().select().from(apps).where(where);
  }, []);
}

export function searchApprovedApps(q: string): Promise<App[]> {
  const term = q.trim();
  if (!term) return Promise.resolve([]);
  return safe(
    () =>
      getDb()
        .select()
        .from(apps)
        .where(
          and(
            eq(apps.status, "approved"),
            or(
              ilike(apps.name, `%${term}%`),
              ilike(apps.tagline, `%${term}%`),
              ilike(apps.description, `%${term}%`),
            ),
          ),
        ),
    [],
  );
}

export function getAppBySlug(slug: string): Promise<AppWithCategory | null> {
  return safe(async () => {
    const rows = await getDb()
      .select()
      .from(apps)
      .innerJoin(categories, eq(apps.categoryId, categories.id))
      .where(and(eq(apps.slug, slug), eq(apps.status, "approved")))
      .limit(1);
    const row = rows[0];
    return row ? { ...row.apps, category: row.categories } : null;
  }, null);
}

export function getRelatedApps(
  categoryId: string,
  excludeAppId: string,
  limit = 6,
): Promise<App[]> {
  return safe(
    () =>
      getDb()
        .select()
        .from(apps)
        .where(
          and(
            eq(apps.status, "approved"),
            eq(apps.categoryId, categoryId),
            ne(apps.id, excludeAppId),
          ),
        )
        .orderBy(desc(apps.clicksCount), desc(apps.createdAt))
        .limit(limit),
    [],
  );
}

/** Slugs of all approved apps + all categories, for the sitemap. */
export async function getSitemapEntries(): Promise<{
  apps: { slug: string; updatedAt: Date }[];
  categories: { slug: string }[];
}> {
  return safe(
    async () => {
      const [a, c] = await Promise.all([
        getDb()
          .select({ slug: apps.slug, updatedAt: apps.createdAt })
          .from(apps)
          .where(eq(apps.status, "approved")),
        getDb().select({ slug: categories.slug }).from(categories),
      ]);
      return { apps: a, categories: c };
    },
    { apps: [], categories: [] },
  );
}

// --- Admin ---

export function getPendingApps(): Promise<AppWithCategory[]> {
  return safe(async () => {
    const rows = await getDb()
      .select()
      .from(apps)
      .innerJoin(categories, eq(apps.categoryId, categories.id))
      .where(eq(apps.status, "pending"))
      .orderBy(asc(apps.createdAt));
    return rows.map((r) => ({ ...r.apps, category: r.categories }));
  }, []);
}

// --- Click tracking (used by /go/[slug]) ---

export function getAppForRedirect(
  slug: string,
): Promise<{ id: string; websiteUrl: string } | null> {
  return safe(async () => {
    const rows = await getDb()
      .select({ id: apps.id, websiteUrl: apps.websiteUrl })
      .from(apps)
      .where(and(eq(apps.slug, slug), eq(apps.status, "approved")))
      .limit(1);
    return rows[0] ?? null;
  }, null);
}

export async function recordClick(
  appId: string,
  meta: { referrer?: string | null; sessionHash?: string | null },
): Promise<void> {
  await safe(async () => {
    const db = getDb();
    await Promise.all([
      db.insert(events).values({
        appId,
        type: "click",
        referrer: meta.referrer ?? null,
        sessionHash: meta.sessionHash ?? null,
      }),
      db
        .update(apps)
        .set({ clicksCount: sql`${apps.clicksCount} + 1` })
        .where(eq(apps.id, appId)),
    ]);
    return null;
  }, null);
}
