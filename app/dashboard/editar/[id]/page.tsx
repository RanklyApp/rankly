import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EditAppForm } from "@/components/edit-app-form";
import { HeaderCta } from "@/components/header-cta";
import { DarkGradientBg } from "@/components/ui/elegant-dark-pattern";
import { getOwnerAppById, getSessionUser } from "@/lib/auth";
import { getCategories } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Editar negocio",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditAppPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/acceder");

  const { id } = await params;
  const [app, categories] = await Promise.all([
    getOwnerAppById(user.id, id),
    getCategories(),
  ]);

  if (!app) notFound();

  return (
    <DarkGradientBg className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:py-20">
        <div className="flex justify-end pb-4">
          <HeaderCta />
        </div>

        <header className="mb-8">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Editar {app.name}
          </h1>
        </header>

        <EditAppForm
          appId={id}
          defaultValues={{
            name: app.name,
            categoryId: app.categoryId,
            websiteUrl: app.websiteUrl,
            description: app.description,
          }}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          redirectHref="/dashboard"
        />
      </div>
    </DarkGradientBg>
  );
}
