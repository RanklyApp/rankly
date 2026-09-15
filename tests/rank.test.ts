import { describe, expect, it } from "vitest";
import { rankApps, type RankableApp } from "@/lib/rank";

/** Test factory. createdAt defaults to a fixed epoch offset by `age` days. */
function app(overrides: Partial<RankableApp> & { id: string }): RankableApp {
  return {
    plan: "free",
    dailyAmountCents: 0,
    clicksCount: 0,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("rankApps", () => {
  it("degrades to pure organic order when there are no paid apps", () => {
    const apps = [
      app({ id: "a", clicksCount: 10 }),
      app({ id: "b", clicksCount: 50 }),
      app({ id: "c", clicksCount: 30 }),
    ];

    const { promoted, organic, ordered } = rankApps(apps);

    expect(promoted).toHaveLength(0);
    expect(organic.map((a) => a.id)).toEqual(["b", "c", "a"]);
    expect(ordered.map((a) => a.id)).toEqual(["b", "c", "a"]);
  });

  it("puts a single paid app on top regardless of its clicks", () => {
    const apps = [
      app({ id: "free-hi", clicksCount: 999 }),
      app({ id: "paid", plan: "paid", dailyAmountCents: 5000, clicksCount: 0 }),
      app({ id: "free-lo", clicksCount: 10 }),
    ];

    const { promoted, ordered } = rankApps(apps);

    expect(promoted.map((a) => a.id)).toEqual(["paid"]);
    expect(ordered[0].id).toBe("paid");
    // Organic follows, ordered by clicks DESC.
    expect(ordered.slice(1).map((a) => a.id)).toEqual(["free-hi", "free-lo"]);
  });

  it("breaks amount ties deterministically (newest first, then id)", () => {
    const apps = [
      app({
        id: "older",
        plan: "paid",
        dailyAmountCents: 3000,
        createdAt: new Date("2025-01-01T00:00:00Z"),
      }),
      app({
        id: "newer",
        plan: "paid",
        dailyAmountCents: 3000,
        createdAt: new Date("2025-06-01T00:00:00Z"),
      }),
    ];

    const { promoted } = rankApps(apps);

    // Same amount -> newer app wins the tie-break.
    expect(promoted.map((a) => a.id)).toEqual(["newer", "older"]);
  });

  it("caps the promoted block and rotates so every paid app gets exposure", () => {
    const paid = Array.from({ length: 7 }, (_, i) =>
      app({
        id: `p${i}`,
        plan: "paid",
        // Descending amounts: p0 highest ... p6 lowest.
        dailyAmountCents: (7 - i) * 1000,
      }),
    );
    const free = [app({ id: "f0", clicksCount: 5 })];
    const all = [...paid, ...free];
    const maxPromoted = 5;

    // Every offset yields exactly `maxPromoted` promoted apps.
    const seen = new Set<string>();
    for (let offset = 0; offset < paid.length; offset++) {
      const { promoted, organic, ordered } = rankApps(all, {
        maxPromoted,
        offset,
      });

      expect(promoted).toHaveLength(maxPromoted);
      // Promoted block stays sorted by amount DESC.
      const amounts = promoted.map((a) => a.dailyAmountCents);
      expect(amounts).toEqual([...amounts].sort((x, y) => y - x));
      // Overflow paid (2 of them) + the free app land in organic.
      expect(organic).toHaveLength(3);
      // No app is lost or duplicated.
      expect(ordered).toHaveLength(all.length);
      expect(new Set(ordered.map((a) => a.id)).size).toBe(all.length);

      promoted.forEach((a) => seen.add(a.id));
    }

    // Across a full rotation cycle, all 7 paid apps appeared in the block.
    paid.forEach((p) => expect(seen.has(p.id)).toBe(true));
  });

  it("is deterministic for a given offset", () => {
    const all = Array.from({ length: 8 }, (_, i) =>
      app({ id: `p${i}`, plan: "paid", dailyAmountCents: (8 - i) * 100 }),
    );

    const a = rankApps(all, { offset: 3, maxPromoted: 5 });
    const b = rankApps(all, { offset: 3, maxPromoted: 5 });

    expect(a.ordered.map((x) => x.id)).toEqual(b.ordered.map((x) => x.id));
  });
});
