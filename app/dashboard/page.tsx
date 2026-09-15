import { Info } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDeleteButton } from "@/components/admin-delete-button";
import { AppList, type AppListItem } from "@/components/app-list";
import { BidForm } from "@/components/bid-form";
import { EmptyState } from "@/components/empty-state";
import { HeaderCta } from "@/components/header-cta";
import { getOwnerAppsWithCategory, getSessionUser } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/lib/constants";
import { DEMO_APPS } from "@/lib/demo-apps";
import { getAllAppsForAdmin } from "@/lib/queries";
import { deleteBusinessAction } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export const metadata: Metadata = {
  title: "Panel",
  description: "Panel privado del dueño del negocio.",
  robots: { index: false, follow: false },
};

// Per-user, never cached.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  // proxy.ts already gates this route; this is defense-in-depth.
  if (!user) redirect("/acceder");

  const owned = await getOwnerAppsWithCategory(user.id);

  // Site operator only: an "all businesses" management list, gated purely by
  // email (no /admin route, no role check). Everyone else sees just their panel.
  const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL;
  const allApps = isAdmin ? await getAllAppsForAdmin() : [];

  // The owner's real businesses, highlighted, appended to the same ranking the
  // public sees. `showAmounts` reveals the per-business paid amount (private).
  const ownerItems: AppListItem[] = owned.map((a) => ({
    name: a.name,
    tagline: a.tagline,
    category: a.categoryName,
    url: a.websiteUrl,
    logoUrl: a.logoUrl,
    paid: a.plan === "paid",
    dailyAmountCents: a.plan === "paid" ? a.dailyAmountCents : undefined,
    isOwner: true,
  }));

  const ranking: AppListItem[] = [...DEMO_APPS, ...ownerItems];

  return (
    // Background comes from the root layout (DarkGradientBg). Bare page: no header.
    <div className="mx-auto max-w-4xl px-4">
      {/* No header bar (same as / and /submit) — owner nav lives here. */}
      <div className="flex justify-end pt-4">
        <HeaderCta />
      </div>

      <section className="pb-16 pt-6 sm:pt-10">
        <header className="mb-6">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {isAdmin ? "Administración del sitio" : "Panel del negocio"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </header>

        {isAdmin ? (
          // Admin account: management only, never a "publicá tu negocio" prompt.
          // Straight to the full list of businesses.
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">
                Todos los negocios
              </h2>
              <p className="text-sm text-muted-foreground">
                {allApps.length} negocio{allApps.length === 1 ? "" : "s"}{" "}
                registrado{allApps.length === 1 ? "" : "s"}.
              </p>
            </div>

            {allApps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay negocios registrados.
              </p>
            ) : (
              <ul className="space-y-3">
                {allApps.map((app) => (
                <li
                  key={app.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-card p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{app.name}</span>
                      <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                        {app.categoryName}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                        {STATUS_LABEL[app.status] ?? app.status}
                      </span>
                      {app.plan === "paid" && (
                        <span className="inline-flex items-center rounded-full border border-primary/40 px-2 py-0.5 text-xs text-primary">
                          ${Math.round(app.dailyAmountCents / 100)}/día
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{app.ownerEmail}</span>
                      <span>
                        {new Date(app.createdAt).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                  </div>

                  <form action={deleteBusinessAction} className="shrink-0">
                    <input type="hidden" name="appId" value={app.id} />
                    <AdminDeleteButton name={app.name} />
                  </form>
                </li>
                ))}
              </ul>
            )}
          </div>
        ) : owned.length === 0 ? (
          <EmptyState
            icon={Info}
            title="Todavía no tenés un negocio publicado"
            description="Cargá tu negocio para verlo en el ranking y administrarlo desde acá."
          />
        ) : (
          <>
            <div className="mb-10 space-y-8">
              {owned.map((a) => (
                <div key={a.id} className="flex flex-col items-center gap-3">
                  <BidForm
                    appId={a.id}
                    initialDollars={Math.round(a.desiredDailyAmountCents / 100)}
                  />
                  <p className="text-center font-medium text-white">{a.name}</p>
                </div>
              ))}
            </div>

            <AppList apps={ranking} showAmounts />
          </>
        )}
      </section>
    </div>
  );
}
