"use client";

import { AlertTriangle, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { useFormStatus } from "react-dom";
import { startPaymentSetupAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Payment-method block for one business, shown in "Mi Negocio". Covers Fases 1–3:
 *  - Fase 1: the "add / update card" button that kicks off the Dodo mandate
 *    checkout via `startPaymentSetupAction`.
 *  - Fase 2: the saved card, masked. We never store the PAN, so this is a
 *    generic mask (no invented digits) plus the billing country when known.
 *  - Fase 3: the `billingAlertAt` notice when the last charge failed and the
 *    business was dropped to the free plan.
 */
export function PaymentMethodCard({
  appId,
  hasCard,
  billingCountry,
  alert,
}: {
  appId: string;
  hasCard: boolean;
  billingCountry: string | null;
  alert: boolean;
}) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md",
        "shadow-[0_8px_32px_rgba(3,10,30,0.35)]",
      )}
    >
      <div className="flex items-center gap-2">
        <CreditCard className="size-4 text-sky-300/80" />
        <h4 className="text-sm font-semibold text-white">Método de pago</h4>
      </div>

      {/* Fase 3 — charge failed, dropped to free until they fix payment. */}
      {alert && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            Tu último cobro falló y el negocio pasó a plan gratis. Actualizá el
            método de pago para volver a destacarte en el ranking.
          </p>
        </div>
      )}

      {hasCard ? (
        // Fase 2 — saved card, masked (we don't hold the real digits).
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base tracking-widest text-white/80">
              •••• •••• •••• ••••
            </span>
            {billingCountry && (
              <span className="inline-flex items-center rounded-full border border-white/15 px-2 py-0.5 text-xs text-muted-foreground">
                {billingCountry}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300">
              <ShieldCheck className="size-3" />
              Activa
            </span>
          </div>
          <form action={startPaymentSetupAction}>
            <input type="hidden" name="appId" value={appId} />
            <SubmitButton variant="outline" label="Actualizar tarjeta" />
          </form>
        </div>
      ) : (
        // Fase 1 — no method yet: explain the consequence + offer to set one up.
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Todavía no configuraste un método de pago. Sin esto tu puja se guarda,
            pero no se cobra ni sube en el ranking.
          </p>
          <form action={startPaymentSetupAction}>
            <input type="hidden" name="appId" value={appId} />
            <SubmitButton variant="default" label="Agregar método de pago" />
          </form>
        </div>
      )}
    </section>
  );
}

/** Submit that reflects the redirect-to-Dodo in flight (own component so
 *  `useFormStatus` can read the parent form's pending state). */
function SubmitButton({
  label,
  variant,
}: {
  label: string;
  variant: "default" | "outline";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size="sm" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Redirigiendo…
        </>
      ) : (
        label
      )}
    </Button>
  );
}
