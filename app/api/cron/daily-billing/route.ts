import { NextResponse } from "next/server";
import { isDodoConfigured } from "@/lib/billing/dodo";
import { runDailyBilling } from "@/lib/billing/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Safety cap: billing can be slow (off-session charges). Allow up to 5 min.
export const maxDuration = 300;

/**
 * Daily billing cron. Charges every eligible paying app its desired bid for the
 * day (off-session, against the saved Dodo method). Scheduled via vercel.json.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when the
 * CRON_SECRET env var is set. We require it so the endpoint isn't publicly
 * runnable. Configure the schedule + CRON_SECRET before this does anything.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isDodoConfigured()) {
    // Credentials not set yet — no-op instead of erroring.
    return NextResponse.json({ skipped: "dodo not configured" });
  }

  const summary = await runDailyBilling();
  return NextResponse.json({ ok: true, ...summary });
}
