import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OwnerLoginForm } from "@/components/owner-login-form";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Acceder",
  description: "Ingresá al panel de tu negocio con un enlace de acceso.",
  robots: { index: false, follow: false },
};

// Per-request: depends on the session.
export const dynamic = "force-dynamic";

export default async function AccederPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Acceder al panel
        </h1>
        <p className="mt-2 text-muted-foreground">
          Entrá con tu email y contraseña para administrar tu negocio.
        </p>
      </header>

      <OwnerLoginForm />

      <p className="mt-6 text-sm text-muted-foreground">
        ¿Todavía no tenés cuenta?{" "}
        <Link href="/submit" className="text-primary hover:underline">
          Agregá tu negocio
        </Link>{" "}
        — se crea la cuenta y se publica en un paso.
      </p>
    </div>
  );
}
