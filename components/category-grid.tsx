import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import type { CSSProperties } from "react";
import Link from "next/link";
import type { Category } from "@/db/schema";
import { cn } from "@/lib/utils";

interface CategoryGridProps {
  categories: Pick<Category, "id" | "slug" | "name" | "description" | "icon">[];
  className?: string;
}

export function CategoryGrid({ categories, className }: CategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {categories.map((c, i) => (
        <Link
          key={c.id}
          href={`/c/${c.slug}`}
          style={{ "--stagger-i": i } as CSSProperties}
          className={cn(
            "surface-premium lift stagger-item group flex items-start gap-3 rounded-lg p-4",
            "hover:!border-primary/40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-foreground transition-colors duration-200 ease-snappy group-hover:border-primary/40 group-hover:text-primary">
            <DynamicIcon
              name={c.icon as IconName}
              className="size-4"
              aria-hidden
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium leading-tight">{c.name}</h3>
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
              {c.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
