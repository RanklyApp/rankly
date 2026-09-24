"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { type BidState, setBidAction } from "@/app/dashboard/actions";
import { GlassAmountInput } from "@/components/glass-amount-input";
import { Button } from "@/components/ui/button";

/**
 * Owner control to set the daily "destacar" bid for one business, rendered as a
 * single frosted-glass amount bubble.
 *
 * IMPORTANT: this does NOT autosave. A raise charges the diff immediately, so a
 * stray edit must never persist on its own. Typing a new value reveals explicit
 * "Aplicar" / "Cancelar" buttons; nothing is saved or charged until "Aplicar"
 * (which fires `setBidAction` → `applyBidChange`). "Cancelar" discards the edit
 * and restores the previously saved amount. `initialDollars` is the current
 * desired amount.
 */
export function BidForm({
  appId,
  initialDollars,
}: {
  appId: string;
  initialDollars: number;
}) {
  const [state, action, pending] = useActionState(
    setBidAction,
    {} as BidState,
  );

  // Whole dollars, never negative. $0 is a valid bid: it means "don't pay",
  // which pulls the business out of the paid section. Any positive bid is at
  // least $1 (Dodo's minimum charge) — there's no $5 floor.
  const normalize = (n: number) =>
    Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  // `saved` = last value we know is persisted server-side. `amount` = what's in
  // the input right now. They diverge while the owner is editing.
  const [saved, setSaved] = useState(normalize(initialDollars));
  const [amount, setAmount] = useState(normalize(initialDollars));
  const formRef = useRef<HTMLFormElement>(null);
  // The value that was in flight when we submitted, so we can promote it to
  // `saved` only once the server confirms it.
  const submittedRef = useRef(saved);

  const dirty = amount !== saved;
  // Valid = a whole-dollar amount of $0 or more (0 = leave the paid section).
  const valid = Number.isInteger(amount) && amount >= 0;

  // Promote the submitted value to `saved` once the action reports success
  // (ok / notice both mean the desired amount was stored). On a hard error we
  // leave the edit in place so the owner can retry or cancel.
  useEffect(() => {
    if (state.ok) setSaved(submittedRef.current);
  }, [state]);

  const apply = () => {
    if (!dirty || !valid || pending) return;
    submittedRef.current = amount;
    formRef.current?.requestSubmit();
  };

  const cancel = () => {
    setAmount(saved);
  };

  return (
    <form ref={formRef} action={action} className="w-full">
      <input type="hidden" name="appId" value={appId} />

      <GlassAmountInput
        name="amount"
        value={amount}
        onValueChange={setAmount}
        disabled={pending}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            apply();
          }
          if (e.key === "Escape" && dirty) {
            e.preventDefault();
            cancel();
          }
        }}
      />

      {/* Confirmation controls appear only while there's an unsaved change. */}
      {dirty && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={cancel}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={apply}
            disabled={!valid || pending}
          >
            {pending ? "Aplicando…" : "Aplicar"}
          </Button>
        </div>
      )}

      {!valid && dirty && (
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Ingresá un monto en dólares enteros ($0 o más).
        </p>
      )}
      {state.error && (
        <p className="mt-2 text-center text-sm text-destructive">
          {state.error}
        </p>
      )}
      {!dirty && state.notice && (
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {state.notice}
        </p>
      )}
      {!dirty && state.ok && !state.notice && (
        <p className="mt-2 text-center text-sm text-success">
          Monto actualizado.
        </p>
      )}
    </form>
  );
}
