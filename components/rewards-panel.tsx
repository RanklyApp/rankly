import { AppLogo } from "@/components/app-logo";
import { Plaque, type PlaqueVariant } from "@/components/plaque";
import {
  FIRST_PLACE_GOLD_SECONDS,
  FIRST_PLACE_SILVER_SECONDS,
  SECONDS_PER_DAY,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const PLAQUE_SRC: Record<PlaqueVariant, string> = {
  silver: "/placas/placa-plata.png",
  gold: "/placas/placa-oro.png",
};

/** A milestone plaque sitting above the meter at its day position, with a
 *  caption and a hairline tick pointing to the exact spot on the bar. Each
 *  plaque carries its own neon (cool silver / warm gold). */
function PlaqueSlot({
  variant,
  left,
  label,
  unlocked,
}: {
  variant: PlaqueVariant;
  left: string;
  label: string;
  unlocked: boolean;
}) {
  return (
    <div
      className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
      style={{ left }}
    >
      <Plaque
        variant={variant}
        src={PLAQUE_SRC[variant]}
        label={label}
        unlocked={unlocked}
        // The 100-day gold plaque is the top prize — noticeably larger than the
        // 50-day silver. Both shrink on mobile (via --pw) so the gold plaque,
        // which floats at the 100% mark, doesn't overhang the screen edge.
        width={variant === "gold" ? 160 : 112}
        className={
          variant === "gold"
            ? "[--pw:124px] sm:[--pw:160px]"
            : "[--pw:92px] sm:[--pw:112px]"
        }
      />
      <span
        className={cn(
          "mt-1 whitespace-nowrap text-xs font-medium tabular-nums",
          unlocked ? "text-white/90" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span aria-hidden className="mt-1.5 h-3 w-px bg-white/15" />
    </div>
  );
}

/**
 * The "Recompensas" centerpiece for one business: a large logo under a soft,
 * diffuse amber halo, the accrued #1 time as an oversized hero number, and a
 * wide, thick, sunken achievement meter — the dominant element — whose glossy
 * amber fill grows toward the 100-day gold plaque, with the silver plaque at the
 * 50-day halfway point. The plaques are real 3D images (own neon) that spin on
 * tap. Reflects the app's real accrued #1 seconds; fill grow/shimmer are CSS.
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
    // overflow-x-clip: a backstop so a plaque's faint outer halo can never add a
    // horizontal scrollbar on small screens (positions are already inset to fit).
    <div className="flex w-full max-w-3xl flex-col items-center overflow-x-clip px-4 text-center">
      {/* Big logo under a soft, diffuse amber halo — no hard ring, no strong
          neon (that belongs to the plaques). */}
      <div className="relative flex items-center justify-center">
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,0.16), transparent 68%)",
          }}
        />
        <span className="drop-shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
          <AppLogo name={name} logoUrl={logoUrl} url={url} size={128} />
        </span>
      </div>

      {/* Hero number: accrued days at #1. */}
      <div className="mt-8">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-7xl font-semibold leading-none tabular-nums text-[#FBBF24] sm:text-8xl">
            {days}
          </span>
          <span className="text-xl font-medium text-[#FBBF24]/70 sm:text-2xl">
            {days === 1 ? "día" : "días"}
          </span>
        </div>
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          en el puesto #1
        </p>
      </div>

      {/* Achievement meter — the dominant element. Plaques float over a wide,
          thick, carved track. Horizontal padding reserves room for the gold
          plaque's half-width overhang at the 100% mark (responsive to its size)
          so nothing spills past the panel on small screens. */}
      <div className="mt-12 w-full px-16 sm:px-20">
        <div className="relative h-44">
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

        {/* Deep, carved track: much darker than the page, a strong inset shadow,
            and a lit top rim so it reads as a real groove. */}
        <div className="relative h-16 w-full overflow-hidden rounded-full border border-white/[0.06] bg-[#050b1c] shadow-[inset_0_4px_14px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-3px_8px_rgba(0,0,0,0.6)]">
          {pct > 0 && (
            <div
              className="fp-fill absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${pct}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
