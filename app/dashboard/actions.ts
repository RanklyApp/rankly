"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getSessionUser } from "@/lib/auth";
import { createMandateCheckout, isDodoConfigured } from "@/lib/billing/dodo";
import { applyBidChange } from "@/lib/billing/service";
import { ADMIN_EMAIL } from "@/lib/constants";
import { deleteApp } from "@/lib/mutations";
import { siteUrl } from "@/lib/seo";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { bidDollarsSchema, dollarsToCents } from "@/lib/validations";

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Site-operator-only: permanently deletes any business from the dashboard's
 * admin block. Gated by email (ADMIN_EMAIL) — no route, no role table. Silently
 * no-ops for anyone else.
 */
export async function deleteBusinessAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) return;

  const appId = formData.get("appId");
  if (typeof appId !== "string" || !z.string().uuid().safeParse(appId).success) {
    return;
  }
  await deleteApp(appId);
  revalidatePath("/dashboard");
  revalidatePath("/");
}

export interface BidState {
  ok?: boolean;
  error?: string;
  /** Soft note: bid saved but the charge didn't fire (e.g. no payment set up). */
  notice?: string;
}

/**
 * Owner sets/updates the daily "destacar" bid for one of their businesses.
 * Validates a whole-dollar amount (>= $0; $0 = leave the paid section), verifies ownership, then delegates
 * to `applyBidChange` (which persists the desired amount and attempts the Dodo
 * off-session charge). The amount is stored regardless of whether the charge
 * fires — a missing mandate just means it won't rank until payment is set up.
 */
export async function setBidAction(
  _prev: BidState,
  formData: FormData,
): Promise<BidState> {
  const user = await getSessionUser();
  if (!user) return { error: "Se cerró la sesión. Volvé a entrar." };

  const appId = formData.get("appId");
  if (typeof appId !== "string" || !appId) {
    return { error: "Negocio inválido." };
  }

  const parsed = bidDollarsSchema.safeParse(Number(formData.get("amount")));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Monto inválido." };
  }

  // Ownership guard: the app must belong to the logged-in user.
  const { apps } = schema;
  const owned = await getDb()
    .select({ id: apps.id })
    .from(apps)
    .where(and(eq(apps.id, appId), eq(apps.ownerUserId, user.id)))
    .limit(1);
  if (!owned[0]) return { error: "No encontramos ese negocio." };

  const res = await applyBidChange(appId, dollarsToCents(parsed.data));
  revalidatePath("/dashboard");

  if (res.ok) return { ok: true };
  // Kept below the payment-setup action so both share the ownership pattern.
  // The desired amount was still saved; explain why it isn't charging (yet).
  switch (res.reason) {
    case "no_mandate":
    case "not_configured":
      return {
        ok: true,
        notice:
          "Monto guardado. Falta configurar el pago para que se cobre y suba en el ranking.",
      };
    case "busy":
      return {
        ok: true,
        notice: "Monto guardado. Hay un cobro en curso; se aplica en breve.",
      };
    case "no_charge_needed":
      return { ok: true };
    default:
      return {
        ok: true,
        notice: "Monto guardado, pero el cobro falló. Vamos a reintentar.",
      };
  }
}

/**
 * Fase 1 — the real "add/update payment method" entry point. Starts a Dodo
 * mandate-only checkout ($0, saves a reusable card) for one of the owner's
 * businesses and redirects the browser to Dodo's hosted checkout. When the buyer
 * finishes, Dodo returns them to `/api/billing/return?appId=…`, which captures
 * the saved-card subscription (see that route). Replaces the temporary admin
 * `billing-test?action=mandate` path for real users.
 */
export async function startPaymentSetupAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/acceder");

  const appId = formData.get("appId");
  if (typeof appId !== "string" || !z.string().uuid().safeParse(appId).success) {
    redirect("/dashboard?pago=error");
  }

  if (!isDodoConfigured()) redirect("/dashboard?pago=nocfg");

  // Ownership guard + the fields the checkout needs (email to attach the
  // customer, existing customer id to reuse instead of duplicating).
  const { apps } = schema;
  const owned = await getDb()
    .select({
      ownerEmail: apps.ownerEmail,
      dodoCustomerId: apps.dodoCustomerId,
    })
    .from(apps)
    .where(and(eq(apps.id, appId), eq(apps.ownerUserId, user.id)))
    .limit(1);
  const app = owned[0];
  if (!app) redirect("/dashboard?pago=error");

  // return_url carries only the appId; the return route re-authenticates via the
  // session cookie and re-checks ownership, so no secret needs to ride along.
  const returnUrl = `${siteUrl()}/api/billing/return?appId=${appId}`;

  let checkoutUrl: string;
  try {
    const res = await createMandateCheckout({
      customerId: app.dodoCustomerId ?? undefined,
      customerEmail: app.ownerEmail,
      returnUrl,
      metadata: { app_id: appId },
    });
    checkoutUrl = res.checkoutUrl;
  } catch (err) {
    console.error("[dashboard] startPaymentSetup failed:", err);
    redirect("/dashboard?pago=error");
  }

  // External redirect to Dodo's hosted checkout (redirect() supports absolute URLs).
  redirect(checkoutUrl);
}
