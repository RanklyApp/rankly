import { LayoutGrid } from "lucide-react";
import type { Metadata } from "next";
import { CategoryGrid } from "@/components/category-grid";
import { EmptyState } from "@/components/empty-state";
import { getCategories } from "@/lib/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Categorías",
  description: "Explorá las herramientas de IA por categoría.",
  alternates: { canonical: "/categorias" },
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Categorías
        </h1>
        <p className="mt-2 text-muted-foreground">
          Elegí el tipo de herramienta que estás buscando.
        </p>
      </header>

      {categories.length > 0 ? (
        <CategoryGrid categories={categories} />
      ) : (
        <EmptyState
          icon={LayoutGrid}
          title="Todavía no hay categorías"
          description="El catálogo se está armando. Volvé en breve."
        />
      )}
    </div>
  );
}
