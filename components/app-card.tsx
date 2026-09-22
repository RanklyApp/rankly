import type { CSSProperties } from "react";
import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import type { App } from "@/db/schema";
import { cn } from "@/lib/utils";

interface AppCardProps {
  app: Pick<
    App,
    "slug" | "name" | "tagline" | "logoUrl" | "plan" | "websiteUrl"
  >;
  categoryName?: string;
  /** Position in its grid — drives the staggered entrance delay. */
  index?: number;
  className?: string;
}

export function AppCard({ app, categoryName, index, className }: AppCardProps) {
  const isPaid = app.plan === "paid";

  return (
    <Link
      href={`/app/${app.slug}`}
      style={
        index !== undefined
          ? ({ "--stagger-i": index } as CSSProperties)
          : undefined
      }
      className={cn(
        // Premium raised surface + light-3D hover lift + staggered entrance.
        "surface-premium lift stagger-item group relative flex flex-col gap-3 rounded-lg p-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Paid businesses carry a subtle amber accent (the "Destacado" hue) —
        // no text label, so ranking stays driven by position, not a badge.
        isPaid && "border-[#F59E0B]/45 hover:!border-[#F59E0B]/70",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <AppLogo name={app.name} logoUrl={app.logoUrl} url={app.websiteUrl} />
      </div>

      <div className="min-w-0">
        <h3 className="truncate font-semibold leading-tight">{app.name}</h3>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {app.tagline}
        </p>
      </div>

      {categoryName && (
        <div className="mt-auto pt-1">
          <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {categoryName}
          </span>
        </div>
      )}
    </Link>
  );
}
