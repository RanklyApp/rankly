import { NextResponse } from "next/server";
import { verifyDodoWebhook } from "@/lib/billing/dodo";
import { markChargeFailed, markChargeSucceeded } from "@/lib/billing/service";

// Node runtime: signature verification needs Node crypto, and we read the raw
// body for the Standard-Webhooks HMAC.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dodo Payments webhook. Standard Webhooks signature (headers webhook-id /
 * webhook-signature / webhook-timestamp), verified by the SDK's unwrap(). This
 * is the source of truth that money moved — the ranking rises only from here.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const headers = {
    "webhook-id": req.headers.get("webhook-id") ?? "",
    "webhook-signature": req.headers.get("webhook-signature") ?? "",
    "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
  };

  let event;
  try {
    event = verifyDodoWebhook(raw, headers);
  } catch {
    // Bad/forged signature — reject. Do not process.
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  try {
    const data = (event as { data?: { payment_id?: string; metadata?: Record<string, string> } }).data;
    const paymentId = data?.payment_id;
    // Reconciliation fallback: match by the charge id we set in metadata, in case
    // we crashed before storing the Dodo payment id.
    const chargeId = data?.metadata?.charge_id;
    switch (event.type) {
      case "payment.succeeded":
        await markChargeSucceeded(paymentId, chargeId);
        break;
      case "payment.failed":
      case "payment.cancelled":
        await markChargeFailed(paymentId, chargeId, event.type);
        break;
      case "payment.processing":
      default:
        // processing = no-op (we already set processing on fire); others
        // (refunds, disputes, subscription.*) not handled yet.
        break;
    }
  } catch (err) {
    // Signature was valid but processing failed — 500 so Dodo retries.
    console.error("[webhooks/dodo] processing error:", err);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
