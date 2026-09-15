import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
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
    // Stored in cents to avoid floating-point money bugs. Whole dollars only
    // (multiple of 100) — see apps_daily_amount_whole_dollars check. Keeps every
    // bid an integer $, so any mid-day increase is >= $1 (Dodo's min charge).
    dailyAmountCents: integer("daily_amount_cents").notNull().default(0),
    stripeSubscriptionId: text("stripe_subscription_id"),
    clicksCount: integer("clicks_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("apps_category_status_idx").on(t.categoryId, t.status),
    index("apps_status_idx").on(t.status),
    // Daily bid must be a whole number of dollars (no cents).
    check("apps_daily_amount_whole_dollars", sql`${t.dailyAmountCents} % 100 = 0`),
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
