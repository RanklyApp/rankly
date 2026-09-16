import { describe, expect, it } from "vitest";
import { clampDelta } from "@/lib/first-place";
import { ACCRUAL_MAX_DELTA_SECONDS } from "@/lib/constants";

const S = 1000; // ms per second

describe("clampDelta", () => {
  it("returns whole seconds elapsed between two instants", () => {
    const from = new Date("2026-01-01T00:00:00Z").getTime();
    const to = new Date("2026-01-01T00:05:00Z").getTime(); // +5 min
    expect(clampDelta(from, to)).toBe(300);
  });

  it("floors sub-second remainders", () => {
    expect(clampDelta(0, 1500)).toBe(1); // 1.5s -> 1
  });

  it("returns 0 for a zero interval", () => {
    expect(clampDelta(1000, 1000)).toBe(0);
  });

  it("returns 0 on clock skew (negative delta)", () => {
    const to = new Date("2026-01-01T00:00:00Z").getTime();
    const from = to + 60 * S; // 'from' after 'to'
    expect(clampDelta(from, to)).toBe(0);
  });

  it("clamps a long outage to the max per-tick credit", () => {
    const from = 0;
    const to = 5 * 24 * 3600 * S; // 5 days
    expect(clampDelta(from, to)).toBe(ACCRUAL_MAX_DELTA_SECONDS);
  });

  it("respects a custom max", () => {
    expect(clampDelta(0, 10 * S, 4)).toBe(4);
  });

  it("does not clamp when delta is below the cap", () => {
    expect(clampDelta(0, ACCRUAL_MAX_DELTA_SECONDS * S)).toBe(
      ACCRUAL_MAX_DELTA_SECONDS,
    );
  });
});
