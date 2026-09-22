import { AppCard } from "@/components/app-card";
import type { App } from "@/db/schema";
import { cn } from "@/lib/utils";

interface AppGridProps {
  apps: Pick<App, "id" | "slug" | "name" | "tagline" | "logoUrl" | "plan" | "categoryId" | "websiteUrl">[];
  categoryNames?: Record<string, string>;
  className?: string;
}

/** Dense, responsive grid of app cards. Renders nothing when empty — callers
 * own the empty state so the copy fits the context. */
export function AppGrid({ apps, categoryNames, className }: AppGridProps) {
  if (apps.length === 0) return null;

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {apps.map((app, i) => (
        <AppCard
          key={app.id}
          app={app}
          index={i}
          categoryName={categoryNames?.[app.categoryId]}
        />
      ))}
    </div>
  );
}
