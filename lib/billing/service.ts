import "server-only";
import { and, eq, inArray, isNotNull, lte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { App, BillingDay, Charge } from "@/db/schema";
import { chargeMandate, findMandateForCustomer, isDodoConfigured } from "@/lib/billing/dodo";
import { prorationChargeCents } from "@/lib/billing/proration";

const { apps, billingDays, charges } = schema;

const MAX_ATTEMPTS = 3;
// Retry offsets from the charge's createdAt: attempt 1 immediate, 2 at +2h, 3 at +6h.
const RETRY_OFFSET_HOURS: Record<number, number> = { 1: 2, 2: 6 };

/** Today's UTC calendar day as 'YYYY-MM-DD' (matches the `date` column). */
export function utcDay(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Best-effort alert (cron/charge failures). Always logs; POSTs to
 *  ALERT_WEBHOOK_URL if configured. Never throws. */
async function alert(message: string, context?: Record<string, unknown>): Promise<void> {
  console.error("[billing][ALERT]", message, context ? JSON.stringify(context) : "");
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "rankly-billing", message, context }),
    });
  } catch {
    /* swallow — alerting must never break billing */
  }
}

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
    .onConflictDoNothing({ target: [billingDays.appId, billingDays.day] });
  const rows = await db
    .select()
    .from(billingDays)
    .where(and(eq(billingDays.appId, appId), eq(billingDays.day, day)))
    .limit(1);
  return rows[0]!;
}

/** True if a charge is still in flight for this billing day (Dodo rejects a
 *  second charge while one is processing, so we serialize). */
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
  | { ok: true; chargeId: string; paymentId: string }
  | {
      ok: false;
      reason: "no_charge_needed" | "busy" | "not_configured" | "no_mandate" | "error";
      detail?: string;
    };

/** Insert a charge (idempotent by key) and fire the first off-session attempt. */
async function createAndFireCharge(
  app: App,
  billingDay: BillingDay,
  kind: "daily" | "diff",
  amountCents: number,
  idempotencyKey: string,
): Promise<FireResult> {
  const db = getDb();

  if (!isDodoConfigured()) return { ok: false, reason: "not_configured" };
  if (!app.dodoSubscriptionId) return { ok: false, reason: "no_mandate" };
  if (await hasChargeInFlight(billingDay.id)) return { ok: false, reason: "busy" };

  const dupe = await db
    .select({ id: charges.id, dodoPaymentId: charges.dodoPaymentId })
    .from(charges)
    .where(eq(charges.idempotencyKey, idempotencyKey))
    .limit(1);
  if (dupe[0]) {
    return dupe[0].dodoPaymentId
      ? { ok: true, chargeId: dupe[0].id, paymentId: dupe[0].dodoPaymentId }
      : { ok: false, reason: "busy" };
  }

  const inserted = await db
    .insert(charges)
    .values({
      appId: app.id,
      billingDayId: billingDay.id,
      kind,
      amountCents,
      idempotencyKey,
      status: "pending",
      attempts: 1,
    })
    .onConflictDoNothing({ target: charges.idempotencyKey })
    .returning({ id: charges.id });
  const chargeId = inserted[0]?.id;
  if (!chargeId) return { ok: false, reason: "busy" }; // lost the race

  return fireAttempt(app.dodoSubscriptionId, chargeId, amountCents, 1, {
    app_id: app.id,
    billing_day: billingDay.day,
    charge_id: chargeId,
    kind,
  });
}

/** Fire (or re-fire) one Dodo attempt for an existing charge row. The Dodo
 *  idempotency key includes the attempt number so a genuine retry isn't deduped. */
async function fireAttempt(
  subscriptionId: string,
  chargeId: string,
  amountCents: number,
  attempt: number,
  metadata: Record<string, string>,
): Promise<FireResult> {
  const db = getDb();
  try {
    const res = await chargeMandate({
      subscriptionId,
      amountCents,
      metadata,
      idempotencyKey: `${chargeId}:${attempt}`,
    });
    await db
      .update(charges)
      .set({ dodoPaymentId: res.paymentId, status: "processing", nextRetryAt: null, updatedAt: new Date() })
      .where(eq(charges.id, chargeId));
    return { ok: true, chargeId, paymentId: res.paymentId };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    // Treat an API error like a failed attempt so the retry schedule kicks in.
    await handleAttemptFailure(chargeId, detail);
    return { ok: false, reason: "error", detail };
  }
}

/** Daily base charge for one app (cron). Full amount on a fresh day; on a day
 *  that already has confirmed charges, only the proration diff. */
