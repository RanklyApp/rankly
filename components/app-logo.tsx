"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// 8 distinct avatar background colors (medium-value hues, white text on all).
// Works on both light and dark backgrounds.
const AVATAR_COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
  "#6B7280", // slate
];

function hashName(name: string): number {
  let h = 0;
  for (const c of name) h = ((h * 31) + c.charCodeAt(0)) & 0xffff;
  return h;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function safeDomain(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

interface AppLogoProps {
  name: string;
  logoUrl?: string | null;
  /** Website URL — used to derive a hotlinked Google favicon. Never downloaded. */
  url?: string;
  size?: number;
  className?: string;
}

/**
 * Logo cascade:
 *   1. Explicit logoUrl upload → shown as-is.
 *   2. Google favicon hotlink (https://www.google.com/s2/favicons?domain=…&sz=128)
 *      Never downloaded or stored. Falls to step 3 on load error.
 *   3. Deterministic color avatar: hash(name) → one of 8 hues, initials in white.
 *
 * Uses <img> (not next/image) because favicons come from google.com with dynamic
 * query params; next/image would need a broad remotePatterns wildcard and adds
 * no optimisation benefit at 40–64 px.
 */
export function AppLogo({ name, logoUrl, url, size = 40, className }: AppLogoProps) {
  const [faviconFailed, setFaviconFailed] = useState(false);

  const dimension = { width: size, height: size };
  const sharedStyle = { ...dimension, borderRadius: 12 };

  // 1. Explicit upload
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={`Logo de ${name}`}
        style={sharedStyle}
        loading="lazy"
        className={cn("shrink-0 border border-border object-cover", className)}
      />
    );
  }

  const domain = url ? safeDomain(url) : null;
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    : null;

  // 2. Google favicon hotlink
  if (faviconUrl && !faviconFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={faviconUrl}
        alt={`Logo de ${name}`}
        style={sharedStyle}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFaviconFailed(true)}
        className={cn("shrink-0 border border-border object-cover", className)}
      />
    );
  }

  // 3. Deterministic color avatar
  const bg = AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length];
  return (
    <div
      style={{ ...sharedStyle, backgroundColor: bg }}
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center", className)}
    >
      <span
        style={{ fontSize: Math.round(size * 0.35), fontWeight: 500, lineHeight: 1 }}
        className="text-white"
      >
        {initials(name)}
      </span>
    </div>
  );
}
