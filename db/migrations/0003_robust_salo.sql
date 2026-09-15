CREATE TYPE "public"."billing_day_status" AS ENUM('pending', 'active', 'failed');--> statement-breakpoint
CREATE TYPE "public"."charge_kind" AS ENUM('daily', 'diff');--> statement-breakpoint
CREATE TYPE "public"."charge_status" AS ENUM('pending', 'processing', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "billing_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"day" date NOT NULL,
	"target_amount_cents" integer NOT NULL,
	"charged_amount_cents" integer DEFAULT 0 NOT NULL,
	"status" "billing_day_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_days_whole_dollars" CHECK ("billing_days"."target_amount_cents" % 100 = 0 AND "billing_days"."charged_amount_cents" % 100 = 0)
);
--> statement-breakpoint
CREATE TABLE "charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"billing_day_id" uuid NOT NULL,
	"kind" charge_kind NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" charge_status DEFAULT 'pending' NOT NULL,
	"dodo_payment_id" text,
	"idempotency_key" text NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "charges_dodo_payment_id_unique" UNIQUE("dodo_payment_id"),
	CONSTRAINT "charges_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "charges_amount_whole_dollars" CHECK ("charges"."amount_cents" % 100 = 0)
);
--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN "dodo_customer_id" text;--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN "dodo_payment_method_id" text;--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN "dodo_billing_country" text;--> statement-breakpoint
ALTER TABLE "billing_days" ADD CONSTRAINT "billing_days_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_billing_day_id_billing_days_id_fk" FOREIGN KEY ("billing_day_id") REFERENCES "public"."billing_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_days_app_day_uq" ON "billing_days" USING btree ("app_id","day");--> statement-breakpoint
CREATE INDEX "charges_app_idx" ON "charges" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "charges_billing_day_idx" ON "charges" USING btree ("billing_day_id");