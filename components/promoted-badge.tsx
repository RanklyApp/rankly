import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "Destacado" badge. Always shown on paid apps, everywhere they appear —
 * paid placement is never disguised as organic content. Amber so it reads as
 * premium against the deep-blue surfaces.
 */
export function PromotedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        "bg-promoted text-promoted-foreground",
        className,
      )}
    >
      <Sparkles className="size-3" aria-hidden />
      Destacado
    </span>
  );
}
