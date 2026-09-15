import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppGrid } from "@/components/app-grid";
import { AppLogo } from "@/components/app-logo";
import { PromotedBadge } from "@/components/promoted-badge";
import { Button } from "@/components/ui/button";
import { getApprovedApps, getAppBySlug, getRelatedApps } from "@/lib/queries";
import {
  absoluteUrl,
  breadcrumbLd,
  jsonLd,
  softwareApplicationLd,
} from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  const apps = await getApprovedApps();
  return apps.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/app/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const app = await getAppBySlug(slug);
  if (!app) return { title: "App no encontrada" };
  return {
    title: `${app.name} — ${app.tagline}`,
    description: app.tagline,
    alternates: { canonical: `/app/${app.slug}` },
    openGraph: {
      title: app.name,
      description: app.tagline,
      url: `/app/${app.slug}`,
      images: app.logoUrl ? [{ url: app.logoUrl }] : undefined,
    },
  };
}

export default async function AppPage({ params }: PageProps<"/app/[slug]">) {
  const { slug } = await params;
  const app = await getAppBySlug(slug);
  if (!app) notFound();

  const related = await getRelatedApps(app.categoryId, app.id, 8);
  const categoryNames = { [app.categoryId]: app.category.name };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            softwareApplicationLd({
              name: app.name,
              tagline: app.tagline,
              description: app.description,
              category: app.category.name,
              logoUrl: app.logoUrl ? absoluteUrl(app.logoUrl) : "",
              slug: app.slug,
            }),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbLd([
              { name: "Inicio", path: "/" },
              { name: app.category.name, path: `/c/${app.category.slug}` },
              { name: app.name, path: `/app/${app.slug}` },
            ]),
          ),
        }}
      />

      <nav className="mb-6 text-sm text-muted-foreground" aria-label="Ruta">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={`/c/${app.category.slug}`} className="hover:text-foreground">
          {app.category.name}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{app.name}</span>
      </nav>

      <div className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-start">
        <AppLogo name={app.name} logoUrl={app.logoUrl} url={app.websiteUrl} size={64} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {app.name}
            </h1>
            {app.plan === "paid" && <PromotedBadge />}
          </div>
          <p className="mt-1 text-muted-foreground">{app.tagline}</p>
          <div className="mt-3">
            <Link
              href={`/c/${app.category.slug}`}
              className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent"
            >
              {app.category.name}
            </Link>
          </div>
        </div>

        <div className="sm:self-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <a
              href={`/go/${app.slug}`}
              target="_blank"
              rel="sponsored nofollow noopener"
            >
              Ir al sitio
              <ArrowUpRight className="size-4" aria-hidden />
            </a>
          </Button>
        </div>
      </div>

      {app.description && (
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-semibold">Sobre {app.name}</h2>
          <p className="whitespace-pre-line text-pretty leading-relaxed text-foreground/90">
            {app.description}
          </p>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">
            Otras herramientas de {app.category.name}
          </h2>
          <AppGrid apps={related} categoryNames={categoryNames} />
        </section>
      )}
    </div>
  );
}
