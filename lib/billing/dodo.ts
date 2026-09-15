import "server-only";
import DodoPayments from "dodopayments";

/**
 * Dodo Payments adapter — the ONLY place that talks to Dodo's API, so swapping
 * providers later means rewriting just this file.
 *
 * MODEL (verified in test mode, 2026-09-15):
 * Off-session arbitrary charging needs an **on-demand subscription mandate**, not
 * a one-time payment. A plain Single-Payment checkout does NOT save a reusable
 * method (confirmed: 0 saved methods after a succeeded one-time checkout). The
 * mandate is created by a checkout with `subscription_data.on_demand.mandate_only`
 * on a RECURRING product (one-time products are rejected: 422 "Subscription data
 * configuration is only allowed for subscription products"). Afterwards we charge
 * arbitrary amounts with `subscriptions.charge(subId, { product_price })`.
 * Ref: Dodo docs "On-Demand Subscriptions" / "Upsells & Downsells".
 *
 * Amounts: product_price is in USD cents (our bid). Dodo shows the buyer their
 * local currency (adaptive pricing) but settles to us in USD (settlement_amount).
 */

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[billing] missing env ${name}`);
  return v;
}

/** True when Dodo env vars are present — lets cron/webhook no-op safely before
 *  credentials are configured. */
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

export interface MandateCheckoutArgs {
  /** Existing Dodo customer, if the owner already has one. */
  customerId?: string;
  /** Otherwise create/attach by email. */
  customerEmail?: string;
  returnUrl: string;
  metadata?: Record<string, string>;
}

/** Create a checkout session that authorizes an on-demand mandate (no charge).
 *  Returns the hosted checkout URL to send the owner to. */
export async function createMandateCheckout(
  args: MandateCheckoutArgs,
): Promise<{ checkoutUrl: string; sessionId: string }> {
  const dodo = getDodo();
  const s = await dodo.checkoutSessions.create({
    product_cart: [{ product_id: requireEnv("DODO_PRODUCT_ID"), quantity: 1 }],
    subscription_data: { on_demand: { mandate_only: true } },
    customer: args.customerId
      ? { customer_id: args.customerId }
      : ({ email: args.customerEmail } as never),
    return_url: args.returnUrl,
    metadata: args.metadata,
  });
  if (!s.checkout_url) throw new Error("[billing] Dodo returned no checkout_url");
  return { checkoutUrl: s.checkout_url, sessionId: s.session_id };
}

export interface ChargeMandateArgs {
  /** The on-demand subscription (mandate) id saved on the app. */
  subscriptionId: string;
  /** Amount to charge in USD cents (whole dollars). */
  amountCents: number;
  metadata: Record<string, string>;
  /** Distinct per attempt so Dodo doesn't dedupe a genuine retry. */
  idempotencyKey: string;
}

/** Fire an off-session charge against the mandate. Returns the Dodo payment id;
 *  final status arrives via the `payment.succeeded`/`failed` webhook (settlement
 *  can take up to ~48h on Indian cards). */
export async function chargeMandate(
  args: ChargeMandateArgs,
): Promise<{ paymentId: string }> {
  const dodo = getDodo();
  const res = await dodo.subscriptions.charge(
    args.subscriptionId,
    { product_price: args.amountCents, metadata: args.metadata },
    { idempotencyKey: args.idempotencyKey },
  );
  return { paymentId: (res as { payment_id: string }).payment_id };
}

/** Look up the on-demand mandate subscription id for a customer (used to capture
 *  it after the owner completes the mandate checkout). Returns the newest active
 *  on-demand subscription, or null. */
export async function findMandateForCustomer(
  customerId: string,
): Promise<{ subscriptionId: string; billingCountry: string | null } | null> {
  const dodo = getDodo();
  const list = await dodo.subscriptions.list({ customer_id: customerId, page_size: 10 });
  const items = (list as unknown as { items?: Array<Record<string, unknown>> }).items ?? [];
  const mandate =
    items.find((s) => s.status === "active" && s.on_demand === true) ?? items[0];
  if (!mandate) return null;
  const billing = mandate.billing as { country?: string } | undefined;
  return {
    subscriptionId: mandate.subscription_id as string,
    billingCountry: billing?.country ?? null,
  };
}

/** Verify + parse a webhook using the Standard-Webhooks signature headers.
 *  Throws if the signature is invalid. */
export function verifyDodoWebhook(rawBody: string, headers: Record<string, string>) {
  return getDodo().webhooks.unwrap(rawBody, {
    headers,
    key: requireEnv("DODO_PAYMENTS_WEBHOOK_KEY"),
  });
}
