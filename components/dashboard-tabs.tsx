"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TabKey = "rewards" | "competition" | "mybiz";

const TABS: { key: TabKey; label: string }[] = [
  { key: "rewards", label: "Recompensas" },
  { key: "competition", label: "Competencia" },
  { key: "mybiz", label: "Mi Negocio" },
];

/**
 * Horizontal tabbed sections for the owner panel. Only the active section's
 * content is mounted at a time. Each section's content is passed in as a slot so
 * the server page keeps owning the data/queries — this component is purely the
 * tab switcher (no accrual / bid logic here).
 *
 * Equal, static tab widths: the three tabs are `flex-1 basis-0` with `min-w-0`,
 * so no track can grow past its 1/3 share even if the label is long (min-content
 * can't push it). The active gold/amber pill slides between tabs via a
 * shared-layout animation (`layoutId`); a fainter pill trails the hovered tab.
 *
 * Content switch is the simplest crossfade: the leaving panel fades out and the
 * entering one fades in — no movement, scale, blur, or height animation, so
 * nothing competes on the main thread. The pill keeps its own spring.
 * `prefers-reduced-motion` snaps instantly.
 */
export function DashboardTabs({
  rewards,
  competition,
  myBusiness,
}: {
  rewards: ReactNode;
  competition: ReactNode;
  myBusiness: ReactNode;
}) {
  const [active, setActive] = useState<TabKey>("rewards");
  const [hovered, setHovered] = useState<TabKey | null>(null);
  const reduce = useReducedMotion();

  // Pill slide: a snappy spring so the amber indicator glides to the selected
  // tab; snap instantly under reduced motion.
  const slide = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 360, damping: 30 };

  // Content switch: plain opacity crossfade. No movement / scale / blur, and the
  // container height is NOT animated — nothing competes with this fade.
  const fade = { duration: reduce ? 0 : 0.16, ease: "easeOut" as const };

  const panels: Record<TabKey, ReactNode> = {
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
          className="flex w-full max-w-md items-center gap-1 rounded-full border border-border bg-card/60 p-1"
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
                  // flex-1 basis-0 + min-w-0 → all three tabs share one equal
                  // width and no long label can expand its track (min-content
                  // can't push it). The pill/underline geometry never shifts.
                  "relative min-w-0 flex-1 basis-0 rounded-full px-3 py-2 text-center text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-0",
                  selected
                    ? "text-white"
                    : "text-muted-foreground hover:text-white",
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
                <span className="relative z-10 truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* `popLayout` takes the leaving panel out of flow so the entering one
          fades in over it (crossfade, no gap). Height is not animated — it
          settles to the new panel immediately. */}
      <div className="relative w-full">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={active}
            role="tabpanel"
            id={`panel-${active}`}
            aria-labelledby={`tab-${active}`}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
          >
            {panels[active]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
