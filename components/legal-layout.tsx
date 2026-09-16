import Link from "next/link";
import { cn } from "@/lib/utils";

interface TocEntry {
  id: string;
  label: string;
}

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  toc: TocEntry[];
  children: React.ReactNode;
}

/** Wrapper compartido para Términos y Política de Privacidad. */
export function LegalLayout({
  title,
  lastUpdated,
  toc,
  children,
}: LegalLayoutProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última actualización: {lastUpdated}
        </p>
      </header>

      <nav
        aria-label="Índice"
        className="mb-10 rounded-lg border border-border bg-muted/40 p-5"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Índice
        </p>
        <ol className="space-y-1.5">
          {toc.map((entry) => (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {entry.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-10">{children}</div>

      <footer className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
        <p>
          ¿Preguntas sobre estos documentos?{" "}
          <Link href="/privacidad#contacto" className="underline underline-offset-2 hover:text-foreground">
            Contacto legal
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}

interface LegalSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function LegalSection({
  id,
  title,
  children,
  className,
}: LegalSectionProps) {
  return (
    <section id={id} className={cn("scroll-mt-20 space-y-3", className)}>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
