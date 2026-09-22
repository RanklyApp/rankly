"use client";

import { useMemo, useState } from "react";
import { AppList, type AppListItem } from "@/components/app-list";
import { CategoryFilter } from "@/components/category-filter";
import { SearchBar } from "@/components/search-bar";

interface AppExplorerProps {
  apps: AppListItem[];
  /**
   * Categories to offer in the filter. Defaults to the distinct categories
   * present in `apps` (demo). Pass real DB category names later without any
   * other change here.
   */
  categories?: string[];
}

/**
 * Home search + category filter over the (currently demo) app list. Owns the
 * selected-categories state so the filter and the rendered list stay in sync,
 * and filters client-side. When real data lands, swap `apps` for the DB list
 * and pass `categories` from the DB.
 */
export function AppExplorer({ apps, categories }: AppExplorerProps) {
  const allCategories = useMemo(
    () =>
      categories ??
      Array.from(new Set(apps.map((a) => a.category))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [apps, categories],
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  // Live client-side filter over the full list (demo + real, any source). Text
  // match is partial and case-insensitive across name, category, tagline and
  // description, so "redes sociales" matches an app by its category even when
  // the term isn't in its name/description. Category chips narrow it further.
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return apps.filter((a) => {
      if (selected.length > 0 && !selected.includes(a.category)) return false;
      if (!term) return true;
      const haystack = [a.name, a.category, a.tagline, a.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [apps, selected, query]);

  function toggle(category: string) {
    setSelected((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  }

  return (
    <>
      <div
        className="animate-enter mx-auto mt-8 flex max-w-xl items-center gap-2"
        style={{ animationDelay: "140ms" }}
      >
        <div className="min-w-0 flex-1">
          <SearchBar value={query} onValueChange={setQuery} />
        </div>
        <CategoryFilter
          categories={allCategories}
          selected={selected}
          onToggle={toggle}
          onClear={() => setSelected([])}
        />
      </div>

      <div className="animate-enter mt-12" style={{ animationDelay: "200ms" }}>
        {filtered.length > 0 ? (
          <AppList apps={filtered} />
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            {query.trim()
              ? `Sin resultados para “${query.trim()}”.`
              : "No hay apps en las categorías seleccionadas."}
          </p>
        )}
      </div>
    </>
  );
}
