import { Lock } from "lucide-react";
import type { CSSProperties } from "react";
import { AppLogo } from "@/components/app-logo";
import { MedalMark, type MedalVariant } from "@/components/medal-mark";
import {
  FIRST_PLACE_GOLD_SECONDS,
  FIRST_PLACE_SILVER_SECONDS,
  SECONDS_PER_DAY,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Full days remaining until `target` seconds, rounded up, floored at 0. */
function daysUntil(total: number, target: number): number {
  return Math.max(0, Math.ceil((target - total) / SECONDS_PER_DAY));
}

/**
 * Quiet supporting line under the meter. Frames the next milestone so the empty
 * state still motivates ("faltan N días…") instead of just stating zero. Pure
 * presentation over the same accrued seconds — no new data.
 */
function milestoneHint(
  total: number,
  silverUnlocked: boolean,
  goldUnlocked: boolean,
): string {
  if (goldUnlocked) return "Placas de plata y oro desbloqueadas";
  if (silverUnlocked)
    return `Placa de plata lista · faltan ${daysUntil(total, FIRST_PLACE_GOLD_SECONDS)} días para el oro`;
  if (total > 0)
    return `Faltan ${daysUntil(total, FIRST_PLACE_SILVER_SECONDS)} días para la placa de plata`;
  return "Todavía sin tiempo en el puesto #1";
}

/**
 * A milestone "plaque" slot sitting above the meter at its day position: a
 * circular framed medal that reads locked (grayscale medal + padlock) until the
 * business accrues enough #1 time, then lights up in its metal. It's a framed
 * circular slot on purpose — the owner will later drop a real plaque image in
 * here. A hairline tick drops from the slot to the exact point on the bar.
 */
function PlaqueSlot({
  variant,
  left,
  label,
  unlocked,
}: {
  variant: MedalVariant;
  left: string;
  label: string;
  unlocked: boolean;
}) {
  const ring =
    variant === "gold"
      ? "border-[#F59E0B]/60 shadow-[0_0_20px_-2px_rgba(245,158,11,0.5)]"
      : "border-[#94A3B8]/55 shadow-[0_0_18px_-2px_rgba(148,163,184,0.4)]";

  return (
    <div
      className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
      style={{ left }}
    >
      <span
        className={cn(
          "relative flex size-12 items-center justify-center rounded-full border bg-white/[0.04] backdrop-blur-sm transition-colors",
          unlocked ? ring : "border-white/12",
        )}
      >
        <MedalMark
          variant={variant}
          height={26}
          className={cn(
            "transition-[filter,opacity]",
            unlocked
              ? "drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
              : "opacity-30 grayscale",
          )}
        />
        {!unlocked && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Lock className="size-4 text-white/75" aria-hidden />
          </span>
        )}
      </span>
      <span
        className={cn(
          "mt-2 whitespace-nowrap text-[11px] font-medium tabular-nums transition-colors",
          unlocked ? "text-white/90" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      {/* Tick pointing to this milestone's spot on the bar. */}
      <span aria-hidden className="mt-1.5 h-2.5 w-px bg-white/15" />
    </div>
  );
}

/**
 * The "Recompensas" centerpiece for one business: its logo crowned by a soft
 * amber glow, the accrued #1 time as the hero stat, and a wide, sunken
 * achievement meter whose glossy amber fill grows toward the 100-day gold
 * plaque, with the silver plaque marked at the 50-day halfway point. Reflects
 * the app's real accrued #1 seconds; the fill grow + shimmer are CSS (.fp-fill).
 *
 * Pure display — safe as a server component. No accrual / bid logic here.
 */
export function RewardsPanel({
  name,
  logoUrl,
  url,
  secondsTotal,
}: {
  name: string;
  logoUrl?: string | null;
  url?: string;
  secondsTotal: number;
}) {
  const total = Math.max(0, secondsTotal);
  const days = Math.floor(total / SECONDS_PER_DAY);
  const pct = Math.round(Math.min(total / FIRST_PLACE_GOLD_SECONDS, 1) * 100);
  const silverUnlocked = total >= FIRST_PLACE_SILVER_SECONDS;
  const goldUnlocked = total >= FIRST_PLACE_GOLD_SECONDS;

  return (
    <div className="relative mx-auto flex max-w-md flex-col items-center px-2 text-center">
      {/* Radial amber glow behind the logo — the "achievement" light. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-56 w-56 -translate-x-1/2 rounded-full bg-[#F59E0B]/18 blur-[64px]"
      />

      {/* Logo — same circular disc as the ranking cards, ringed and glowing
          like the gold #1 highlight. */}
      <span className="rounded-full ring-2 ring-[#F59E0B]/55 ring-offset-4 ring-offset-[#0A1633] shadow-[0_0_34px_-4px_rgba(245,158,11,0.55)]">
        <AppLogo name={name} logoUrl={logoUrl} url={url} size={84} />
      </span>

      <h3 className="mt-6 text-lg font-semibold text-white">{name}</h3>

      {/* Hero stat: accrued time at #1. */}
      <div className="mt-4">
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="text-5xl font-semibold leading-none tabular-nums text-[#FBBF24]">
            {days}
          </span>
          <span className="text-base font-medium text-[#FBBF24]/70">
            {days === 1 ? "día" : "días"}
          </span>
        </div>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          en el puesto #1
        </p>
      </div>

      {/* Achievement meter: plaque slots floating over a wide, sunken track
          whose glossy amber fill grows to the current progress. */}
      <div className="mt-9 w-full px-8">
        <div className="relative h-[68px]">
          <PlaqueSlot
            variant="silver"
            left="50%"
            label="50 días"
            unlocked={silverUnlocked}
          />
          <PlaqueSlot
            variant="gold"
            left="100%"
            label="100 días"
            unlocked={goldUnlocked}
          />
        </div>

        {/* Sunken track: darker than the page with a real inset shadow so it
            reads as a carved groove, not a form progress bar. */}
        <div className="relative h-4 w-full overflow-hidden rounded-full border border-white/[0.06] bg-[#070f26] shadow-[inset_0_2px_6px_rgba(0,0,0,0.75),inset_0_-1px_0_rgba(255,255,255,0.04)]">
          {pct > 0 && (
            <div
              className="fp-fill absolute inset-y-0 left-0 rounded-full"
              style={{ "--fp-w": `${pct}%` } as CSSProperties}
            >
              {/* Top sheen — the glossy meter highlight. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-full bg-gradient-to-b from-white/35 to-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {/* Quiet supporting line — less prominent than the hero stat. */}
      <p className="mt-5 text-xs text-muted-foreground">
        {milestoneHint(total, silverUnlocked, goldUnlocked)}
      </p>
    </div>
  );
}
