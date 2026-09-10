import { ArrowUpRight } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { PromotedBadge } from "@/components/promoted-badge";
import { Button } from "@/components/ui/button";

export interface AppListItem {
  name: string;
  tagline: string;
  category: string;
  url: string;
  logoUrl?: string | null;
  paid?: boolean;
}

/**
 * Horizontal row list (shadcn List2-style): logo + name/category on the left,
 * tagline in the middle, a "Visitar" button on the right, 1px separators
 * between rows. Paid apps carry the amber "Destacado" badge and belong on top
 * (the caller is responsible for ordering paid-first).
 */
export function AppList({ apps }: { apps: AppListItem[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card/90 backdrop-blur-sm">
      {apps.map((app, i) => (
        <li
          key={`${app.name}-${i}`}
          className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-accent"
        >
          <AppLogo name={app.name} logoUrl={app.logoUrl} />

          <div className="min-w-0 flex-1 md:flex-none md:basis-64">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold leading-tight">
                {app.name}
              </h3>
              {app.paid && <PromotedBadge />}
            </div>
            <span className="mt-1 inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {app.category}
            </span>
          </div>

          <p className="hidden min-w-0 flex-1 truncate text-sm text-muted-foreground md:block">
            {app.tagline}
          </p>

          <div className="ml-auto shrink-0">
            <Button asChild size="sm">
              <a
                href={app.url}
                target="_blank"
                rel="sponsored nofollow noopener"
              >
                Visitar
                <ArrowUpRight className="size-4" aria-hidden />
              </a>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
