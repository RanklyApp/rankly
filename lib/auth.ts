import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { App } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const { users, apps, categories } = schema;

/** The current authenticated Supabase user (or null), from request cookies.
 *  Returns null (instead of throwing) if Supabase env is missing/misconfigured,
 *  so pages degrade to the logged-out state rather than crashing. */
export async function getSessionUser(): Promise<{
  id: string;
  email: string | null;
} | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { id: user.id, email: user.email ?? null } : null;
  } catch {
    return null;
  }
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

/** Single approved app owned by this user (for the edit page). */
export async function getOwnerAppById(
  userId: string,
  appId: string,
): Promise<OwnerAppRow | null> {
  const rows = await getDb()
    .select({
      id: apps.id,
      name: apps.name,
      tagline: apps.tagline,
      description: apps.description,
      websiteUrl: apps.websiteUrl,
      logoUrl: apps.logoUrl,
      categoryId: apps.categoryId,
      categoryName: categories.name,
      plan: apps.plan,
      dailyAmountCents: apps.dailyAmountCents,
      desiredDailyAmountCents: apps.desiredDailyAmountCents,
      dodoSubscriptionId: apps.dodoSubscriptionId,
      firstPlaceSecondsTotal: apps.firstPlaceSecondsTotal,
    })
    .from(apps)
    .innerJoin(categories, eq(apps.categoryId, categories.id))
    .where(
      and(
        eq(apps.id, appId),
        eq(apps.ownerUserId, userId),
        eq(apps.status, "approved"),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
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
  description: string;
  websiteUrl: string;
  logoUrl: string;
  categoryId: string;
  categoryName: string;
  plan: "free" | "paid";
  dailyAmountCents: number;
  /** Desired bid the owner picked (may be ahead of what's charged). */
  desiredDailyAmountCents: number;
  /** Null until the owner authorizes a Dodo mandate — no mandate = no charge. */
  dodoSubscriptionId: string | null;
  /** Accrued seconds at the global #1 spot (gamification progress). */
  firstPlaceSecondsTotal: number;
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
      description: apps.description,
      websiteUrl: apps.websiteUrl,
      logoUrl: apps.logoUrl,
      categoryId: apps.categoryId,
      categoryName: categories.name,
      plan: apps.plan,
      dailyAmountCents: apps.dailyAmountCents,
      desiredDailyAmountCents: apps.desiredDailyAmountCents,
      dodoSubscriptionId: apps.dodoSubscriptionId,
      firstPlaceSecondsTotal: apps.firstPlaceSecondsTotal,
    })
    .from(apps)
    .innerJoin(categories, eq(apps.categoryId, categories.id))
    .where(and(eq(apps.ownerUserId, userId), eq(apps.status, "approved")));
}
