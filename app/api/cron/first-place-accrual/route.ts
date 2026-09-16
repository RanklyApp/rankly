import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db";
import { accrueFirstPlace } from "@/lib/first-place";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * First-place accrual tick. Credits the app that held the global #1 spot with
 * the real seconds elapsed since the previous tick, then records the current
 * #1. Meant to run on a short interval — the more often it fires, the finer the
 * accrual (it credits real elapsed time, so any cadence is correct, only the
 * granularity and outage window differ).
 *
 * Scheduling: Vercel cron (vercel.json) only goes sub-daily on Pro. For a
 * shorter interval on Hobby, point an external scheduler (cron-job.org, GitHub
 * Actions, Upstash QStash…) at this path with the same Bearer secret.
 *
 * Auth: requires `Authorization: Bearer $CRON_SECRET` (same secret as the
 * billing cron) so the endpoint isn't publicly runnable.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured()) {
    // No database yet — no-op instead of erroring.
    return NextResponse.json({ skipped: "database not configured" });
  }

  const result = await accrueFirstPlace();
  return NextResponse.json({ ok: true, ...result });
}
