import { Check, Inbox, X } from "lucide-react";
import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { EmptyState } from "@/components/empty-state";
import { getPendingApps } from "@/lib/queries";
import { moderateAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const pending = await getPendingApps();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Cola de moderación
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pending.length} ficha{pending.length === 1 ? "" : "s"} pendiente
            {pending.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/admin/categories"
          className="text-sm text-primary hover:underline"
        >
          Categorías →
        </Link>
      </div>

      {pending.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No hay nada para revisar"
          description="Cuando alguien publique una app, va a aparecer acá para aprobar o rechazar."
        />
      ) : (
        <ul className="space-y-4">
          {pending.map((app) => (
            <li
              key={app.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <AppLogo name={app.name} logoUrl={app.logoUrl} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{app.name}</h2>
                    <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                      {app.category.name}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {app.tagline}
                  </p>
                  <p className="mt-2 text-sm">{app.description}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <a
                      href={app.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {app.websiteUrl}
                    </a>
                    <span>{app.ownerEmail}</span>
                  </div>
                </div>
              </div>

              <form action={moderateAction} className="mt-4 space-y-2">
                <input type="hidden" name="appId" value={app.id} />
                <input
                  type="text"
                  name="reason"
                  placeholder="Motivo (opcional, para rechazo)"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    name="action"
                    value="approve"
                    className="inline-flex h-9 items-center gap-1.5 rounded-md bg-success px-3 text-sm font-medium text-success-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Check className="size-4" aria-hidden />
                    Aprobar
                  </button>
                  <button
                    type="submit"
                    name="action"
                    value="reject"
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-destructive/40 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-4" aria-hidden />
                    Rechazar
                  </button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
