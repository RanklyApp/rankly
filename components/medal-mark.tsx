export type MedalVariant = "gold" | "silver" | "bronze";

// Per-variant metallic palettes. Silver/bronze match the podium medals; gold
// reuses the crown's gold gradient stops so the plaques read as one family.
const MEDAL_COLORS: Record<
  MedalVariant,
  {
    hi: string;
    mid: string;
    lo: string;
    rim: string;
    rimLo: string;
    ribbon: string;
    star: string;
  }
> = {
  gold: {
    hi: "#FFF7CC",
    mid: "#F1C64A",
    lo: "#9A6410",
    rim: "#F6CE4C",
    rimLo: "#B77E12",
    ribbon: "#7A4E0A",
    star: "#FFFBE6",
  },
  silver: {
    hi: "#FFFFFF",
    mid: "#CBD5E1",
    lo: "#64748B",
    rim: "#E2E8F0",
    rimLo: "#94A3B8",
    ribbon: "#475569",
    star: "#F8FAFC",
  },
  bronze: {
    hi: "#F8E3C4",
    mid: "#CD7F32",
    lo: "#7A4A18",
    rim: "#E7B06A",
    rimLo: "#8A5A24",
    ribbon: "#5B4632",
    star: "#F6DDB8",
  },
};

/**
 * Metallic medal pendant: a short ribbon plus a shaded disc (radial gradient +
 * rim ring + star) in gold, silver or bronze. Used both on the podium logos
 * (silver/bronze, see AppList) and as the unlockable plaques on the first-place
 * progress bar (silver/gold).
 *
 * Gradient ids are keyed by variant. That's intentionally stable: all medals of
 * the same variant are visually identical, so multiple instances sharing an id
 * on one page still render correctly (SVG resolves url(#id) to the first match).
 */
export function MedalMark({
  variant,
  height,
  className,
}: {
  variant: MedalVariant;
  height: number;
  className?: string;
}) {
  const c = MEDAL_COLORS[variant];
  const id = variant;

  return (
    <svg
      height={height}
      viewBox="0 0 28 40"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <radialGradient id={`medalFace-${id}`} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor={c.hi} />
          <stop offset="0.55" stopColor={c.mid} />
          <stop offset="1" stopColor={c.lo} />
        </radialGradient>
        <linearGradient id={`medalRim-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.rim} />
          <stop offset="1" stopColor={c.rimLo} />
        </linearGradient>
      </defs>

      {/* Short ribbon straps behind the disc. */}
      <path d="M9 2 L15 18 L11 20 L5 5 Z" fill={c.ribbon} />
      <path d="M19 2 L13 18 L17 20 L23 5 Z" fill={c.ribbon} opacity="0.85" />

      {/* Disc: rim ring + metallic face. */}
      <circle
        cx="14"
        cy="27"
        r="11"
        fill={`url(#medalRim-${id})`}
        stroke={c.rimLo}
        strokeWidth="0.6"
      />
      <circle cx="14" cy="27" r="8.4" fill={`url(#medalFace-${id})`} />
      {/* Star detail. */}
      <path
        d="M14 21.4 L15.6 25.2 L19.6 25.5 L16.5 28.1 L17.5 32 L14 29.8 L10.5 32 L11.5 28.1 L8.4 25.5 L12.4 25.2 Z"
        fill={c.star}
        opacity="0.9"
      />
    </svg>
  );
}