export async function runDailyChargeForApp(app: App): Promise<FireResult> {
  const target = app.desiredDailyAmountCents;
  if (target <= 0) return { ok: false, reason: "no_charge_needed" };

  const day = utcDay();
  const bd = await getOrCreateBillingDay(app.id, day, target);
  if (bd.targetAmountCents !== target) {
    await getDb()
      .update(billingDays)
      .set({ targetAmountCents: target, updatedAt: new Date() })
      .where(eq(billingDays.id, bd.id));
    bd.targetAmountCents = target;
  }

  const toCharge = prorationChargeCents({ targetCents: target, alreadyChargedCents: bd.chargedAmountCents });
  if (toCharge <= 0) return { ok: false, reason: "no_charge_needed" };
  return createAndFireCharge(app, bd, "daily", toCharge, `daily:${app.id}:${day}`);
}

/**
 * Owner changed their bid (dashboard slider — NOT wired yet). Sets desired
 * immediately; a raise charges the diff now, a drop charges nothing (applies to
 * the next day's cron). Ranking only moves when the charge confirms.
 */
export async function applyBidChange(appId: string, newDesiredCents: number): Promise<FireResult> {
  const db = getDb();
  const rows = await db.select().from(apps).where(eq(apps.id, appId)).limit(1);
  const app = rows[0];
  if (!app) return { ok: false, reason: "error", detail: "app not found" };

  await db.update(apps).set({ desiredDailyAmountCents: newDesiredCents }).where(eq(apps.id, appId));

  const day = utcDay();
  const bd = await getOrCreateBillingDay(appId, day, newDesiredCents);
  await db
    .update(billingDays)
    .set({ targetAmountCents: newDesiredCents, updatedAt: new Date() })
    .where(eq(billingDays.id, bd.id));

  const toCharge = prorationChargeCents({ targetCents: newDesiredCents, alreadyChargedCents: bd.chargedAmountCents });
  if (toCharge <= 0) return { ok: false, reason: "no_charge_needed" };
  return createAndFireCharge({ ...app, desiredDailyAmountCents: newDesiredCents }, bd, "diff", toCharge, `diff:${appId}:${day}:${newDesiredCents}`);
}

/** After the owner completes the mandate checkout, capture the resulting
 *  on-demand subscription id (+ billing country) onto their app so we can charge
 *  it off-session later. Called from the checkout return handler. */
export async function captureMandate(
  appId: string,
  dodoCustomerId: string,
): Promise<{ ok: boolean; subscriptionId?: string }> {
  const mandate = await findMandateForCustomer(dodoCustomerId);
  if (!mandate) return { ok: false };
  await getDb()
    .update(apps)
    .set({
      dodoSubscriptionId: mandate.subscriptionId,
      dodoCustomerId,
      dodoBillingCountry: mandate.billingCountry,
    })
    .where(eq(apps.id, appId));
  return { ok: true, subscriptionId: mandate.subscriptionId };
}

async function loadCharge(id: string): Promise<Charge | undefined> {
  const rows = await getDb().select().from(charges).where(eq(charges.id, id)).limit(1);
  return rows[0];
}

/** Resolve a charge from a webhook by Dodo payment id, falling back to the
 *  charge id we put in metadata (covers a crash before we stored the payment id). */
async function resolveCharge(dodoPaymentId?: string, chargeId?: string): Promise<Charge | undefined> {
  const db = getDb();
  if (dodoPaymentId) {
    const byPay = await db.select().from(charges).where(eq(charges.dodoPaymentId, dodoPaymentId)).limit(1);
    if (byPay[0]) return byPay[0];
  }
  if (chargeId) {
    const byId = await loadCharge(chargeId);
    if (byId && dodoPaymentId && !byId.dodoPaymentId) {
      await db.update(charges).set({ dodoPaymentId, updatedAt: new Date() }).where(eq(charges.id, byId.id));
    }
    return byId;
  }
  return undefined;
}

/** Webhook: a charge settled. Idempotent. Bumps the day's confirmed total and
 *  (only now) the app's effective ranking amount; clears any billing alert. */
