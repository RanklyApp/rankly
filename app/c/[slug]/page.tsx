import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppGrid } from "@/components/app-grid";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { SearchBar } from "@/components/search-bar";
import { PAGE_SIZE } from "@/lib/constants";
import {
  getApprovedAppsByCategory,
  getCategories,
  getCategoryBySlug,
} from "@/lib/queries";
import { rankApps } from "@/lib/rank";
import { rotationOffset } from "@/lib/rotation";
import { breadcrumbLd, jsonLd } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Categoría no encontrada" };
  return {
    title: category.seoTitle,
    description: category.seoDescription,
    alternates: { canonical: `/c/${category.slug}` },
    openGraph: {
      title: category.seoTitle,
      description: category.seoDescription,
      url: `/c/${category.slug}`,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/c/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const pageParam = typeof sp.page === "string" ? Number(sp.page) : 1;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const apps = await getApprovedAppsByCategory(category.id, q);
  const { ordered } = rankApps(apps, { offset: rotationOffset() });

  const totalPages = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageApps = ordered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const categoryNames = { [category.id]: category.name };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbLd([
              { name: "Inicio", path: "/" },
              { name: category.name, path: `/c/${category.slug}` },
            ]),
          ),
        }}
      />

      <nav className="mb-4 text-sm text-muted-foreground" aria-label="Ruta">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {category.name}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {category.description}
        </p>
      </header>

      <div className="mb-6 max-w-xl">
        <SearchBar
          action={`/c/${category.slug}`}
          defaultValue={q ?? ""}
          placeholder={`Buscar en ${category.name}…`}
        />
      </div>

      {ordered.length > 0 ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {ordered.length}{" "}
            {ordered.length === 1 ? "herramienta" : "herramientas"}
            {q ? ` para “${q}”` : ""}
          </p>
          <AppGrid apps={pageApps} categoryNames={categoryNames} />
          <Pagination
            basePath={`/c/${category.slug}`}
            page={safePage}
            totalPages={totalPages}
            query={{ q }}
          />
        </>
      ) : q ? (
        <EmptyState
          icon={SearchX}
          title={`Sin resultados para “${q}”`}
          description="Probá con otras palabras o mirá todas las herramientas de la categoría."
        />
      ) : (
        <EmptyState
          icon={SearchX}
          title="Todavía no hay herramientas en esta categoría"
          description="Cuando se publiquen apps de esta categoría, van a aparecer acá."
        />
      )}
    </div>
  );
}
