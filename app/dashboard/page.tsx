import { Info } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppList, type AppListItem } from "@/components/app-list";
import { EmptyState } from "@/components/empty-state";
import { HeaderCta } from "@/components/header-cta";
import { DarkGradientBg } from "@/components/ui/elegant-dark-pattern";
import { getOwnerAppsWithCategory, getSessionUser } from "@/lib/auth";
import { DEMO_APPS } from "@/lib/demo-apps";

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

  // The owner's real businesses, highlighted, appended to the same ranking the
  // public sees. `showAmounts` reveals the per-business paid amount (private).
  const ownerItems: AppListItem[] = owned.map((a) => ({
    name: a.name,
    tagline: a.tagline,
    category: a.categoryName,
    url: a.websiteUrl,
    logoUrl: a.logoUrl,
    paid: a.plan === "paid",
    monthlyAmountCents: a.plan === "paid" ? a.monthlyAmountCents : undefined,
    isOwner: true,
  }));

  const ranking: AppListItem[] = [...DEMO_APPS, ...ownerItems];

  return (
    <DarkGradientBg className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4">
        {/* No header bar (same as / and /submit) — owner nav lives here. */}
        <div className="flex justify-end pt-4">
          <HeaderCta />
        </div>

        <section className="pb-16 pt-6 sm:pt-10">
          <header className="mb-6">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Panel del negocio
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          </header>

          {owned.length === 0 ? (
            <EmptyState
              icon={Info}
              title="Todavía no tenés un negocio publicado"
              description="Cargá tu negocio para verlo en el ranking y administrarlo desde acá."
            />
          ) : (
            <AppList apps={ranking} showAmounts />
          )}
        </section>
      </div>
    </DarkGradientBg>
  );
}
