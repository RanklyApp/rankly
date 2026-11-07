import { ExternalLink, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LiteBusinessForm } from "@/components/dashboard/lite-business-form";
import { EmptyState } from "@/components/empty-state";
import { HeaderCta } from "@/components/header-cta";
import {
  getOwnerAppsLite,
  getSessionUser,
  ownerHasActiveBilling,
} from "@/lib/auth";
import { ADMIN_EMAIL } from "@/lib/constants";
import { getCategories } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Panel",
  description: "Panel del dueño del negocio.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_CONFIG = {
  pending: {
    label: "Pendiente de revisión",
    className: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  },
  approved: {
    label: "Ficha aprobada",
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  },
  rejected: {
    label: "Ficha rechazada",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
} as const;

export default async function DashboardLitePage() {
  const user = await getSessionUser();
  if (!user) redirect("/acceder");

  const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL;
  if (isAdmin) redirect("/dashboard/full");

  const ownedApps = await getOwnerAppsLite(user.id);

  if (ownedApps.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex justify-end pt-4">
          <HeaderCta />
        </div>
        <section className="pb-16 pt-6 sm:pt-10">
          <header className="mb-6 text-center">
            <h1 className="text-balance font-display text-4xl font-medium tracking-[-0.02em] text-white sm:text-5xl">
              Panel del negocio
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          </header>
          <EmptyState
            icon={Info}
            title="Todavía no tenés un negocio publicado"
            description="Cargá tu negocio para verlo en el ranking y administrarlo desde acá."
            action={
              <Link
                href="/submit"
                className={cn(
                  "inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium",
                  "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
                )}
              >
                Publicar mi negocio
              </Link>
            }
          />
        </section>
      </div>
    );
  }

  const [hasActiveBilling, categories] = await Promise.all([
    ownerHasActiveBilling(user.id),
    getCategories(),
  ]);

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex justify-end pt-4">
        <HeaderCta />
      </div>

      <section className="pb-16 pt-6 sm:pt-10">
        <header className="mb-8 text-center">
          <h1 className="text-balance font-display text-4xl font-medium tracking-[-0.02em] text-white sm:text-5xl">
            Panel del negocio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </header>

        {hasActiveBilling && (
          <div className="mb-8 rounded-lg border border-amber-400/25 bg-amber-400/8 px-4 py-3 text-sm text-amber-200">
            Tenés un cobro activo configurado.{" "}
            <Link
              href="/dashboard/full"
              className="font-medium underline underline-offset-2 hover:text-amber-100"
            >
              Gestionar pagos →
            </Link>
          </div>
        )}

        <div className="space-y-16">
          {ownedApps.map((app) => {
            const statusCfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;

            return (
              <div key={app.id} className="space-y-6">
                {ownedApps.length > 1 && (
                  <h2 className="text-center text-lg font-semibold text-white">
                    {app.name}
                  </h2>
                )}

                {/* Estado + link a ficha pública */}
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                      statusCfg.className,
                    )}
                  >
                    {statusCfg.label}
                  </span>
                  {app.status === "approved" && (
                    <Link
                      href={`/app/${app.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
                    >
                      <ExternalLink className="size-3" aria-hidden />
                      Ver ficha pública
                    </Link>
                  )}
                </div>

                {/* Formulario de edición */}
                <LiteBusinessForm
                  appId={app.id}
                  logoUrl={app.logoUrl}
                  defaultValues={{
                    name: app.name,
                    tagline: app.tagline,
                    categoryId: app.categoryId,
                    websiteUrl: app.websiteUrl,
                    description: app.description,
                    ownerEmail: app.ownerEmail,
                  }}
                  categories={categoryOptions}
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
