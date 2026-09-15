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
  className?: string;
}

export function AppCard({ app, categoryName, className }: AppCardProps) {
  const isPaid = app.plan === "paid";

  return (
    <Link
      href={`/app/${app.slug}`}
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4",
        "transition-shadow hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.05)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
