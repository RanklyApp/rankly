import { Info } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { SubmitForm } from "@/components/submit-form";
import { DarkGradientBg } from "@/components/ui/elegant-dark-pattern";
import { getCategories } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Agregar negocio",
  description:
    "Creá tu cuenta y publicá tu negocio en el directorio de herramientas de IA en un solo paso. Gratis y sin esperas.",
  robots: { index: false, follow: false },
};

// Categories can change; render fresh so the select is never stale.
export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const categories = await getCategories();

  return (
    <DarkGradientBg className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:py-20">
        <header className="mb-8">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Agregar tu negocio
          </h1>
        </header>

        {categories.length > 0 ? (
          <SubmitForm
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          />
        ) : (
          <EmptyState
            icon={Info}
            title="El directorio se está preparando"
            description="Todavía no hay categorías disponibles para publicar. Volvé en breve."
          />
        )}
      </div>
    </DarkGradientBg>
  );
}
