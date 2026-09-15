import { cn } from "@/lib/utils";

interface AppLogoProps {
  name: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
}

/** Deterministic initials from an app name. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * App logo. Uses the uploaded image when present, otherwise a neutral initials
 * tile so the card layout never breaks on missing artwork.
 */
export function AppLogo({ name, logoUrl, size = 40, className }: AppLogoProps) {
  const dimension = { width: size, height: size };

  if (logoUrl) {
    return (
      // Logos are arbitrary external/Storage URLs; Next/Image adds no value at
      // this size.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={`Logo de ${name}`}
        style={dimension}
        loading="lazy"
        className={cn(
          "shrink-0 rounded-full border border-border object-cover",
          className,
        )}
      />
    );
  }

  return (
    <div
      style={dimension}
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-muted-foreground",
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
