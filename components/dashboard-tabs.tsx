"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TabKey = "ranking" | "rewards" | "competition" | "mybiz";

const TABS: { key: TabKey; label: string }[] = [
  { key: "ranking", label: "Ranking" },
  { key: "rewards", label: "Recompensas" },
  { key: "competition", label: "Competencia" },
  { key: "mybiz", label: "Mi Negocio" },
];

/**
 * Horizontal tabbed sections for the owner panel. Only the active section's
 * content is mounted at a time. Each section's content is passed in as a slot so
 * the server page keeps owning the data/queries — this component is purely the
 * tab switcher (no ranking / accrual / bid logic here).
 *
 * The selector is a gold/amber pill that slides between tabs via a shared-layout
 * animation (motion `layoutId`); a fainter pill trails the hovered tab. Honors
 * `prefers-reduced-motion` by snapping instead of sliding.
 */
export function DashboardTabs({
  ranking,
  rewards,
  competition,
  myBusiness,
}: {
  ranking: ReactNode;
  rewards: ReactNode;
  competition: ReactNode;
  myBusiness: ReactNode;
}) {
  const [active, setActive] = useState<TabKey>("ranking");
  const [hovered, setHovered] = useState<TabKey | null>(null);
  const reduce = useReducedMotion();

  // Slide for the moving pills; snap when the user prefers reduced motion.
  const slide = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 32 };

  const panels: Record<TabKey, ReactNode> = {
    ranking,
    rewards,
    competition,
    mybiz: myBusiness,
  };

  return (
    <div>
      <div className="mb-8 flex justify-center">
        <div
          role="tablist"
          aria-label="Secciones del panel"
          className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border bg-card/60 p-1"
        >
          {TABS.map((t) => {
            const selected = active === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                id={`tab-${t.key}`}
                aria-selected={selected}
                aria-controls={`panel-${t.key}`}
                onClick={() => setActive(t.key)}
                onMouseEnter={() => setHovered(t.key)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(t.key)}
                onBlur={() => setHovered(null)}
                className={cn(
                  "relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-0",
                  selected ? "text-white" : "text-muted-foreground hover:text-white",
                )}
              >
                {/* Hover trail — only on non-active tabs so it never fights the
                    active pill. */}
                {hovered === t.key && !selected && (
                  <motion.span
                    layoutId="tab-hover-pill"
                    aria-hidden
                    className="absolute inset-0 z-0 rounded-full bg-white/[0.06]"
                    transition={slide}
                  />
                )}
                {/* Active pill — gold/amber tint + ring + soft glow, matching the
                    podium #1 highlight. Slides between tabs on change. */}
                {selected && (
                  <motion.span
                    layoutId="tab-active-pill"
                    aria-hidden
                    className="absolute inset-0 z-0 rounded-full bg-[#F59E0B]/15 shadow-[0_0_16px_rgba(245,158,11,0.25)] ring-1 ring-inset ring-[#F59E0B]/50"
                    transition={slide}
                  />
                )}
                <span className="relative z-10 whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {TABS.map((t) => (
        <div
          key={t.key}
          role="tabpanel"
          id={`panel-${t.key}`}
          aria-labelledby={`tab-${t.key}`}
          hidden={active !== t.key}
        >
          {active === t.key && panels[t.key]}
        </div>
      ))}
    </div>
  );
}
