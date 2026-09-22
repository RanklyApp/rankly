"use client";

import { ChevronDown, ExternalLink, Pencil } from "lucide-react";
import type { CSSProperties } from "react";
import { useId, useState } from "react";
import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { MedalMark } from "@/components/medal-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AppListItem {
  /** DB id — only set for owner's own businesses, used for the edit link. */
  id?: string;
  name: string;
  tagline: string;
  category: string;
  url: string;
  /** Full description shown in the expandable panel. Falls back to tagline. */
  description?: string;
  logoUrl?: string | null;
  paid?: boolean;
  /** Daily amount this business pays, in cents. Only shown when the list is
   *  rendered with `showAmounts` (owner dashboard) — never in the public view. */
  dailyAmountCents?: number;
  /** Highlight this card as the logged-in owner's own business ("Tu negocio"). */
  isOwner?: boolean;
}

/** "$240/día" — bids are whole dollars, so always integer, no cents shown. */
function formatDailyAmount(cents: number): string {
  return `$${Math.round(cents / 100)}/día`;
}

// Positional hierarchy: the rank a row occupies in the list drives how
// prominent its card looks. The podium (#1 gold, #2 silver, #3 bronze) stands
// out; everything from #4 down shares one neutral "mid" style. A dimmed
// "irrelevant" tier for #11+ will come back once paid placement is enabled —
// for now the base is empty and there is no reason to make deep ranks feel
// worse than the mid band. Paid apps are surfaced by their top position, not a label.
type Tier = "gold" | "silver" | "bronze" | "mid";

function tierForRank(rank: number): Tier {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "mid";
}

interface TierStyle {
  /** Border / ring / glow applied to the card shell. */
  shell: string;
  /** Inner padding — bigger for the podium. */
  padding: string;
  /** Logo pixel size. */
  logo: number;
  /** Rank number ("#1") color. */
  rankColor: string;
  /** Color for the podium mark (crown / medal) drawn over the logo. */
  iconColor: string;
  /** Faint gold tint overlay behind the #1 card. */
  goldTint?: boolean;
}

const TIER_STYLES: Record<Tier, TierStyle> = {
  gold: {
    shell:
      "border-[#F59E0B] ring-1 ring-[#F59E0B]/60 bg-card/90 " +
      "shadow-[0_0_28px_rgba(245,158,11,0.25)] hover:shadow-[0_0_40px_rgba(245,158,11,0.38)]",
    // Horizontal padding is kept equal across tiers so the rank number / logo /
    // title columns line up between rows; only vertical padding grows for #1.
    padding: "px-4 py-5",
    logo: 56,
    rankColor: "text-[#FBBF24]",
    iconColor: "text-[#FBBF24]",
    goldTint: true,
  },
  silver: {
    shell:
      "border-[#94A3B8] ring-1 ring-[#94A3B8]/40 bg-card/90 " +
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_14px_rgba(0,0,0,0.35)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_16px_36px_-10px_rgba(0,0,0,0.55)]",
    padding: "px-4 py-[18px]",
    logo: 48,
    rankColor: "text-[#E2E8F0]",
    iconColor: "text-[#CBD5E1]",
  },
  bronze: {
    shell:
      "border-[#CD7F32] ring-1 ring-[#CD7F32]/40 bg-card/90 " +
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_14px_rgba(0,0,0,0.35)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_16px_36px_-10px_rgba(0,0,0,0.55)]",
    padding: "p-4",
    logo: 44,
    rankColor: "text-[#CD7F32]",
    iconColor: "text-[#CD7F32]",
  },
  mid: {
    shell:
      "border-white/10 bg-[#101F45]/90 " +
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.35),0_10px_30px_-12px_rgba(0,0,0,0.5)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_6px_rgba(0,0,0,0.4),0_20px_44px_-14px_rgba(0,0,0,0.6)]",
    padding: "p-4",
    logo: 40,
    rankColor: "text-[#93A5C4]",
    iconColor: "",
  },
};

