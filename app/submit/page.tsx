import { Info } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { SubmitForm } from "@/components/submit-form";
import { getCategories } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Publicá tu app",
  description:
    "Sumá tu herramienta de IA al directorio. Es gratis, permanente y no necesitás crear cuenta.",
};

// Categories can change; render fresh so the select is never stale.
export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Publicá tu app
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sumá tu herramienta al directorio. Es gratis y permanente, no
          necesitás crear cuenta. La revisamos antes de publicarla.
        </p>
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
  );
}
