import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type GlassAmountInputProps = InputHTMLAttributes<HTMLInputElement> & {
  value: number;
  onValueChange: (value: number) => void;
};

/**
 * Frosted-glass amount bubble adapted to the site's deep-blue palette. The
 * `$` prefix and `/día` suffix frame a bare numeric input the owner types into
 * to set their daily bid. Purely presentational — persistence lives in the
 * form that wraps it (see BidForm).
 */
export function GlassAmountInput({
  value,
  onValueChange,
  className,
  ...props
}: GlassAmountInputProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 shadow-[0_8px_32px_rgba(3,10,30,0.45)] backdrop-blur-md transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/40",
        className,
      )}
    >
      <span className="text-lg text-muted-foreground">$</span>
      <input
        type="number"
        min={5}
        value={value}
        onChange={(e) => onValueChange(Number(e.target.value))}
        className="w-20 bg-transparent text-2xl font-semibold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        {...props}
      />
      <span className="text-sm text-muted-foreground">/día</span>
    </div>
  );
}
