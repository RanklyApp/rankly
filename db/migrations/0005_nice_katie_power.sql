ALTER TABLE "apps" ADD COLUMN "dodo_subscription_id" text;--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN "billing_alert_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "charges" ADD COLUMN "attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "charges" ADD COLUMN "next_retry_at" timestamp with time zone;