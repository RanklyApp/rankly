import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { App, BillingDay } from "@/db/schema";
import { chargeSavedMethod, isDodoConfigured } from "@/lib/billing/dodo";
import { prorationChargeCents } from "@/lib/billing/proration";

const { apps, billingDays, charges } = schema;

/** Today's UTC calendar day as 'YYYY-MM-DD' (matches the `date` column). */
export function utcDay(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Get today's billing_day for an app, creating it (pending) if missing. */
async function getOrCreateBillingDay(
  appId: string,
  day: string,
  targetCents: number,
): Promise<BillingDay> {
  const db = getDb();
  const existing = await db
    .select()
    .from(billingDays)
    .where(and(eq(billingDays.appId, appId), eq(billingDays.day, day)))
    .limit(1);
  if (existing[0]) return existing[0];

  await db
    .insert(billingDays)
    .values({ appId, day, targetAmountCents: targetCents })
    .onConflictDoNothing({
      target: [billingDays.appId, billingDays.day],
    });
  const rows = await db
    .select()
    .from(billingDays)
    .where(and(eq(billingDays.appId, appId), eq(billingDays.day, day)))
    .limit(1);
  return rows[0]!;
}

/** True if a charge is still in flight for this app+day (Dodo rejects a second
 *  charge while one is processing, so we serialize per app). */
async function hasChargeInFlight(billingDayId: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: charges.id })
    .from(charges)
    .where(
      and(
        eq(charges.billingDayId, billingDayId),
        inArray(charges.status, ["pending", "processing"]),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export type FireResult =
  | { ok: true; chargeId: string; paymentId: string; status: string }
  | { ok: false; reason: "no_charge_needed" | "busy" | "not_configured" | "no_payment_method" | "error"; detail?: string };

/**
 * Insert a charge row (idempotent by key) and fire the off-session Dodo charge.
 * The webhook finalizes the money movement; if Dodo already returns 'succeeded'
 * we finalize immediately too (both paths are idempotent).
 */
async function createAndFireCharge(
  app: App,
  billingDay: BillingDay,
  kind: "daily" | "diff",
  amountCents: number,
  idempotencyKey: string,
): Promise<FireResult> {
  const db = getDb();

  if (!isDodoConfigured()) return { ok: false, reason: "not_configured" };
  if (!app.dodoCustomerId || !app.dodoPaymentMethodId || !app.dodoBillingCountry) {
    return { ok: false, reason: "no_payment_method" };
  }
  if (await hasChargeInFlight(billingDay.id)) return { ok: false, reason: "busy" };

  // Idempotency: if this exact charge was already created, don't double-charge.
  const dupe = await db
    .select({ id: charges.id, dodoPaymentId: charges.dodoPaymentId, status: charges.status })
    .from(charges)
    .where(eq(charges.idempotencyKey, idempotencyKey))
    .limit(1);
  if (dupe[0]) {
    return dupe[0].dodoPaymentId
      ? { ok: true, chargeId: dupe[0].id, paymentId: dupe[0].dodoPaymentId, status: dupe[0].status }
      : { ok: false, reason: "busy" };
  }

  const inserted = await db
    .insert(charges)
    .values({ appId: app.id, billingDayId: billingDay.id, kind, amountCents, idempotencyKey, status: "pending" })
    .onConflictDoNothing({ target: charges.idempotencyKey })
    .returning({ id: charges.id });
  const chargeId = inserted[0]?.id;
  if (!chargeId) return { ok: false, reason: "busy" }; // lost the race — another request created it

  try {
    const res = await chargeSavedMethod({
      customerId: app.dodoCustomerId,
      paymentMethodId: app.dodoPaymentMethodId,
      amountCents,
      billingCountry: app.dodoBillingCountry,
      metadata: { app_id: app.id, billing_day: billingDay.day, charge_id: chargeId, kind },
    });
    // Settlement is async — mark processing; the webhook flips it to
    // succeeded/failed and (only then) moves the ranking.
    await db
      .update(charges)
      .set({ dodoPaymentId: res.paymentId, status: "processing", updatedAt: new Date() })
      .where(eq(charges.id, chargeId));
    return { ok: true, chargeId, paymentId: res.paymentId, status: "processing" };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    await db.update(charges).set({ status: "failed", error: detail, updatedAt: new Date() }).where(eq(charges.id, chargeId));
    return { ok: false, reason: "error", detail };
  }
}

/**
 * Daily base charge for one app (called by the cron). Ensures today's
 * billing_day exists with the app's desired bid as target, then charges the
 * proration diff (on a fresh day that's the full amount).
 */
export async function runDailyChargeForApp(app: App): Promise<FireResult> {
  const target = app.desiredDailyAmountCents;
  if (target <= 0) return { ok: false, reason: "no_charge_needed" };

  const day = utcDay();
  const bd = await getOrCreateBillingDay(app.id, day, target);
  // Keep target current in case the desired bid changed since the row was made.
  if (bd.targetAmountCents !== target) {
    await getDb().update(billingDays).set({ targetAmountCents: target, updatedAt: new Date() }).where(eq(billingDays.id, bd.id));
    bd.targetAmountCents = target;
  }

  const toCharge = prorationChargeCents({ targetCents: target, alreadyChargedCents: bd.chargedAmountCents });
  if (toCharge <= 0) return { ok: false, reason: "no_charge_needed" };

  return createAndFireCharge(app, bd, "daily", toCharge, `daily:${app.id}:${day}`);
}

/**
 * Owner changed their bid (called later by the dashboard slider — NOT wired yet).
 * Sets the desired bid immediately. If it's a raise, charges the diff now; if a
 * drop, charges nothing (the drop applies to the next day's cron). Ranking only
 * moves when the diff charge confirms via webhook.
 */
export async function applyBidChange(appId: string, newDesiredCents: number): Promise<FireResult> {
  const db = getDb();
  const rows = await db.select().from(apps).where(eq(apps.id, appId)).limit(1);
  const app = rows[0];
  if (!app) return { ok: false, reason: "error", detail: "app not found" };

  await db.update(apps).set({ desiredDailyAmountCents: newDesiredCents }).where(eq(apps.id, appId));
  app.desiredDailyAmountCents = newDesiredCents;

  const day = utcDay();
  const bd = await getOrCreateBillingDay(appId, day, newDesiredCents);
  await db.update(billingDays).set({ targetAmountCents: newDesiredCents, updatedAt: new Date() }).where(eq(billingDays.id, bd.id));

  const toCharge = prorationChargeCents({ targetCents: newDesiredCents, alreadyChargedCents: bd.chargedAmountCents });
  if (toCharge <= 0) return { ok: false, reason: "no_charge_needed" }; // lowering or unchanged: nothing today

  return createAndFireCharge(app, { ...bd, targetAmountCents: newDesiredCents }, "diff", toCharge, `diff:${appId}:${day}:${newDesiredCents}`);
}

/** Webhook: a charge settled. Idempotent — safe to call repeatedly for the same
 *  Dodo payment id. Bumps the day's confirmed total and (only now) the app's
 *  effective ranking amount. */
export async function markChargeSucceeded(dodoPaymentId: string): Promise<void> {
  const db = getDb();
  const rows = await db.select().from(charges).where(eq(charges.dodoPaymentId, dodoPaymentId)).limit(1);
  const charge = rows[0];
  if (!charge || charge.status === "succeeded") return; // unknown or already applied

  await db.update(charges).set({ status: "succeeded", updatedAt: new Date() }).where(eq(charges.id, charge.id));

  const bdRows = await db.select().from(billingDays).where(eq(billingDays.id, charge.billingDayId)).limit(1);
  const bd = bdRows[0];
  if (!bd) return;
  const newCharged = bd.chargedAmountCents + charge.amountCents;
  const status = newCharged >= bd.targetAmountCents ? "active" : "pending";
  await db
    .update(billingDays)
    .set({ chargedAmountCents: newCharged, status, updatedAt: new Date() })
    .where(eq(billingDays.id, bd.id));

  // Ranking only moves now that money is confirmed.
  await db.update(apps).set({ dailyAmountCents: newCharged, plan: "paid" }).where(eq(apps.id, charge.appId));
}

/** Webhook: a charge failed. Marks the charge; leaves ranking untouched. */
export async function markChargeFailed(dodoPaymentId: string, error?: string): Promise<void> {
  const db = getDb();
  const rows = await db.select().from(charges).where(eq(charges.dodoPaymentId, dodoPaymentId)).limit(1);
  const charge = rows[0];
  if (!charge || charge.status === "succeeded") return;
  await db.update(charges).set({ status: "failed", error: error ?? null, updatedAt: new Date() }).where(eq(charges.id, charge.id));
}

/** Run the daily base charge for every eligible paying app. Called by the cron. */
export async function runDailyBilling(): Promise<{ processed: number; charged: number; skipped: number; errors: number }> {
  const db = getDb();
  const eligible = await db
    .select()
    .from(apps)
    .where(and(eq(apps.status, "approved"), sql`${apps.desiredDailyAmountCents} > 0`, sql`${apps.dodoPaymentMethodId} is not null`));

  let charged = 0, skipped = 0, errors = 0;
  for (const app of eligible) {
    const r = await runDailyChargeForApp(app);
    if (r.ok) charged++;
    else if (r.reason === "error") errors++;
    else skipped++;
  }
  return { processed: eligible.length, charged, skipped, errors };
}
