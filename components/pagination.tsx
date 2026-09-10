import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PaginationProps {
  basePath: string;
  page: number;
  totalPages: number;
  /** Extra query params to preserve (e.g. { q: "notas" }). */
  query?: Record<string, string | undefined>;
}

function href(
  basePath: string,
  page: number,
  query?: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v) params.set(k, v);
    }
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({ basePath, page, totalPages, query }: PaginationProps) {
  if (totalPages <= 1) return null;

  const linkClass =
    "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border border-border px-3 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const disabledClass =
    "pointer-events-none inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border border-border px-3 text-sm text-muted-foreground opacity-50";

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Paginación"
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 ? (
        <Link href={href(basePath, page - 1, query)} className={linkClass} rel="prev">
          <ChevronLeft className="size-4" aria-hidden />
          Anterior
        </Link>
      ) : (
        <span className={disabledClass} aria-hidden>
          <ChevronLeft className="size-4" />
          Anterior
        </span>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={href(basePath, p, query)}
          aria-current={p === page ? "page" : undefined}
          className={cn(linkClass, p === page && "bg-primary text-primary-foreground border-primary hover:bg-primary")}
        >
          {p}
        </Link>
      ))}

      {page < totalPages ? (
        <Link href={href(basePath, page + 1, query)} className={linkClass} rel="next">
          Siguiente
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={disabledClass} aria-hidden>
          Siguiente
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
