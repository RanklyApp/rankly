import { AppExplorer } from "@/components/app-explorer";
import { type AppListItem } from "@/components/app-list";
import { HeaderCta } from "@/components/header-cta";
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
    dailyAmountCents: a.plan === "paid" ? a.dailyAmountCents : undefined,
  }));

  const listApps: AppListItem[] = [...DEMO_APPS, ...realItems];

  return (
    // Background comes from the root layout (DarkGradientBg). This bare landing
    // hides the site header (see SiteHeader) and puts its own CTA top-right.
    <div>
      {/* CTA spans the full viewport width (not the hero's max-w-4xl) so the
          buttons sit at the far top-right, clear of the centered title. */}
      <div className="animate-enter flex justify-end px-4 pt-6 sm:px-8 sm:pt-8">
        <HeaderCta />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pb-16 pt-4 sm:pt-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1
            className="animate-enter text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl"
            style={{ animationDelay: "80ms" }}
          >
            Encontrá la herramienta de IA que necesitás
          </h1>
        </div>

        {/* Search + category filter + ranked list (client, shares filter state) */}
        <AppExplorer apps={listApps} />
      </section>
    </div>
  );
}
