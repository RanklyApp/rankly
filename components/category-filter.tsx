"use client";

import { Check, SlidersHorizontal } from "lucide-react";
import type { CSSProperties } from "react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

// Liquid glass — matches the frosted look of the card icon buttons, tuned to
// the dark electric-blue background: translucent, strong backdrop-blur, a
// subtle bright rim and a soft blue glow so it reads as premium glass.
const FILTER_GLASS_STYLE: CSSProperties = {
  backgroundColor: "transparent",
  backgroundImage:
    "radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.16), rgba(255,255,255,0) 60%), " +
    "linear-gradient(180deg, rgba(59,130,246,0.22) 0%, rgba(37,99,235,0.10) 100%)",
  backdropFilter: "blur(12px) saturate(1.5)",
  WebkitBackdropFilter: "blur(12px) saturate(1.5)",
  border: "1px solid rgba(255,255,255,0.18)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 20px rgba(0,0,0,0.35), 0 0 18px rgba(59,130,246,0.25)",
};

// The dropdown is more opaque than the trigger so the category text stays
// readable, but keeps the same frosted-glass family.
const FILTER_PANEL_STYLE: CSSProperties = {
  backgroundColor: "rgba(16,31,69,0.85)",
  backdropFilter: "blur(16px) saturate(1.4)",
  WebkitBackdropFilter: "blur(16px) saturate(1.4)",
  border: "1px solid rgba(255,255,255,0.14)",
  boxShadow: "0 12px 34px rgba(0,0,0,0.5)",
};

interface CategoryFilterProps {
  /** All selectable categories (demo: names; later: real DB category names). */
  categories: string[];
  /** Currently selected category names (empty = no filter). */
  selected: string[];
  onToggle: (category: string) => void;
  onClear: () => void;
}

/**
 * Category filter: a liquid-glass trigger button that opens a checkbox
 * dropdown. Purely presentational over the `selected` state the caller owns —
 * it filters whatever list the caller renders. Category source is a plain
 * `string[]` so wiring it to real DB categories later needs no refactor here.
 */
export function CategoryFilter({
  categories,
  selected,
  onToggle,
  onClear,
}: CategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const count = selected.length;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        style={FILTER_GLASS_STYLE}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-medium text-white",
          "transition-all duration-200 ease-out hover:scale-[1.03] active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        <span className="hidden sm:inline">Filtros</span>
        {count > 0 && (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-white/90 px-1.5 text-xs font-semibold text-[#0A1633]">
            {count}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Click-away layer. */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            id={panelId}
            role="group"
            aria-label="Filtrar por categoría"
            style={FILTER_PANEL_STYLE}
            className="absolute right-0 z-50 mt-2 w-64 rounded-xl p-2"
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Categoría
              </span>
              {count > 0 && (
                <button
                  type="button"
                  onClick={onClear}
                  className="rounded-sm text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Limpiar
                </button>
              )}
            </div>

            <ul className="max-h-72 overflow-y-auto">
              {categories.map((cat) => {
                const active = selected.includes(cat);
                return (
                  <li key={cat}>
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-white/5">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={active}
                        onChange={() => onToggle(cat)}
                      />
                      <span
                        aria-hidden
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                          "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-[#101F45]",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border",
                        )}
                      >
                        {active && <Check className="size-3" aria-hidden />}
                      </span>
                      <span className="truncate">{cat}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
