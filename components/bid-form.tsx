"use client";

import { useActionState, useRef, useState } from "react";
import { type BidState, setBidAction } from "@/app/dashboard/actions";
import { GlassAmountInput } from "@/components/glass-amount-input";

const MIN_BID = 5;

/**
 * Owner control to set the daily "destacar" bid for one business, rendered as a
 * single frosted-glass amount bubble. Autosaves on blur / Enter through the
 * existing `setBidAction` server action (whole dollars, min $5 — unchanged).
 * `initialDollars` prefills the current desired amount.
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
  const [amount, setAmount] = useState(
    initialDollars >= MIN_BID ? initialDollars : MIN_BID,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Persist only when the value clears the minimum; below that we leave the
  // server-side guard untouched and just don't fire.
  const save = () => {
    if (amount >= MIN_BID) formRef.current?.requestSubmit();
  };

  return (
    <form ref={formRef} action={action} className="w-full">
      <input type="hidden" name="appId" value={appId} />

      <GlassAmountInput
        name="amount"
        value={amount}
        onValueChange={setAmount}
        disabled={pending}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            save();
          }
        }}
      />

      {state.error && (
        <p className="mt-2 text-center text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="mt-2 text-center text-sm text-success">
          Monto actualizado.
        </p>
      )}
    </form>
  );
}
