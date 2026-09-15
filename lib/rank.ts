import { MAX_PROMOTED } from "./constants";

/**
 * Minimal shape rankApps needs. Generic over T so callers keep their full
 * app type (with logo, name, etc.) in the result.
 */
export interface RankableApp {
  id: string;
  plan: "free" | "paid";
  dailyAmountCents: number;
  clicksCount: number;
  createdAt: Date | string;
}

export interface RankOptions {
  /** Cap on the promoted block. Defaults to MAX_PROMOTED. */
  maxPromoted?: number;
  /**
   * Rotation offset. When there are more paid apps than the cap, this shifts
   * which paid apps land in the promoted block, so every paid app gets
   * exposure across loads. Pure input — callers derive it (e.g. from time).
   */
  offset?: number;
}

export interface RankResult<T> {
  /** Paid apps in the promoted block (length <= maxPromoted). */
  promoted: T[];
  /** Free apps + any paid apps that overflowed the cap this load. */
  organic: T[];
  /** Convenience: [...promoted, ...organic]. */
  ordered: T[];
}

function toTime(value: Date | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

/** Amount DESC, then newest first, then id ASC for a stable total order. */
function byPaidRank(a: RankableApp, b: RankableApp): number {
  if (b.dailyAmountCents !== a.dailyAmountCents) {
    return b.dailyAmountCents - a.dailyAmountCents;
  }
  const t = toTime(b.createdAt) - toTime(a.createdAt);
  return t !== 0 ? t : a.id.localeCompare(b.id);
}

/** Clicks DESC, then newest first, then id ASC. */
function byOrganicRank(a: RankableApp, b: RankableApp): number {
  if (b.clicksCount !== a.clicksCount) {
    return b.clicksCount - a.clicksCount;
  }
  const t = toTime(b.createdAt) - toTime(a.createdAt);
  return t !== 0 ? t : a.id.localeCompare(b.id);
}

/**
 * Rank apps for a listing.
 *
 * Rules (see spec):
 *  - Promoted block: plan === 'paid', ordered by dailyAmountCents DESC.
 *    Capped at maxPromoted. When more paid apps exist than the cap, a rotating
 *    window (driven by `offset`) selects which ones appear, so all paid apps
 *    get exposure over time. Overflow paid apps fall into the organic block
 *    for that load (still visible, just without the podium placement).
 *  - Organic block: everyone else, ordered by clicksCount DESC then newest.
 *
 * Pure and deterministic: no I/O, no Date.now. Same inputs -> same output.
 */
export function rankApps<T extends RankableApp>(
  apps: T[],
  options: RankOptions = {},
): RankResult<T> {
  const maxPromoted = options.maxPromoted ?? MAX_PROMOTED;
  const offset = options.offset ?? 0;

  const paid = apps.filter((a) => a.plan === "paid").sort(byPaidRank);
  const free = apps.filter((a) => a.plan !== "paid");

  let promoted: T[];
  let overflowPaid: T[];

  if (maxPromoted <= 0 || paid.length === 0) {
    promoted = [];
    overflowPaid = paid;
  } else if (paid.length <= maxPromoted) {
    // No rotation needed — offset is irrelevant.
    promoted = paid;
    overflowPaid = [];
  } else {
    // Rotate a window of `maxPromoted` over the amount-sorted paid list.
    const start = ((offset % paid.length) + paid.length) % paid.length;
    const windowed: T[] = [];
    for (let i = 0; i < maxPromoted; i++) {
      windowed.push(paid[(start + i) % paid.length]);
    }
    const windowIds = new Set(windowed.map((a) => a.id));
    // Keep the promoted block itself ordered by amount for visual consistency.
    promoted = windowed.slice().sort(byPaidRank);
    overflowPaid = paid.filter((a) => !windowIds.has(a.id));
  }

  const organic = [...free, ...overflowPaid].sort(byOrganicRank);

  return { promoted, organic, ordered: [...promoted, ...organic] };
}
