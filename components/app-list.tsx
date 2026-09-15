"use client";

import { ChevronDown, Crown, ExternalLink, Medal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { useId, useState } from "react";
import { AppLogo } from "@/components/app-logo";
import { PromotedBadge } from "@/components/promoted-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AppListItem {
  name: string;
  tagline: string;
  category: string;
  url: string;
  /** 1–2 line summary shown in the expandable panel. Falls back to tagline. */
  description?: string;
  logoUrl?: string | null;
  paid?: boolean;
  /** Monthly amount this business pays, in cents. Only shown when the list is
   *  rendered with `showAmounts` (owner dashboard) — never in the public view. */
  monthlyAmountCents?: number;
  /** Highlight this card as the logged-in owner's own business ("Tu negocio"). */
  isOwner?: boolean;
}

/** "$240/mes" — integer dollars when round, 2 decimals otherwise. */
function formatMonthlyAmount(cents: number): string {
  const dollars = cents / 100;
  const value = Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2);
  return `$${value}/mes`;
}

// Positional hierarchy: the rank a row occupies in the list drives how
// prominent its card looks. The podium (#1 gold, #2 silver, #3 bronze) stands
// out; everything from #4 down shares one neutral "mid" style. A dimmed
// "irrelevant" tier for #11+ will come back once paid placement is enabled —
// for now the base is empty and there is no reason to make deep ranks feel
// worse than the mid band. This is independent of the paid "Destacado" badge.
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
  /** Podium medal/crown, or null off the podium. */
  icon: LucideIcon | null;
  iconColor: string;
  iconSize: number;
  /** Faint gold tint overlay behind the #1 card. */
  goldTint?: boolean;
}

const TIER_STYLES: Record<Tier, TierStyle> = {
  gold: {
    shell:
      "border-[#F59E0B] ring-1 ring-[#F59E0B]/60 bg-card/90 " +
      "shadow-[0_0_28px_rgba(245,158,11,0.25)] hover:shadow-[0_0_40px_rgba(245,158,11,0.38)]",
    padding: "p-5",
    logo: 56,
    rankColor: "text-[#FBBF24]",
    icon: Crown,
    iconColor: "text-[#FBBF24]",
    iconSize: 22,
    goldTint: true,
  },
  silver: {
    shell:
      "border-[#94A3B8] ring-1 ring-[#94A3B8]/40 bg-card/90 " +
      "shadow-[0_2px_14px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)]",
    padding: "p-[18px]",
    logo: 48,
    rankColor: "text-[#E2E8F0]",
    icon: Medal,
    iconColor: "text-[#CBD5E1]",
    iconSize: 20,
  },
  bronze: {
    shell:
      "border-[#CD7F32] ring-1 ring-[#CD7F32]/40 bg-card/90 " +
      "shadow-[0_2px_14px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)]",
    padding: "p-4",
    logo: 44,
    rankColor: "text-[#CD7F32]",
    icon: Medal,
    iconColor: "text-[#CD7F32]",
    iconSize: 20,
  },
  mid: {
    shell:
      "border-[#1E3A6E] bg-[#101F45]/90 " +
      "shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_24px_rgba(0,0,0,0.45)]",
    padding: "p-4",
    logo: 40,
    rankColor: "text-[#93A5C4]",
    icon: null,
    iconColor: "",
    iconSize: 0,
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

function AppRankCard({
  app,
  rank,
  showAmounts,
}: {
  app: AppListItem;
  rank: number;
  showAmounts?: boolean;
}) {
  const tier = tierForRank(rank);
  const s = TIER_STYLES[tier];
  const Icon = s.icon;

  // Each card owns its open/closed state — one panel never affects another.
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const summary = app.description ?? app.tagline;
  const showAmount =
    showAmounts && app.paid && typeof app.monthlyAmountCents === "number";

  return (
    <li
      className={cn(
        "group relative flex flex-col rounded-xl border backdrop-blur-sm",
        "transition-all duration-200 ease-out hover:-translate-y-0.5",
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
        {/* Rank indicator — position in the ranked list. */}
        <div className="flex w-10 shrink-0 flex-col items-center justify-center gap-0.5">
          {Icon && (
            <Icon
              className={s.iconColor}
              style={{ width: s.iconSize, height: s.iconSize }}
              aria-hidden
            />
          )}
          <span
            className={cn(
              "font-bold tabular-nums leading-none",
              tier === "gold" ? "text-base" : "text-sm",
              s.rankColor,
            )}
          >
            #{rank}
          </span>
        </div>

        <AppLogo name={app.name} logoUrl={app.logoUrl} size={s.logo} />

        <div className="min-w-0 flex-1 md:flex-none md:basis-64">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold leading-tight">{app.name}</h3>
            {app.paid && <PromotedBadge />}
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
                {formatMonthlyAmount(app.monthlyAmountCents as number)}
              </span>
            )}
          </div>
        </div>

        <p className="hidden min-w-0 flex-1 truncate text-sm text-muted-foreground md:block">
          {app.tagline}
        </p>

        {/* Actions: expand-description toggle + tracked outbound link. */}
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
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
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
}: {
  apps: AppListItem[];
  showAmounts?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {apps.map((app, i) => (
        <AppRankCard
          key={`${app.name}-${i}`}
          app={app}
          rank={i + 1}
          showAmounts={showAmounts}
        />
      ))}
    </ul>
  );
}
