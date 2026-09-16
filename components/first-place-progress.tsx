import type { CSSProperties } from "react";
import { MedalMark, type MedalVariant } from "@/components/medal-mark";
import {
  FIRST_PLACE_GOLD_SECONDS,
  FIRST_PLACE_SILVER_SECONDS,
  SECONDS_PER_DAY,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

/** "12 d 5 h en el puesto #1" — coarse, human-readable accrued time. */
function formatAccrued(totalSeconds: number): string {
  if (totalSeconds <= 0) return "Todavía sin tiempo en el puesto #1";
  const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
  const hours = Math.floor((totalSeconds % SECONDS_PER_DAY) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts: string[] = [];
  if (days) parts.push(`${days} d`);
  if (hours) parts.push(`${hours} h`);
  if (minutes || parts.length === 0) parts.push(`${minutes} min`);
  return `${parts.join(" ")} en el puesto #1`;
}

/** A small medal sitting centered on the bar line at a milestone position. */
function LineMedal({
  variant,
  left,
  unlocked,
}: {
  variant: MedalVariant;
  left: string;
  unlocked: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2",
        "drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] transition-opacity",
        !unlocked && "opacity-35 grayscale",
      )}
      style={{ left }}
    >
      <MedalMark variant={variant} height={16} />
    </span>
  );
}

/**
 * Progress toward the first-place plaques for one business. Integrated into the
 * page (no card): a subtle amber/gold pill bar that grows on mount, with the
 * silver plaque sitting on the halfway mark (50 days) and the gold plaque at the
 * end (100 days). Reflects the app's real accrued #1 time.
 *
 * Pure display, no interactivity — safe as a server component. Fill animation
 * and shimmer are CSS (see .fp-fill in globals.css).
 */
export function FirstPlaceProgress({ secondsTotal }: { secondsTotal: number }) {
  const total = Math.max(0, secondsTotal);
  const progress = Math.min(total / FIRST_PLACE_GOLD_SECONDS, 1);
  const pct = Math.round(progress * 100);
  // Silver = exactly half of gold (50 vs 100 days) → it lands at the 50% mark.
  const silverUnlocked = total >= FIRST_PLACE_SILVER_SECONDS;
  const goldUnlocked = total >= FIRST_PLACE_GOLD_SECONDS;

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Tiempo en el puesto #1
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatAccrued(total)}
          </p>
        </div>
        <p className="shrink-0 font-semibold tabular-nums leading-none text-[#FBBF24]">
          <span className="text-2xl">{pct}</span>
          <span className="text-sm text-[#FBBF24]/70">%</span>
        </p>
      </div>

      {/* Bar. Horizontal padding leaves room for the end medal to sit on the
          line without clipping. */}
      <div className="mt-4 px-2">
        <div className="relative h-1.5 rounded-full bg-white/10">
          {pct > 0 && (
            <div
              className="fp-fill absolute inset-y-0 left-0 rounded-full"
              style={{ "--fp-w": `${pct}%` } as CSSProperties}
            />
          )}
          <LineMedal variant="silver" left="50%" unlocked={silverUnlocked} />
          <LineMedal variant="gold" left="100%" unlocked={goldUnlocked} />
        </div>
      </div>
    </div>
  );
}
