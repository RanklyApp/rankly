import { Info } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminDeleteButton } from "@/components/admin-delete-button";
import { AppList, type AppListItem } from "@/components/app-list";
import { BidForm } from "@/components/bid-form";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { EditAppForm } from "@/components/edit-app-form";
import { EmptyState } from "@/components/empty-state";
import { HeaderCta } from "@/components/header-cta";
import { PaymentMethodCard } from "@/components/payment-method-card";
import { RewardsPanel } from "@/components/rewards-panel";
import { getOwnerAppsWithCategory, getSessionUser } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/lib/constants";
import { DEMO_APPS } from "@/lib/demo-apps";
import { getAllAppsForAdmin, getCategories } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { deleteBusinessAction } from "../actions";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export const metadata: Metadata = {
  title: "Panel completo",
  description: "Panel privado del dueño del negocio.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PAGO_NOTICE: Record<
  string,
  { tone: "ok" | "error"; text: string }
> = {
  ok: {
    tone: "ok",
    text: "Método de pago guardado. Ya se puede cobrar tu puja y destacarte en el ranking.",
  },
  error: {
    tone: "error",
    text: "No pudimos guardar el método de pago. Volvé a intentarlo.",
  },
  nocfg: {
    tone: "error",
    text: "Los pagos todavía no están disponibles. Probá de nuevo más tarde.",
  },
};

export default async function DashboardFullPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/acceder");

  const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL;
  const flagEnabled = process.env.DASHBOARD_FULL_ENABLED === "true";

  const pagoParam = (await searchParams).pago;
  const pagoNotice =
    typeof pagoParam === "string" ? PAGO_NOTICE[pagoParam] : undefined;

  // Fetch owned apps once; reuse for both access gate and rendering.
  const owned = await getOwnerAppsWithCategory(user.id);
  const allApps = isAdmin ? await getAllAppsForAdmin() : [];

  // Access gate: flag OR admin OR active billing.
  if (!isAdmin && !flagEnabled) {
    const hasActiveBilling = owned.some(
      (a) =>
        a.desiredDailyAmountCents > 0 ||
        a.dodoSubscriptionId !== null ||
        a.plan === "paid",
    );
    if (!hasActiveBilling) notFound();
  }

  const categories =
    !isAdmin && owned.length > 0 ? await getCategories() : [];
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  const ownerItems: AppListItem[] = owned.map((a) => ({
    id: a.id,
    name: a.name,
    tagline: a.tagline,
    description: a.description || undefined,
    category: a.categoryName,
    url: a.websiteUrl,
    logoUrl: a.logoUrl,
    paid: a.plan === "paid",
    dailyAmountCents: a.plan === "paid" ? a.dailyAmountCents : undefined,
    isOwner: true,
  }));

  const ranking: AppListItem[] = [...DEMO_APPS, ...ownerItems];

  return (
    <div className="mx-auto max-w-4xl px-4">
      <div className="flex justify-end pt-4">
        <HeaderCta />
      </div>

      <section className="pb-16 pt-6 sm:pt-10">
        <header className={cn("mb-6", !isAdmin && "text-center")}>
          <h1 className="text-balance font-display text-4xl font-medium tracking-[-0.02em] text-white sm:text-5xl">
            {isAdmin ? "Administración del sitio" : "Panel del negocio"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </header>

        {isAdmin ? (
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
                    className="surface-premium flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg p-4"
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
            {pagoNotice && (
              <div
                className={cn(
                  "mb-6 rounded-lg border p-3 text-center text-sm",
                  pagoNotice.tone === "ok"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : "border-destructive/40 bg-destructive/10 text-destructive",
                )}
              >
                {pagoNotice.text}
              </div>
            )}
            <DashboardTabs
              rewards={
                <div className="flex flex-col items-center gap-24 py-10">
                  {owned.map((a) => (
                    <RewardsPanel
                      key={a.id}
                      name={a.name}
                      logoUrl={a.logoUrl}
                      url={a.websiteUrl}
                      secondsTotal={a.firstPlaceSecondsTotal}
                    />
                  ))}
                </div>
              }
              competition={
                <div className="space-y-10">
                  <div className="space-y-8">
                    {owned.map((a) => (
                      <div
                        key={a.id}
                        className="flex flex-col items-center gap-3"
                      >
                        <p className="text-center font-medium text-white">
                          {a.name}
                        </p>
                        <BidForm
                          appId={a.id}
                          initialDollars={Math.round(
                            a.desiredDailyAmountCents / 100,
                          )}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <AppList apps={ranking} showAmounts />
                  </div>
                </div>
              }
              myBusiness={
                <div className="mx-auto max-w-2xl space-y-10">
                  {owned.map((a) => (
                    <div key={a.id} className="space-y-4">
                      {owned.length > 1 && (
                        <h3 className="text-center font-semibold text-white">
                          {a.name}
                        </h3>
                      )}
                      <EditAppForm
                        appId={a.id}
                        defaultValues={{
                          name: a.name,
                          categoryId: a.categoryId,
                          websiteUrl: a.websiteUrl,
                          description: a.description,
                        }}
                        categories={categoryOptions}
                      />
                      <PaymentMethodCard
                        appId={a.id}
                        hasCard={Boolean(a.dodoSubscriptionId)}
                        billingCountry={a.dodoBillingCountry}
                        alert={Boolean(a.billingAlertAt)}
                      />
                    </div>
                  ))}
                </div>
              }
            />
          </>
        )}
      </section>
    </div>
  );
}
