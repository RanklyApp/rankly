CREATE TYPE "public"."app_plan" AS ENUM('free', 'paid');--> statement-breakpoint
CREATE TYPE "public"."app_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('impression', 'click');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin');--> statement-breakpoint
CREATE TABLE "apps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" varchar(80) NOT NULL,
	"description" text NOT NULL,
	"website_url" text NOT NULL,
	"logo_url" text NOT NULL,
	"category_id" uuid NOT NULL,
	"owner_user_id" uuid,
	"owner_email" text NOT NULL,
	"status" "app_status" DEFAULT 'pending' NOT NULL,
	"plan" "app_plan" DEFAULT 'free' NOT NULL,
	"monthly_amount_cents" integer DEFAULT 0 NOT NULL,
	"stripe_subscription_id" text,
	"clicks_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "apps_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"seo_title" text NOT NULL,
	"seo_description" text NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"type" "event_type" NOT NULL,
	"session_hash" text,
	"referrer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'owner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "apps_category_status_idx" ON "apps" USING btree ("category_id","status");--> statement-breakpoint
CREATE INDEX "apps_status_idx" ON "apps" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_app_created_idx" ON "events" USING btree ("app_id","created_at");