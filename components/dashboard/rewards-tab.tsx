"use client";

/* Placeholder — rewards tab will be redesigned. */
export function RewardsTab({
  daysAtRank1,
  currentRank,
}: {
  businessName: string;
  daysAtRank1: number;
  currentRank: number;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p className="text-4xl font-light tabular-nums text-white">{daysAtRank1}</p>
      <p className="text-xs uppercase tracking-[0.14em] text-white/35">días en el puesto #{currentRank}</p>
    </div>
  );
}
