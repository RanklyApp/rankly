import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type GlassAmountInputProps = InputHTMLAttributes<HTMLInputElement> & {
  value: number;
  onValueChange: (value: number) => void;
};

/**
 * Frosted-glass amount bubble adapted to the site's deep-blue palette. The
 * `$` prefix frames a bare numeric input the owner types into to set their
 * daily bid (the "/día" framing is explained elsewhere). Purely presentational
 * — persistence lives in the form that wraps it (see BidForm).
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
        "mx-auto flex w-fit min-w-[10rem] items-center justify-center gap-2 rounded-full border border-sky-300/25 bg-sky-400/10 px-8 py-4 shadow-[0_8px_32px_rgba(3,10,30,0.45),0_0_36px_rgba(56,189,248,0.28)] backdrop-blur-md transition-colors focus-within:border-sky-300/60 focus-within:ring-1 focus-within:ring-sky-400/50",
        className,
      )}
    >
      <span className="text-xl font-semibold text-sky-200/80">$</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onValueChange(Number(e.target.value))}
        className="w-20 bg-transparent text-center text-3xl font-bold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        {...props}
      />
    </div>
  );
}
