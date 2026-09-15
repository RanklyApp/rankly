import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { App } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const { users, apps, categories } = schema;

/** The current authenticated Supabase user (or null), from request cookies. */
export async function getSessionUser(): Promise<{
  id: string;
  email: string | null;
} | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? null } : null;
}

/**
 * Ensures a `public.users` row exists for this auth user (id mirrors
 * auth.users.id). Idempotent. The business is linked to the owner at creation
 * time (apps.ownerUserId), so there's no email-based claim step anymore.
 */
export async function ensureUserRow(
  userId: string,
  email: string,
): Promise<void> {
  await getDb()
    .insert(users)
    .values({ id: userId, email: email.trim().toLowerCase(), role: "owner" })
    .onConflictDoNothing({ target: users.id });
}

/** Approved apps owned by this user. */
export async function getOwnerApps(userId: string): Promise<App[]> {
  return getDb()
    .select()
    .from(apps)
    .where(and(eq(apps.ownerUserId, userId), eq(apps.status, "approved")));
}

export interface OwnerAppRow {
  id: string;
  name: string;
  tagline: string;
  websiteUrl: string;
  logoUrl: string;
  categoryName: string;
  plan: "free" | "paid";
  amountCents: number;
}

/** Approved apps owned by this user, with their category name (for the list). */
export async function getOwnerAppsWithCategory(
  userId: string,
): Promise<OwnerAppRow[]> {
  return getDb()
    .select({
      id: apps.id,
      name: apps.name,
      tagline: apps.tagline,
      websiteUrl: apps.websiteUrl,
      logoUrl: apps.logoUrl,
      categoryName: categories.name,
      plan: apps.plan,
      amountCents: apps.monthlyAmountCents,
    })
    .from(apps)
    .innerJoin(categories, eq(apps.categoryId, categories.id))
    .where(and(eq(apps.ownerUserId, userId), eq(apps.status, "approved")));
}
