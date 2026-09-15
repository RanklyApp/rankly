import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { App } from "@/db/schema";
import { slugify } from "@/lib/validations";

const { apps, categories } = schema;

/** Generates a slug from text, appending -2, -3… until it is unique. */
export async function generateUniqueSlug(text: string): Promise<string> {
  const db = getDb();
  const base = slugify(text) || "app";
  let candidate = base;
  let n = 1;

  // Small loop; app names rarely collide more than a handful of times.
  while (true) {
    const existing = await db
      .select({ id: apps.id })
      .from(apps)
      .where(eq(apps.slug, candidate))
      .limit(1);
    if (existing.length === 0) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

interface CreateAppInput {
  name: string;
  categoryId: string;
  websiteUrl: string;
  ownerEmail: string;
  ownerUserId: string;
  logoUrl: string;
  /** Optional detailed description from the form. */
  description?: string;
}

/**
 * Creates a business owned by `ownerUserId`, published immediately
 * (status 'approved' — no moderation queue). The one-liner `tagline` is derived
 * from the description (or name).
 */
export async function createApp(input: CreateAppInput): Promise<App> {
  const db = getDb();
  const slug = await generateUniqueSlug(input.name);
  const description = input.description?.trim() ?? "";
  // The listing one-liner: first line of the description, else the name.
  // Kept <= 80 chars to fit the `tagline` column.
  const tagline = (description || input.name).slice(0, 80);

  const [row] = await db
    .insert(apps)
    .values({
      name: input.name,
      categoryId: input.categoryId,
      websiteUrl: input.websiteUrl,
      ownerEmail: input.ownerEmail,
      ownerUserId: input.ownerUserId,
      logoUrl: input.logoUrl,
      description,
      tagline,
      slug,
      status: "approved",
      plan: "free",
      dailyAmountCents: 0,
    })
    .returning();
  return row;
}

export async function moderateApp(
  appId: string,
  action: "approve" | "reject",
): Promise<void> {
  const db = getDb();
  await db
    .update(apps)
    .set({ status: action === "approve" ? "approved" : "rejected" })
    .where(eq(apps.id, appId));
}

interface CategoryData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  seoTitle: string;
  seoDescription: string;
}

export async function createCategory(data: CategoryData): Promise<void> {
  await getDb().insert(categories).values(data);
}

export async function updateCategory(
  id: string,
  data: CategoryData,
): Promise<void> {
  await getDb().update(categories).set(data).where(eq(categories.id, id));
}