export async function markChargeSucceeded(dodoPaymentId?: string, chargeId?: string): Promise<void> {
  const db = getDb();
  const charge = await resolveCharge(dodoPaymentId, chargeId);
  if (!charge || charge.status === "succeeded") return;

  await db.update(charges).set({ status: "succeeded", nextRetryAt: null, updatedAt: new Date() }).where(eq(charges.id, charge.id));

  const bdRows = await db.select().from(billingDays).where(eq(billingDays.id, charge.billingDayId)).limit(1);
  const bd = bdRows[0];
  if (!bd) return;
  const newCharged = bd.chargedAmountCents + charge.amountCents;
  await db
    .update(billingDays)
    .set({ chargedAmountCents: newCharged, status: newCharged >= bd.targetAmountCents ? "active" : "pending", updatedAt: new Date() })
    .where(eq(billingDays.id, bd.id));

  // Ranking rises only now that money is confirmed; clear any failure notice.
  await db
    .update(apps)
    .set({ dailyAmountCents: newCharged, plan: "paid", billingAlertAt: null })
    .where(eq(apps.id, charge.appId));
}

/** Webhook: a charge attempt failed. Schedules the next retry, or (after the
 *  last attempt) drops the app to free and raises the dashboard notice. */
export async function markChargeFailed(dodoPaymentId?: string, chargeId?: string, error?: string): Promise<void> {
  const charge = await resolveCharge(dodoPaymentId, chargeId);
  if (!charge || charge.status === "succeeded") return;
  await handleAttemptFailure(charge.id, error ?? "payment failed");
}

async function handleAttemptFailure(chargeId: string, error: string): Promise<void> {
  const db = getDb();
  const charge = await loadCharge(chargeId);
  if (!charge || charge.status === "succeeded") return;

  if (charge.attempts >= MAX_ATTEMPTS) {
    // Out of retries → drop to free for the day + notify the owner.
    await db.update(charges).set({ status: "failed", error, nextRetryAt: null, updatedAt: new Date() }).where(eq(charges.id, charge.id));
    await db.update(apps).set({ dailyAmountCents: 0, plan: "free", billingAlertAt: new Date() }).where(eq(apps.id, charge.appId));
    await alert("charge failed after all retries — app dropped to free", { chargeId: charge.id, appId: charge.appId });
    return;
  }
  const offsetH = RETRY_OFFSET_HOURS[charge.attempts] ?? 6;
  const nextRetryAt = new Date(charge.createdAt.getTime() + offsetH * 3600_000);
  await db.update(charges).set({ status: "failed", error, nextRetryAt, updatedAt: new Date() }).where(eq(charges.id, charge.id));
}

/** Re-fire a failed charge that's due for retry (cron self-healing). */
async function retryCharge(charge: Charge): Promise<void> {
  const db = getDb();
  const appRows = await db.select().from(apps).where(eq(apps.id, charge.appId)).limit(1);
  const app = appRows[0];
  if (!app?.dodoSubscriptionId) return;
  if (await hasChargeInFlight(charge.billingDayId)) return; // don't stack

  const attempt = charge.attempts + 1;
  await db.update(charges).set({ attempts: attempt, status: "pending", updatedAt: new Date() }).where(eq(charges.id, charge.id));
  await fireAttempt(app.dodoSubscriptionId, charge.id, charge.amountCents, attempt, {
    app_id: app.id,
    billing_day: charge.billingDayId,
    charge_id: charge.id,
    kind: charge.kind,
  });
}

/** Cron self-healing: re-fire failed charges whose retry time has arrived. */
export async function processDueRetries(): Promise<number> {
  const db = getDb();
  const due = await db
    .select()
    .from(charges)
    .where(
      and(
        eq(charges.status, "failed"),
        lte(charges.attempts, MAX_ATTEMPTS - 1),
        isNotNull(charges.nextRetryAt),
        lte(charges.nextRetryAt, new Date()),
      ),
    );
  for (const c of due) await retryCharge(c);
  return due.length;
}

/** Run the daily base charge for every eligible paying app, then process any due
 *  retries. Idempotent per app+day, so a re-run (self-healing) never double-charges. */
export async function runDailyBilling(): Promise<{
  processed: number;
  charged: number;
  skipped: number;
  errors: number;
  retried: number;
}> {
  const db = getDb();
  const eligible = await db
    .select()
    .from(apps)
    .where(
      and(
        eq(apps.status, "approved"),
        sql`${apps.desiredDailyAmountCents} > 0`,
        isNotNull(apps.dodoSubscriptionId),
      ),
    );

  let charged = 0, skipped = 0, errors = 0;
  for (const app of eligible) {
    try {
      const r = await runDailyChargeForApp(app);
      if (r.ok) charged++;
      else if (r.reason === "error") errors++;
      else skipped++;
    } catch (err) {
      errors++;
      await alert("daily charge threw", { appId: app.id, err: String(err) });
    }
  }
  const retried = await processDueRetries();
  if (errors > 0) await alert("daily billing finished with errors", { errors, processed: eligible.length });
  return { processed: eligible.length, charged, skipped, errors, retried };
}