// Shared "liquid glass" treatment for the two icon buttons (chevron toggle +
// external link), tuned to the dark electric-blue background. Frosted and
// translucent instead of a flat solid circle:
//  - transparent base so the blurred card/background shows through
//  - backdrop-blur + saturate = the frosted refraction
//  - a low-opacity blue tint gradient (lighter on top) for the glass color
//  - a soft white specular highlight in the upper area (bubble reflection)
//  - a bright inner top rim + darker inner bottom for glass depth
//  - an elevated drop shadow plus a soft blue glow so it floats
//  - grow on hover (glow intensifies) and sink on press
const GLASS_BUTTON_CLASS = cn(
  "size-8 rounded-full text-primary-foreground",
  "transition-all duration-200 ease-out",
  // base: inner rim light + inner bottom shade + float shadow + blue glow
  "shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),inset_0_-5px_9px_rgba(10,22,51,0.35),0_4px_14px_rgba(0,0,0,0.38),0_0_16px_rgba(59,130,246,0.35)]",
  // hover: grow + stronger glow/lift
  "hover:scale-[1.06] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.55),inset_0_-5px_9px_rgba(10,22,51,0.35),0_8px_22px_rgba(0,0,0,0.45),0_0_28px_rgba(59,130,246,0.7)]",
  // press: sink
  "active:scale-95 active:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_2px_6px_rgba(10,22,51,0.45),0_2px_8px_rgba(0,0,0,0.4),0_0_12px_rgba(59,130,246,0.4)]",
);

const GLASS_BUTTON_STYLE: CSSProperties = {
  // Transparent base kills the variant's solid bg-primary so the frosted glass
  // actually shows what's behind it.
  backgroundColor: "transparent",
  // Top layer: white specular highlight. Bottom layer: translucent blue tint.
  backgroundImage:
    "radial-gradient(70% 50% at 50% 8%, rgba(255,255,255,0.4), rgba(255,255,255,0) 60%), " +
    "linear-gradient(180deg, rgba(96,165,250,0.34) 0%, rgba(59,130,246,0.16) 45%, rgba(37,99,235,0.10) 100%)",
  backdropFilter: "blur(8px) saturate(1.5)",
  WebkitBackdropFilter: "blur(8px) saturate(1.5)",
  border: "1px solid rgba(255,255,255,0.22)",
};

/**
 * Metallic gold king's crown, drawn as a shaded SVG (not a flat icon): vertical
 * gold gradients for the body/band, a specular highlight, gold ball tips and
 * ruby gems for the "rendered" look. Sits centered on top of the #1 logo.
 */
function CrownMark({
  height,
  className,
}: {
  height: number;
  className?: string;
}) {
  return (
    <svg
      height={height}
      viewBox="0 0 48 34"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="crownBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF7CC" />
          <stop offset="0.4" stopColor="#F6CE4C" />
          <stop offset="0.7" stopColor="#D99A1C" />
          <stop offset="1" stopColor="#9A6410" />
        </linearGradient>
        <linearGradient id="crownBand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F1C64A" />
          <stop offset="0.5" stopColor="#C98A16" />
          <stop offset="1" stopColor="#8A5A0C" />
        </linearGradient>
        <radialGradient id="crownBall" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFBE6" />
          <stop offset="0.55" stopColor="#F1C64A" />
          <stop offset="1" stopColor="#B77E12" />
        </radialGradient>
        <radialGradient id="crownRuby" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FF9E9E" />
          <stop offset="0.55" stopColor="#B01E1E" />
          <stop offset="1" stopColor="#5A0E0E" />
        </radialGradient>
      </defs>

      {/* Crown body (five peaks). */}
      <path
        d="M4 21 L7 10 L12.5 17 L15.5 6.5 L19.75 16 L24 4.5 L28.25 16 L32.5 6.5 L35.5 17 L41 10 L44 21 Z"
        fill="url(#crownBody)"
        stroke="#7A4E0A"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      {/* Left-side specular sheen. */}
      <path
        d="M4 21 L7 10 L12.5 17 L15.5 6.5 L19.75 16 L24 4.5"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="0.9"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Band. */}
      <rect
        x="4"
        y="19.5"
        width="40"
        height="10.5"
        rx="2.4"
        fill="url(#crownBand)"
        stroke="#7A4E0A"
        strokeWidth="0.7"
      />
      {/* Band top highlight. */}
      <rect x="5.5" y="21" width="37" height="1.6" rx="0.8" fill="rgba(255,255,255,0.4)" />
      {/* Gold ball tips. */}
      <circle cx="7" cy="10" r="2" fill="url(#crownBall)" stroke="#7A4E0A" strokeWidth="0.5" />
      <circle cx="15.5" cy="6.5" r="2.2" fill="url(#crownBall)" stroke="#7A4E0A" strokeWidth="0.5" />
      <circle cx="24" cy="4.5" r="2.5" fill="url(#crownBall)" stroke="#7A4E0A" strokeWidth="0.5" />
      <circle cx="32.5" cy="6.5" r="2.2" fill="url(#crownBall)" stroke="#7A4E0A" strokeWidth="0.5" />
      <circle cx="41" cy="10" r="2" fill="url(#crownBall)" stroke="#7A4E0A" strokeWidth="0.5" />
      {/* Ruby gems along the band. */}
      <circle cx="12" cy="24.7" r="1.7" fill="url(#crownRuby)" stroke="#5A0E0E" strokeWidth="0.4" />
      <circle cx="24" cy="24.7" r="1.9" fill="url(#crownRuby)" stroke="#5A0E0E" strokeWidth="0.4" />
      <circle cx="36" cy="24.7" r="1.7" fill="url(#crownRuby)" stroke="#5A0E0E" strokeWidth="0.4" />
    </svg>
  );
}

