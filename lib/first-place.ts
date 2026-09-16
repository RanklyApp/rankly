import "server-only";
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ACCRUAL_MAX_DELTA_SECONDS } from "@/lib/constants";

const { apps, rankingLeader } = schema;

// The singleton row key. There is exactly one global #1 across the directory.
const LEADER_ROW_ID = "global";

export interface AccrualResult {
  /** App credited for the just-elapsed interval (the previous #1), or null. */
  creditedAppId: string | null;
  /** Seconds credited this tick (post-clamp). 0 on first run / no prior leader. */
  deltaSeconds: number;
  /** App holding #1 right now (null when no paid app qualifies). */
  currentLeaderId: string | null;
}

/**
 * Whole seconds between two instants, floored and clamped to [0, max]. Pure —
 * unit tested. Clamps out clock skew (negative deltas) and long scheduler
 * outages (a huge delta would otherwise dump hours of credit at once).
 */
export function clampDelta(
  fromMs: number,
  toMs: number,
  maxSeconds = ACCRUAL_MAX_DELTA_SECONDS,
): number {
  const seconds = Math.floor((toMs - fromMs) / 1000);
  if (seconds <= 0) return 0;
  return Math.min(seconds, maxSeconds);
}

/**
 * One accrual tick. Credits the app that held global #1 during the just-elapsed
 * interval with the real seconds since the last tick, then records the current
 * #1 and `now` for the next tick. Designed to be called on a short interval by a
 * scheduler (external cron or Vercel cron) — see app/api/cron/first-place-accrual.
 *
 * Global #1 = the approved, paying app (plan 'paid', bid > 0) with the highest
 * daily bid, breaking ties by newest then id — matching `byPaidRank` in
 * lib/rank.ts. When no paid app qualifies, no one accrues.
 *
 * The whole tick runs in a transaction so the credit and the state advance
 * commit together (or not at all).
 */
export async function accrueFirstPlace(
  now: Date = new Date(),
): Promise<AccrualResult> {
  const db = getDb();

  return db.transaction(async (tx) => {
    // Current global #1 among paying, approved apps.
    const leaderRows = await tx
      .select({ id: apps.id })
      .from(apps)
      .where(
        and(
          eq(apps.status, "approved"),
          eq(apps.plan, "paid"),
          gt(apps.dailyAmountCents, 0),
        ),
      )
      .orderBy(desc(apps.dailyAmountCents), desc(apps.createdAt), asc(apps.id))
      .limit(1);
    const currentLeaderId = leaderRows[0]?.id ?? null;

    // Prior state (who was #1 + when we last settled).
    const stateRows = await tx
      .select()
      .from(rankingLeader)
      .where(eq(rankingLeader.id, LEADER_ROW_ID))
      .limit(1);
    const prev = stateRows[0] ?? null;

    let creditedAppId: string | null = null;
    let deltaSeconds = 0;

    // Credit the previous holder for the interval it held #1. On the first run
    // (no prior state / no prior leader) there's nothing to credit yet.
    if (prev?.leaderAppId) {
      deltaSeconds = clampDelta(prev.lastAccrualAt.getTime(), now.getTime());
      if (deltaSeconds > 0) {
        creditedAppId = prev.leaderAppId;
        await tx
          .update(apps)
          .set({
            firstPlaceSecondsTotal: sql`${apps.firstPlaceSecondsTotal} + ${deltaSeconds}`,
          })
          .where(eq(apps.id, prev.leaderAppId));
      }
    }

    // Advance the singleton: current leader becomes the one we'll credit next.
    await tx
      .insert(rankingLeader)
      .values({
        id: LEADER_ROW_ID,
        leaderAppId: currentLeaderId,
        lastAccrualAt: now,
      })
      .onConflictDoUpdate({
        target: rankingLeader.id,
        set: { leaderAppId: currentLeaderId, lastAccrualAt: now },
      });

    return { creditedAppId, deltaSeconds, currentLeaderId };
  });
}
