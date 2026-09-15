/**
 * Proration — pure functions, no I/O. The daily billing rules for a bid:
 *
 *  - New day: charge the full bid for that day.
 *  - Raise mid-day: charge only the DIFFERENCE vs. what's already been charged
 *    today (you already paid the lower amount for today).
 *  - Lower mid-day: charge NOTHING today (the higher amount was already paid);
 *    the lower amount takes effect on the next day's charge.
 *
 * Bids are whole dollars (enforced in schema + validations), so a positive diff
 * is always >= $1 — Dodo Payments' minimum charge. See [[decision-daily-amounts]].
 */

/** Amount to charge NOW for a target vs. what's already confirmed-charged today.
 *  Returns cents to charge (0 when lowering/unchanged). Never negative — we do
 *  not refund a mid-day decrease. */
export function prorationChargeCents(input: {
  /** Desired bid for the day, in cents (whole dollars). */
  targetCents: number;
  /** Sum already successfully charged for this day, in cents. 0 on a new day. */
  alreadyChargedCents: number;
}): number {
  const diff = input.targetCents - input.alreadyChargedCents;
  return diff > 0 ? diff : 0;
}

/** True when a bid change should trigger an immediate off-session charge. */
export function shouldChargeNow(input: {
  targetCents: number;
  alreadyChargedCents: number;
}): boolean {
  return prorationChargeCents(input) > 0;
}
