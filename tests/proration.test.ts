import { describe, expect, it } from "vitest";
import { prorationChargeCents, shouldChargeNow } from "@/lib/billing/proration";

describe("prorationChargeCents", () => {
  it("charges the full bid on a new day (nothing charged yet)", () => {
    expect(prorationChargeCents({ targetCents: 300, alreadyChargedCents: 0 })).toBe(300);
  });

  it("charges only the difference when the bid is raised mid-day", () => {
    expect(prorationChargeCents({ targetCents: 500, alreadyChargedCents: 300 })).toBe(200);
  });

  it("charges nothing when the bid is lowered mid-day", () => {
    expect(prorationChargeCents({ targetCents: 200, alreadyChargedCents: 300 })).toBe(0);
  });

  it("charges nothing when unchanged", () => {
    expect(prorationChargeCents({ targetCents: 300, alreadyChargedCents: 300 })).toBe(0);
  });

  it("a positive diff is always a whole dollar (>= $1) with whole-dollar bids", () => {
    const diff = prorationChargeCents({ targetCents: 400, alreadyChargedCents: 300 });
    expect(diff).toBe(100);
    expect(diff % 100).toBe(0);
  });
});

describe("shouldChargeNow", () => {
  it("true only when there is a positive diff", () => {
    expect(shouldChargeNow({ targetCents: 500, alreadyChargedCents: 300 })).toBe(true);
    expect(shouldChargeNow({ targetCents: 300, alreadyChargedCents: 300 })).toBe(false);
    expect(shouldChargeNow({ targetCents: 100, alreadyChargedCents: 300 })).toBe(false);
  });
});
