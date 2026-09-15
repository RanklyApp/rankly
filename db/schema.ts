import { relations, sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// --- Enums ---
export const appStatusEnum = pgEnum("app_status", [
  "pending",
  "approved",
  "rejected",
]);
export const appPlanEnum = pgEnum("app_plan", ["free", "paid"]);
export const eventTypeEnum = pgEnum("event_type", ["impression", "click"]);
export const userRoleEnum = pgEnum("user_role", ["owner", "admin"]);

// Billing (Gate D — Dodo Payments).
// billing_day: one row per app per UTC day, tracking the desired bid (target)
// vs. what has actually been charged+confirmed (charged). `active` = confirmed,
// i.e. eligible to rank. charge: one off-session payment attempt (daily base or
// mid-day diff) with its own idempotency key + Dodo payment id.
export const billingDayStatusEnum = pgEnum("billing_day_status", [
  "pending",
  "active",
  "failed",
]);
export const chargeKindEnum = pgEnum("charge_kind", ["daily", "diff"]);
export const chargeStatusEnum = pgEnum("charge_status", [
  "pending",
  "processing",
  "succeeded",
  "failed",
]);

// --- users ---
// id mirrors Supabase auth.users.id. Populated in Phase 2 (magic link).
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull().default("owner"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- categories ---
// Single level, no hierarchy.
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // lucide-react icon name
  seoTitle: text("seo_title").notNull(),
  seoDescription: text("seo_description").notNull(),
});

// --- apps ---
export const apps = pgTable(
  "apps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    tagline: varchar("tagline", { length: 80 }).notNull(),
    description: text("description").notNull(),
    websiteUrl: text("website_url").notNull(),
    logoUrl: text("logo_url").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    ownerUserId: uuid("owner_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ownerEmail: text("owner_email").notNull(),
    status: appStatusEnum("status").notNull().default("pending"),
    plan: appPlanEnum("plan").notNull().default("free"),
    // EFFECTIVE daily amount used for ranking, in cents. Only rises once a charge
    // is CONFIRMED via the Dodo webhook — never on an unconfirmed bid change (so
    // paying is what buys rank). The desired/pending bid lives on billing_days.
    // Whole dollars only (multiple of 100) — see apps_daily_amount_whole_dollars
    // check — so any mid-day increase is >= $1 (Dodo's min charge).
    dailyAmountCents: integer("daily_amount_cents").notNull().default(0),
    // DESIRED daily bid the owner picked (slider), in cents. Set immediately on
    // change — it drives what we try to charge — but does NOT affect ranking until
    // a charge for it confirms (then dailyAmountCents catches up). Whole dollars.
    desiredDailyAmountCents: integer("desired_daily_amount_cents")
      .notNull()
      .default(0),
    // Dodo Payments linkage, captured from the owner's first checkout (an
    // on-demand subscription MANDATE — mandate_only). Off-session charges go
    // through `subscriptions.charge(dodoSubscriptionId, ...)` (see
    // lib/billing/dodo.ts). Null until the owner authorizes the mandate.
    dodoSubscriptionId: text("dodo_subscription_id"),
    dodoCustomerId: text("dodo_customer_id"),
    // Deprecated: the on-demand mandate model charges via dodoSubscriptionId, not
    // a raw payment method. Kept (unused) to avoid a destructive migration.
    dodoPaymentMethodId: text("dodo_payment_method_id"),
    dodoBillingCountry: text("dodo_billing_country"), // ISO 3166-1 alpha-2
    // Set when a day's charge finally failed after all retries (owner dropped to
    // free). Drives the "no pudimos cobrarte" dashboard notice; cleared on the
    // next successful charge.
    billingAlertAt: timestamp("billing_alert_at", { withTimezone: true }),
    stripeSubscriptionId: text("stripe_subscription_id"),
    clicksCount: integer("clicks_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("apps_category_status_idx").on(t.categoryId, t.status),
    index("apps_status_idx").on(t.status),
    // Daily bids must be a whole number of dollars (no cents).
    check("apps_daily_amount_whole_dollars", sql`${t.dailyAmountCents} % 100 = 0`),
    check(
      "apps_desired_amount_whole_dollars",
      sql`${t.desiredDailyAmountCents} % 100 = 0`,
    ),
  ],
);

// --- events ---
// Raw impression/click log. Aggregated for the owner dashboard in Phase 2.
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    type: eventTypeEnum("type").notNull(),
    // Coarse anonymous visitor id (hashed), for de-duping. No PII.
    sessionHash: text("session_hash"),
    referrer: text("referrer"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("events_app_created_idx").on(t.appId, t.createdAt)],
);

// --- billing_days ---
// One row per app per UTC day. `targetAmountCents` is the desired bid (may be
// ahead of what's paid); `chargedAmountCents` is the confirmed total for the day.
// `status` = active once at least the target has been confirmed-charged.
export const billingDays = pgTable(
  "billing_days",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    day: date("day").notNull(), // UTC calendar day this bid applies to
    targetAmountCents: integer("target_amount_cents").notNull(),
    chargedAmountCents: integer("charged_amount_cents").notNull().default(0),
    status: billingDayStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("billing_days_app_day_uq").on(t.appId, t.day),
    check(
      "billing_days_whole_dollars",
      sql`${t.targetAmountCents} % 100 = 0 AND ${t.chargedAmountCents} % 100 = 0`,
    ),
  ],
);

// --- charges ---
// One off-session payment attempt against a saved Dodo payment method. `kind`
// distinguishes the daily base charge from a mid-day diff (bid raised). The
// idempotency key prevents double-charging on retries; dodoPaymentId links to
// the Dodo payment for webhook reconciliation.
export const charges = pgTable(
  "charges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    billingDayId: uuid("billing_day_id")
      .notNull()
      .references(() => billingDays.id, { onDelete: "cascade" }),
    kind: chargeKindEnum("kind").notNull(),
    amountCents: integer("amount_cents").notNull(),
    status: chargeStatusEnum("status").notNull().default("pending"),
    dodoPaymentId: text("dodo_payment_id").unique(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    // Retry policy: up to 3 attempts (immediate, +2h, +6h from createdAt); after
    // the last failure the app drops to free. nextRetryAt is when the cron should
    // re-fire (null = no retry pending / done).
    attempts: integer("attempts").notNull().default(0),
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("charges_app_idx").on(t.appId),
    index("charges_billing_day_idx").on(t.billingDayId),
    check("charges_amount_whole_dollars", sql`${t.amountCents} % 100 = 0`),
  ],
);

// --- Relations ---
export const categoriesRelations = relations(categories, ({ many }) => ({
  apps: many(apps),
}));

export const appsRelations = relations(apps, ({ one, many }) => ({
  category: one(categories, {
    fields: [apps.categoryId],
    references: [categories.id],
  }),
  owner: one(users, {
    fields: [apps.ownerUserId],
    references: [users.id],
  }),
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  app: one(apps, { fields: [events.appId], references: [apps.id] }),
}));

// --- Inferred types ---
export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type User = typeof users.$inferSelect;
export type BillingDay = typeof billingDays.$inferSelect;
export type NewBillingDay = typeof billingDays.$inferInsert;
export type Charge = typeof charges.$inferSelect;
export type NewCharge = typeof charges.$inferInsert;
