import Link from "next/link";
import { cn } from "@/lib/utils";

interface CategoryChipProps {
  name: string;
  slug?: string;
  className?: string;
}

/** Small category label. Links to the category page when a slug is given. */
export function CategoryChip({ name, slug, className }: CategoryChipProps) {
  const classes = cn(
    "inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground",
    slug && "transition-colors hover:bg-accent",
    className,
  );

  if (slug) {
    return (
      <Link href={`/c/${slug}`} className={classes}>
        {name}
      </Link>
    );
  }
  return <span className={classes}>{name}</span>;
}
