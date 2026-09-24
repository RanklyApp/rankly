import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getSessionUser } from "@/lib/auth";
import { getDodo, isDodoConfigured } from "@/lib/billing/dodo";
import { captureMandate } from "@/lib/billing/service";
import { siteUrl } from "@/lib/seo";

// Node runtime: captureMandate + Dodo SDK need Node crypto.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fase 1 — real mandate-checkout return handler. Dodo redirects the owner here
 * (GET) after they finish the $0 mandate-only checkout started by
 * `startPaymentSetupAction`. We capture the resulting on-demand subscription
 * onto their app so it can be charged off-session later.
 *
 * Security: unlike the temporary `billing-test` route (secret in the query), this
 * re-authenticates via the session cookie the browser carries back and re-checks
 * that the logged-in user owns `appId`. No secret in the URL. captureMandate is
 * idempotent, so a refreshed return page just re-captures the same subscription.
 */
function back(status: string): NextResponse {
  // 303 so the browser issues a clean GET to /dashboard after the checkout POST flow.
  return NextResponse.redirect(`${siteUrl()}/dashboard?pago=${status}`, 303);
}

export async function GET(req: Request): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(`${siteUrl()}/acceder`, 303);

  const appId = new URL(req.url).searchParams.get("appId");
  if (!appId || !z.string().uuid().safeParse(appId).success) return back("error");
  if (!isDodoConfigured()) return back("nocfg");

  const { apps } = schema;
  const rows = await getDb()
    .select({
      ownerUserId: apps.ownerUserId,
      ownerEmail: apps.ownerEmail,
      dodoCustomerId: apps.dodoCustomerId,
    })
    .from(apps)
    .where(eq(apps.id, appId))
    .limit(1);
  const app = rows[0];
  // Ownership guard: only the app's owner may capture a mandate onto it.
  if (!app || app.ownerUserId !== user.id) return back("error");

  try {
    // Reuse the stored customer, or find the one Dodo created for this email
    // during the checkout (same fallback the admin harness uses).
    let customerId = app.dodoCustomerId ?? undefined;
    if (!customerId) {
      const page = await getDodo().customers.list({ email: app.ownerEmail });
      const items =
        (page as unknown as { items?: Array<{ customer_id?: string }> }).items ??
        (page as unknown as { data?: Array<{ customer_id?: string }> }).data ??
        [];
      customerId = items[0]?.customer_id;
    }
    if (!customerId) return back("error");

    const res = await captureMandate(appId, customerId);
    return back(res.ok ? "ok" : "error");
  } catch (err) {
    console.error("[billing/return] capture failed:", err);
    return back("error");
  }
}
