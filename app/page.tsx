import { AppExplorer } from "@/components/app-explorer";
import { type AppListItem } from "@/components/app-list";
import { HeaderCta } from "@/components/header-cta";
import { DarkGradientBg } from "@/components/ui/elegant-dark-pattern";
import { SITE_DESCRIPTION } from "@/lib/constants";
import { DEMO_APPS } from "@/lib/demo-apps";
import { getApprovedAppsWithCategory } from "@/lib/queries";

// Fetch fresh so newly published businesses appear right away. (Can move to ISR
// with a short revalidate later if the landing needs CDN caching.)
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Real approved businesses from the DB, appended to the demo ranking so the
  // list stays populated while the directory fills up. Amounts stay private
  // (no `showAmounts` on the public list). Remove DEMO_APPS here + in the
  // dashboard when the directory has enough real data.
  const real = await getApprovedAppsWithCategory();
  const realItems: AppListItem[] = real.map((a) => ({
    name: a.name,
    tagline: a.tagline,
    description: a.description,
    category: a.categoryName,
    url: a.websiteUrl,
    logoUrl: a.logoUrl,
    paid: a.plan === "paid",
    monthlyAmountCents: a.plan === "paid" ? a.monthlyAmountCents : undefined,
  }));

  const listApps: AppListItem[] = [...DEMO_APPS, ...realItems];

  return (
    <DarkGradientBg className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4">
        {/* Top-right entry — "Agregar negocio" for visitors, or the owner
            view toggle + "Salir" when logged in (the landing has no header). */}
        <div className="flex justify-end pt-4">
          <HeaderCta />
        </div>

        {/* Hero */}
        <section className="pb-16 pt-6 sm:pt-10">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Encontrá la herramienta de IA que necesitás
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground sm:text-lg">
              {SITE_DESCRIPTION}
            </p>
          </div>

          {/* Search + category filter + ranked list (client, shares filter state) */}
          <AppExplorer apps={listApps} />
        </section>
      </div>
    </DarkGradientBg>
  );
}
