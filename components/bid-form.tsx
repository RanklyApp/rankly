"use client";

import { Check } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
 * "Aplicar" / "Cancelar" buttons (with a subtle spring reveal); nothing is saved
 * or charged until "Aplicar" (which fires `setBidAction` → `applyBidChange`).
 * "Cancelar" discards the edit and restores the previously saved amount. On a
 * clean save a green check pulses in beside the field, then fades on its own.
 * `initialDollars` is the current desired amount.
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
  const reduce = useReducedMotion();

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

  // Success check: shown briefly on a clean save, then auto-dismissed.
  const [showCheck, setShowCheck] = useState(false);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dirty = amount !== saved;
  // Valid = a whole-dollar amount of $0 or more (0 = leave the paid section).
  const valid = Number.isInteger(amount) && amount >= 0;

  // Promote the submitted value to `saved` once the action reports success
  // (ok / notice both mean the desired amount was stored). On a hard error we
  // leave the edit in place so the owner can retry or cancel. A clean success
  // (no notice) flashes the check for ~2s.
  useEffect(() => {
    if (!state.ok) return;
    setSaved(submittedRef.current);
    if (!state.notice) {
      setShowCheck(true);
      if (checkTimer.current) clearTimeout(checkTimer.current);
      checkTimer.current = setTimeout(() => setShowCheck(false), 2000);
    }
  }, [state]);

  useEffect(
    () => () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
    },
    [],
  );

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

      <div className="relative mx-auto w-fit">
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

        {/* Success check, pinned to the right of the bubble. The outer span owns
            the positioning (a transform); the inner motion span only scales +
            fades, so the two transforms never fight. */}
        <span className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2">
          <AnimatePresence>
            {showCheck && (
              <motion.span
                key="ok"
                aria-hidden
                className="block text-emerald-400"
                initial={
                  reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.9)" }
                }
                animate={
                  reduce ? { opacity: 1 } : { opacity: 1, transform: "scale(1)" }
                }
                exit={
                  reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.9)" }
                }
                transition={{
                  duration: reduce ? 0.12 : 0.15,
                  ease: [0.23, 1, 0.32, 1],
                }}
              >
                <Check className="size-5" strokeWidth={3} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </div>
      {/* Screen-reader confirmation (the check is aria-hidden). */}
      {showCheck && (
        <span role="status" className="sr-only">
          Monto actualizado.
        </span>
      )}

      {/* Confirmation controls appear only while there's an unsaved change, with
          a subtle spring reveal (fade + short slide). */}
      <AnimatePresence initial={false}>
        {dirty && (
          <motion.div
            key="bid-actions"
            className="mt-3 flex items-center justify-center gap-2"
            initial={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, transform: "translateY(-6px)" }
            }
            animate={
              reduce
                ? { opacity: 1 }
                : { opacity: 1, transform: "translateY(0px)" }
            }
            exit={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, transform: "translateY(-6px)" }
            }
            transition={
              reduce
                ? { duration: 0.12 }
                : { type: "spring", duration: 0.25, bounce: 0.15 }
            }
          >
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
          </motion.div>
        )}
      </AnimatePresence>

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
    </form>
  );
}
