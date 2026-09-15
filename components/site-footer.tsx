import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {SITE_NAME}. Directorio de herramientas
          de IA.
        </p>
        <nav className="flex items-center gap-4">
          <Link href="/categorias" className="hover:text-foreground">
            Categorías
          </Link>
          <Link href="/acceder" className="hover:text-foreground">
            Acceder
          </Link>
        </nav>
      </div>
    </footer>
  );
}
