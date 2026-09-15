import "server-only";
import DodoPayments from "dodopayments";

/**
 * Dodo Payments adapter — the ONLY place that talks to Dodo's API, so swapping
 * providers later means rewriting just this file.
 *
 * Off-session charging (charge a saved card without a visible checkout):
 *   Confirmed against Dodo's official docs — section "Upsells & Downsells"
 *   (https://docs.dodopayments.com/features/upsells-and-downsells). A payment
 *   method is saved automatically on the customer's first checkout; afterwards
 *   we charge it by passing `payment_method_id` (+ existing `customer_id`) to
 *   `payments.create`. Unlike Polar, this needs NO paid plan and NO preview flag.
 *
 * Product model: a single-payment (one-time) product with Pay-What-You-Want
 * (min $1). Each daily/diff charge is a fresh one-time payment for a custom
 * `amount`, billed to the saved method.
 */

// SDK reads bearerToken from DODO_PAYMENTS_API_KEY and webhookKey from
// DODO_PAYMENTS_WEBHOOK_KEY automatically; we pass them explicitly so a missing
// value fails loudly here instead of at request time.
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[billing] missing env ${name}`);
  return v;
}

/** True when all Dodo env vars are present — lets cron/webhook no-op safely
 *  before credentials are configured. */
export function isDodoConfigured(): boolean {
  return Boolean(
    process.env.DODO_PAYMENTS_API_KEY &&
      process.env.DODO_PAYMENTS_WEBHOOK_KEY &&
      process.env.DODO_PRODUCT_ID,
  );
}

let client: DodoPayments | null = null;
export function getDodo(): DodoPayments {
  if (!client) {
    client = new DodoPayments({
      bearerToken: requireEnv("DODO_PAYMENTS_API_KEY"),
      webhookKey: requireEnv("DODO_PAYMENTS_WEBHOOK_KEY"),
      environment:
        process.env.DODO_PAYMENTS_ENVIRONMENT === "test_mode"
          ? "test_mode"
          : "live_mode",
    });
  }
  return client;
}

export interface ChargeSavedMethodArgs {
  customerId: string;
  paymentMethodId: string;
  /** Amount to charge in cents (whole dollars). */
  amountCents: number;
  /** ISO 3166-1 alpha-2, from the customer's saved billing address. */
  billingCountry: string;
  /** Attached for webhook reconciliation (app id, billing day, charge id...). */
  metadata: Record<string, string>;
}

export interface ChargeResult {
  /** Dodo payment id — reconcile the final status via the webhook. */
  paymentId: string;
}

/**
 * Fire a one-time off-session charge against a saved payment method (PWYW custom
 * amount). The create call only returns a payment id — settlement is async (up
 * to ~48h on Indian cards), so the `payment.succeeded`/`failed` webhook is the
 * source of truth for whether it actually cleared.
 */
export async function chargeSavedMethod(
  args: ChargeSavedMethodArgs,
): Promise<ChargeResult> {
  const dodo = getDodo();
  const res = await dodo.payments.create({
    customer: { customer_id: args.customerId },
    payment_method_id: args.paymentMethodId,
    product_cart: [
      {
        product_id: requireEnv("DODO_PRODUCT_ID"),
        quantity: 1,
        // PWYW custom amount (ignored by Dodo if the product isn't PWYW).
        amount: args.amountCents,
      },
    ],
    // Country is required by the API; the rest of the address is optional for a
    // saved method. Cast: SDK types country as a CountryCode enum.
    billing: { country: args.billingCountry as never },
    metadata: args.metadata,
  });
  return { paymentId: res.payment_id };
}

/** Verify + parse a webhook using the Standard-Webhooks signature headers.
 *  Throws if the signature is invalid. */
export function verifyDodoWebhook(rawBody: string, headers: Record<string, string>) {
  return getDodo().webhooks.unwrap(rawBody, {
    headers,
    key: requireEnv("DODO_PAYMENTS_WEBHOOK_KEY"),
  });
}
