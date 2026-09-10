import Link from "next/link";
import { CategoryForm } from "@/components/category-form";
import { getCategories } from "@/lib/queries";
import { createCategoryAction, updateCategoryAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
        <Link href="/admin" className="text-sm text-primary hover:underline">
          ← Moderación
        </Link>
      </div>

      <section className="mb-10 rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 font-semibold">Nueva categoría</h2>
        <CategoryForm action={createCategoryAction} submitLabel="Crear categoría" />
      </section>

      <section>
        <h2 className="mb-4 font-semibold">
          Categorías existentes ({categories.length})
        </h2>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay categorías. Creá la primera arriba.
          </p>
        ) : (
          <ul className="space-y-4">
            {categories.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <code className="rounded bg-muted px-1.5 py-0.5">
                    /c/{c.slug}
                  </code>
                </div>
                <CategoryForm
                  action={updateCategoryAction}
                  category={c}
                  submitLabel="Guardar cambios"
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
