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
  // eslint-disable-next-line no-constant-condition
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
  tagline: string;
  description: string;
  websiteUrl: string;
  categoryId: string;
  ownerEmail: string;
  logoUrl: string;
}

export async function createApp(input: CreateAppInput): Promise<App> {
  const db = getDb();
  const slug = await generateUniqueSlug(input.name);
  const [row] = await db
    .insert(apps)
    .values({
      ...input,
      slug,
      status: "pending",
      plan: "free",
      monthlyAmountCents: 0,
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
