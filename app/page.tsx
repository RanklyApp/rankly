import { AppExplorer } from "@/components/app-explorer";
import { HeaderCta } from "@/components/header-cta";
import { DarkGradientBg } from "@/components/ui/elegant-dark-pattern";
import { SITE_DESCRIPTION } from "@/lib/constants";
import { DEMO_APPS } from "@/lib/demo-apps";

export default function HomePage() {
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
          <AppExplorer apps={DEMO_APPS} />
        </section>
      </div>
    </DarkGradientBg>
  );
}
