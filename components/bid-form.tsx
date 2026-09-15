"use client";

import { useActionState, useState } from "react";
import { type BidState, setBidAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const QUICK_AMOUNTS = [5, 10, 20] as const;
const MIN_BID = 5;

/**
 * Owner control to set the daily "destacar" bid for one business. A numeric
 * field (whole dollars, min $5) plus quick-pick buttons that fill it in.
 * `initialDollars` prefills the current desired amount; `hasMandate` toggles a
 * hint when there's no payment method wired yet.
 */
export function BidForm({
  appId,
  initialDollars,
  hasMandate,
}: {
  appId: string;
  initialDollars: number;
  hasMandate: boolean;
}) {
  const initial: BidState = {};
  const [state, action, pending] = useActionState(setBidAction, initial);
  const [amount, setAmount] = useState(
    initialDollars >= MIN_BID ? String(initialDollars) : "",
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="appId" value={appId} />

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <label
            htmlFor={`amount-${appId}`}
            className="block text-sm font-medium"
          >
            Monto por día (USD)
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">$</span>
            <Input
              id={`amount-${appId}`}
              name="amount"
              type="number"
              min={MIN_BID}
              step={1}
              inputMode="numeric"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(MIN_BID)}
              className="w-28"
            />
          </div>
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Sugeridos:</span>
        {QUICK_AMOUNTS.map((v) => (
          <Button
            key={v}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAmount(String(v))}
          >
            ${v}
          </Button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">Mínimo ${MIN_BID} por día.</p>

      {state.error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.ok && !state.notice && (
        <p className="text-sm text-success">Monto actualizado.</p>
      )}
      {state.notice && (
        <p className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground">
          {state.notice}
        </p>
      )}
      {!hasMandate && (
        <p className="text-xs text-muted-foreground">
          Todavía no configuraste un medio de pago: el monto queda guardado pero
          no se cobra ni sube en el ranking hasta activarlo.
        </p>
      )}
    </form>
  );
}