function AppRankCard({
  app,
  rank,
  showAmounts,
  stagger,
}: {
  app: AppListItem;
  rank: number;
  showAmounts?: boolean;
  stagger?: boolean;
}) {
  const tier = tierForRank(rank);
  const s = TIER_STYLES[tier];

  // Each card owns its open/closed state — one panel never affects another.
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const summary = app.description ?? app.tagline;
  const showAmount =
    showAmounts && app.paid && typeof app.dailyAmountCents === "number";

  return (
    <li
      style={stagger ? ({ "--stagger-i": rank - 1 } as CSSProperties) : undefined}
      className={cn(
        "group relative flex flex-col rounded-xl border backdrop-blur-sm",
        // Lift only on hover-capable pointers and when motion is allowed, so it
        // never sticks after a tap on mobile and respects reduced-motion.
        "transition-[transform,box-shadow,border-color,outline-color] duration-200 ease-snappy motion-safe:[@media(hover:hover)]:hover:-translate-y-0.5",
        stagger && "stagger-item",
        s.shell,
        s.padding,
        // Owner's own business: a distinct electric-blue outline so it's easy to
        // spot regardless of its tier (outline doesn't fight the tier border/ring).
        app.isOwner &&
          "outline outline-2 outline-primary outline-offset-2",
      )}
    >
      {/* Very leve gold tint behind the #1 card. */}
      {s.goldTint && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))",
          }}
        />
      )}

      {/* Main row */}
      <div className="flex w-full items-center gap-4">
        {/* Rank indicator — position in the ranked list. Fixed width across all
            tiers so the number column aligns row to row (sized for the big #1). */}
        <div className="flex w-12 shrink-0 flex-col items-center justify-center gap-0.5">
          {/* Podium marks (crown / medals) now live on the logo itself, so the
              column holds only the rank number. */}
          <span
            className={cn(
              "font-bold tabular-nums leading-none",
              // Decreasing size by podium rank; #4 and below share the standard size.
              tier === "gold"
                ? "text-2xl"
                : tier === "silver"
                  ? "text-lg"
                  : tier === "bronze"
                    ? "text-base"
                    : "text-sm",
              s.rankColor,
            )}
          >
            #{rank}
          </span>
        </div>

        {/* Fixed-width logo slot (sized for the largest #1 disc) with the disc
            centered inside, so smaller podium logos still keep the title column
            aligned across every row. */}
        <div className="relative flex w-14 shrink-0 items-center justify-center">
          <AppLogo name={app.name} logoUrl={app.logoUrl} url={app.url} size={s.logo} />

          {/* #1: metallic gold crown resting on top of the logo, shifted to the
              right and slightly tilted so it sits at an angle on the "head". */}
          {tier === "gold" && (
            <CrownMark
              height={Math.round(s.logo * 0.5)}
              className="absolute left-[64%] -translate-x-1/2 -top-3.5 rotate-[15deg] drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]"
            />
          )}

          {/* #2/#3: metallic medal pendant hanging off the bottom edge of the
              circular logo — pulled up so it overlaps the edge without reaching
              the card border. */}
          {(tier === "silver" || tier === "bronze") && (
            <MedalMark
              variant={tier}
              height={Math.round(s.logo * 0.58)}
              className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]"
            />
          )}
        </div>

        <div className="min-w-0 flex-1 md:flex-none md:basis-64">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold leading-tight">{app.name}</h3>
            {app.isOwner && (
              <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                Tu negocio
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {app.category}
            </span>
            {showAmount && (
              <span className="inline-flex items-center rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-2 py-0.5 text-xs font-semibold text-[#FBBF24]">
                {formatDailyAmount(app.dailyAmountCents as number)}
              </span>
            )}
          </div>
        </div>

        <p className="hidden min-w-0 flex-1 truncate text-sm text-muted-foreground md:block">
          {app.tagline}
        </p>

        {/* Actions: expand-description toggle + edit (owner only) + outbound link. */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="icon"
            className={GLASS_BUTTON_CLASS}
            style={GLASS_BUTTON_STYLE}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Ocultar descripción" : "Ver descripción"}
            onClick={() => setOpen((v) => !v)}
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </Button>

          {app.isOwner && app.id && (
            <Button
              asChild
              size="icon"
              className={GLASS_BUTTON_CLASS}
              style={GLASS_BUTTON_STYLE}
            >
              <Link
                href={`/dashboard/editar/${app.id}`}
                aria-label="Editar negocio"
                title="Editar negocio"
              >
                <Pencil className="size-4" aria-hidden />
              </Link>
            </Button>
          )}

          <Button
            asChild
            size="icon"
            className={GLASS_BUTTON_CLASS}
            style={GLASS_BUTTON_STYLE}
          >
            <a
              href={app.url}
              target="_blank"
              rel="sponsored nofollow noopener"
              aria-label="Visitar sitio"
              title="Visitar sitio"
            >
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </Button>
        </div>
      </div>

      {/* Expandable description panel — animated height via grid-rows. */}
      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-snappy",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div
          className={cn(
            // Fade the copy with the height so text never pops in at full
            // opacity before the row has finished opening.
            "overflow-hidden transition-opacity duration-300 ease-snappy",
            open ? "opacity-100" : "opacity-0",
          )}
        >
          <p
            className={cn(
              "mt-3 border-t border-border/60 pt-3 text-sm text-muted-foreground",
              // Nudge the panel to line up under the text column, not the rank.
              "pl-14",
            )}
          >
            {summary}
          </p>
        </div>
      </div>
    </li>
  );
}

/**
 * Ranked list of apps rendered as independent floating cards. Position drives
 * prominence: a gold #1, silver #2, bronze #3 podium, then a single neutral
 * band for #4 and below. Each card has an expandable description panel and a
 * tracked outbound link. The caller is responsible for ordering (paid-first,
 * then rank).
 *
 * `showAmounts` reveals the per-business paid amount (owner dashboard only) —
 * the public view leaves it off so amounts stay private.
 */
export function AppList({
  apps,
  showAmounts,
  stagger,
}: {
  apps: AppListItem[];
  showAmounts?: boolean;
  /** Animate rows in with a staggered entrance. Only use where the list mounts
   *  fresh (e.g. a dashboard tab) — NOT on a live-filtered list, where changing
   *  results would re-key rows and replay the animation on every keystroke. */
  stagger?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {apps.map((app, i) => (
        <AppRankCard
          key={`${app.name}-${i}`}
          app={app}
          rank={i + 1}
          showAmounts={showAmounts}
          stagger={stagger}
        />
      ))}
    </ul>
  );
}
