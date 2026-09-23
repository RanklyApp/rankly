"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Neon halo color per plaque: cool silver/white for the 50-day, warm amber for
// the 100-day. Kept moderate so it reads "achievement", not a flare.
const GLOW: Record<PlaqueVariant, string> = {
  silver: "rgba(219,229,242,0.48)",
  gold: "rgba(245,158,11,0.7)",
};

// Source images are landscape (~1535×1024); keep the ratio when sizing.
const RATIO = 1024 / 1535;

export type PlaqueVariant = "silver" | "gold";

/**
 * An achievement plaque marker. The PNG carries its own baked (dark) or
 * transparent background; `mix-blend-mode: screen` over the dark page knocks the
 * dark out and lets the metal glow, so no server-side cutout is needed. At rest
 * it sits with a subtle 3D tilt, a soft contact shadow, and — once unlocked — a
 * neon halo behind it. Clicking/tapping spins it a full 360° on its own axis
 * (one shot per press, never auto-looping). Reduced motion snaps instantly.
 */
export function Plaque({
  variant,
  src,
  label,
  unlocked,
  width,
}: {
  variant: PlaqueVariant;
  src: string;
  label: string;
  unlocked: boolean;
  width: number;
}) {
  const [spins, setSpins] = useState(0);
  const height = Math.round(width * RATIO);

  return (
    <button
      type="button"
      onClick={() => setSpins((s) => s + 1)}
      aria-label={`${unlocked ? "Placa conseguida" : "Placa bloqueada"}: ${label}. Tocar para girar.`}
      className={cn(
        "group relative inline-flex items-center justify-center [perspective:900px]",
        "rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white/40",
      )}
      style={{ width, height: height + 10 }}
    >
      {/* Neon halo behind THIS plaque — cool for silver, warm for gold. Always
          present (it's the plaque's own glow); brighter once unlocked. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-opacity duration-500",
          unlocked ? "opacity-100" : "opacity-55",
        )}
        style={{
          width: width * 1.5,
          height: width * 1.5,
          background: `radial-gradient(circle, ${GLOW[variant]}, transparent 68%)`,
        }}
      />
      {/* Soft contact shadow grounding the plaque. */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-2 -translate-x-1/2 rounded-[50%] bg-black/55 blur-md"
        style={{ width: width * 0.66 }}
      />
      {/* The plaque itself: rest tilt + full-turn spin on each press. Always
          shown in its metal (gold vs silver stay distinct); locked only dims a
          touch — no grayscale, which would make both look the same. */}
      <span
        className={cn(
          "plaque-spin block will-change-transform",
          !unlocked && "opacity-75",
        )}
        style={{
          transform: `rotateX(8deg) rotateY(${-14 + spins * 360}deg)`,
          mixBlendMode: "screen",
        }}
      >
        <Image
          src={src}
          alt=""
          width={width}
          height={height}
          draggable={false}
          className="h-auto w-full select-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]"
        />
      </span>
    </button>
  );
}
