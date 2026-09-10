import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * DarkGradientBg — "elegant dark pattern" (adapted from 21st.dev), recolored to
 * our palette:
 *  - base radial gradient from #0A1633 (top-left) fading to #000000
 *  - soft electric-blue (#3B82F6) streaks at low opacity
 *  - subtle white dot grid on top
 *
 * Fully static (no animation, no client JS) so it never delays first render.
 * Renders the pattern behind its children.
 */
export function DarkGradientBg({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("relative isolate", className)}>
      {/* Base radial gradient: #0A1633 (top-left) -> #000000 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-30"
        style={{
          background:
            "radial-gradient(125% 125% at 0% 0%, #0A1633 0%, #050B1F 40%, #000000 100%)",
        }}
      />

      {/* Electric-blue streaks — thin, blurred, low opacity, static */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 overflow-hidden"
      >
        <div
          className="absolute -left-[10%] top-[8%] h-px w-[55rem] rotate-[18deg] blur-[2px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(59,130,246,0.45), transparent)",
          }}
        />
        <div
          className="absolute left-[20%] top-[32%] h-px w-[45rem] rotate-[12deg] blur-[2px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(59,130,246,0.30), transparent)",
          }}
        />
        <div
          className="absolute -right-[5%] top-[58%] h-px w-[50rem] -rotate-[14deg] blur-[2px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(59,130,246,0.35), transparent)",
          }}
        />
        <div
          className="absolute left-[10%] top-[80%] h-px w-[40rem] rotate-[8deg] blur-[2px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(59,130,246,0.22), transparent)",
          }}
        />
        {/* Soft glow bloom top-left to echo the gradient origin */}
        <div
          className="absolute -left-40 -top-40 size-[36rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.12), transparent 65%)",
          }}
        />
      </div>

      {/* Subtle white dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {children}
    </div>
  );
}
