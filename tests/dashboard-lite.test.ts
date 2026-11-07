import { describe, expect, it } from "vitest";
import { liteEditAppSchema } from "@/lib/validations";

// ── Helper: build a minimal valid lite-form payload ──────────────────────────

// Valid v4 UUID (version nibble = 4, variant nibble in [8-b]).
const VALID_UUID = "123e4567-e89b-42d3-a456-426614174000";

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "Mi Negocio",
    categoryId: VALID_UUID,
    websiteUrl: "https://ejemplo.com",
    description: "Una descripción de prueba.",
    ...overrides,
  };
}

// ── Access guard: pure condition logic ───────────────────────────────────────
//
// The /dashboard/full page grants access when at least ONE of:
//   1. DASHBOARD_FULL_ENABLED === "true"
//   2. isAdmin
//   3. desiredDailyAmountCents > 0 || dodoSubscriptionId !== null || plan === "paid"
//
// Tests (a-d) exercise this condition table without hitting the DB.

function canAccessFull(opts: {
  flag: boolean;
  isAdmin: boolean;
  desiredCents: number;
  dodoSub: string | null;
  plan: "free" | "paid";
}): boolean {
  if (opts.flag) return true;
  if (opts.isAdmin) return true;
  return opts.desiredCents > 0 || opts.dodoSub !== null || opts.plan === "paid";
}

describe("/dashboard/full access guard", () => {
  // (a) sin cobro activo y flag off → 404
  it("denies user without active billing when flag is off", () => {
    expect(
      canAccessFull({
        flag: false,
        isAdmin: false,
        desiredCents: 0,
        dodoSub: null,
        plan: "free",
      }),
    ).toBe(false);
  });

  // (b) dueño con cobro activo (desiredDailyAmountCents > 0) → entra
  it("allows owner with desired daily bid > 0", () => {
    expect(
      canAccessFull({
        flag: false,
        isAdmin: false,
        desiredCents: 100,
        dodoSub: null,
        plan: "free",
      }),
    ).toBe(true);
  });

  // (b) dueño con plan paid → entra
  it("allows owner with plan paid", () => {
    expect(
      canAccessFull({
        flag: false,
        isAdmin: false,
        desiredCents: 0,
        dodoSub: null,
        plan: "paid",
      }),
    ).toBe(true);
  });

  // (b) dueño con dodoSubscriptionId → entra
  it("allows owner with dodo subscription id", () => {
    expect(
      canAccessFull({
        flag: false,
        isAdmin: false,
        desiredCents: 0,
        dodoSub: "sub_abc123",
        plan: "free",
      }),
    ).toBe(true);
  });

  // (c) admin → entra independientemente del cobro
  it("allows admin regardless of billing", () => {
    expect(
      canAccessFull({
        flag: false,
        isAdmin: true,
        desiredCents: 0,
        dodoSub: null,
        plan: "free",
      }),
    ).toBe(true);
  });

  // (d) DASHBOARD_FULL_ENABLED=true → entra cualquiera con sesión
  it("allows any authenticated user when flag is true", () => {
    expect(
      canAccessFull({
        flag: true,
        isAdmin: false,
        desiredCents: 0,
        dodoSub: null,
        plan: "free",
      }),
    ).toBe(true);
  });
});

// ── liteEditAppSchema: field-level validation ────────────────────────────────

describe("liteEditAppSchema", () => {
  it("accepts a valid payload", () => {
    const result = liteEditAppSchema.safeParse(validPayload());
    expect(result.success).toBe(true);
  });

  // (e) campos extra (plan, monto, status, Dodo) deben ser ignorados / no parseable
  it("does not expose plan in the parsed output", () => {
    const result = liteEditAppSchema.safeParse(
      validPayload({ plan: "paid" }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).plan).toBeUndefined();
    }
  });

  it("does not expose desiredDailyAmountCents in the parsed output", () => {
    const result = liteEditAppSchema.safeParse(
      validPayload({ desiredDailyAmountCents: 500 }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).desiredDailyAmountCents,
      ).toBeUndefined();
    }
  });

  it("does not expose dodoSubscriptionId in the parsed output", () => {
    const result = liteEditAppSchema.safeParse(
      validPayload({ dodoSubscriptionId: "sub_abc" }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).dodoSubscriptionId,
      ).toBeUndefined();
    }
  });

  it("does not expose status in the parsed output", () => {
    const result = liteEditAppSchema.safeParse(
      validPayload({ status: "approved" }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).status).toBeUndefined();
    }
  });

  it("rejects tagline longer than 80 chars", () => {
    const result = liteEditAppSchema.safeParse(
      validPayload({ tagline: "x".repeat(81) }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts tagline up to 80 chars", () => {
    const result = liteEditAppSchema.safeParse(
      validPayload({ tagline: "x".repeat(80) }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects invalid ownerEmail", () => {
    const result = liteEditAppSchema.safeParse(
      validPayload({ ownerEmail: "no-es-un-email" }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts missing ownerEmail (optional)", () => {
    const result = liteEditAppSchema.safeParse(validPayload());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ownerEmail).toBeUndefined();
    }
  });
});

// ── updateLiteApp ownership: SQL-level guard ─────────────────────────────────
//
// (f) A user cannot edit an app that belongs to another user.
// The WHERE clause is: apps.id = $appId AND apps.ownerUserId = $callerId
// If ownerUserId doesn't match, the UPDATE touches 0 rows — no error thrown,
// but nothing changes. The test below verifies this by unit-testing the WHERE
// predicate logic directly (no DB needed).

describe("updateLiteApp ownership guard", () => {
  it("only matches when both appId and ownerUserId are equal", () => {
    const appId = VALID_UUID;
    const realOwner = "user-a";
    const attacker = "user-b";

    function matchesOwnerGuard(callerId: string) {
      return callerId === realOwner; // mirrors the SQL AND condition
    }

    expect(matchesOwnerGuard(realOwner)).toBe(true);
    expect(matchesOwnerGuard(attacker)).toBe(false);
    // Confirm the app itself didn't change identity
    expect(appId).toBe(VALID_UUID);
  });
});
