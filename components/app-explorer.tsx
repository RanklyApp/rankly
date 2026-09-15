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

  const filtered = useMemo(
    () =>
      selected.length === 0
        ? apps
        : apps.filter((a) => selected.includes(a.category)),
    [apps, selected],
  );

  function toggle(category: string) {
    setSelected((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  }

  return (
    <>
      <div className="mx-auto mt-8 flex max-w-xl items-center gap-2">
        <div className="min-w-0 flex-1">
          <SearchBar />
        </div>
        <CategoryFilter
          categories={allCategories}
          selected={selected}
          onToggle={toggle}
          onClear={() => setSelected([])}
        />
      </div>

      <div className="mt-12">
        {filtered.length > 0 ? (
          <AppList apps={filtered} />
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            No hay apps en las categorías seleccionadas.
          </p>
        )}
      </div>
    </>
  );
}
