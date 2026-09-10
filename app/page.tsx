import { AppList, type AppListItem } from "@/components/app-list";
import { SearchBar } from "@/components/search-bar";
import { DarkGradientBg } from "@/components/ui/elegant-dark-pattern";
import { SITE_DESCRIPTION } from "@/lib/constants";

// ─────────────────────────────────────────────────────────────────────────────
// DEMO DATA — hardcoded sample rows to show the landing design only.
// These are NOT real apps and do NOT come from the database. Delete this whole
// block (and the <AppList/> usage below) when wiring real data.
// Paid apps ("Destacado") must come first.
const DEMO_APPS: AppListItem[] = [
  {
    name: "Otterly",
    tagline: "Transcribe tus reuniones y genera resúmenes automáticos",
    category: "Transcripción",
    url: "https://example.com",
    paid: true,
  },
  {
    name: "Framely",
    tagline: "Genera imágenes y assets de marca con IA en segundos",
    category: "Generación de imágenes",
    url: "https://example.com",
    paid: true,
  },
  {
    name: "Copypilot",
    tagline: "Escribí textos de marketing que convierten, en un clic",
    category: "Copywriting",
    url: "https://example.com",
  },
  {
    name: "DevMate",
    tagline: "Autocompleta y explica código directo en tu editor",
    category: "Código",
    url: "https://example.com",
  },
  {
    name: "Voxa",
    tagline: "Convertí texto en voz natural en más de 30 idiomas",
    category: "Voz y audio",
    url: "https://example.com",
  },
  {
    name: "Noted",
    tagline: "Notas inteligentes que se organizan y resumen solas",
    category: "Productividad",
    url: "https://example.com",
  },
];
// ─────────────────────────────────────────────────────────────── end DEMO DATA

export default function HomePage() {
  return (
    <DarkGradientBg className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-4xl px-4">
        {/* Hero */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Encontrá la herramienta de IA que necesitás
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground sm:text-lg">
              {SITE_DESCRIPTION}
            </p>
            <div className="mx-auto mt-7 max-w-xl">
              <SearchBar />
            </div>
          </div>
        </section>

        {/* Single app list */}
        <section className="pb-16">
          <AppList apps={DEMO_APPS} />
        </section>
      </div>
    </DarkGradientBg>
  );
}
