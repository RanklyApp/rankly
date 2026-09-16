import { Search, SearchX } from "lucide-react";
import type { Metadata } from "next";
import { AppGrid } from "@/components/app-grid";
import { EmptyState } from "@/components/empty-state";
import { PaidDisclosure } from "@/components/paid-disclosure";
import { SearchBar } from "@/components/search-bar";
import { getCategories, searchApprovedApps } from "@/lib/queries";
import { rankApps } from "@/lib/rank";
import { rotationOffset } from "@/lib/rotation";

export const metadata: Metadata = {
  title: "Buscar",
  description: "Buscá herramientas de IA por funcionalidad.",
  // Search result pages shouldn't be indexed.
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: PageProps<"/buscar">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const [categories, results] = await Promise.all([
    getCategories(),
    q ? searchApprovedApps(q) : Promise.resolve([]),
  ]);

  const categoryNames = Object.fromEntries(
    categories.map((c) => [c.id, c.name]),
  );
  const { ordered } = rankApps(results, { offset: rotationOffset() });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Buscar</h1>
        <div className="mt-4 max-w-xl">
          <SearchBar action="/buscar" defaultValue={q} autoFocus />
        </div>
      </header>

      {!q ? (
        <EmptyState
          icon={Search}
          title="Buscá una herramienta"
          description="Escribí qué necesitás resolver: transcribir reuniones, generar imágenes, escribir textos…"
        />
      ) : ordered.length > 0 ? (
        <>
          <PaidDisclosure className="mb-3" />
          <p className="mb-4 text-sm text-muted-foreground">
            {ordered.length}{" "}
            {ordered.length === 1 ? "resultado" : "resultados"} para “{q}”
          </p>
          <AppGrid apps={ordered} categoryNames={categoryNames} />
        </>
      ) : (
        <EmptyState
          icon={SearchX}
          title={`Sin resultados para “${q}”`}
          description="Probá con otras palabras o explorá las categorías."
        />
      )}
    </div>
  );
}
