CREATE TABLE "ranking_leader" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"leader_app_id" uuid,
	"last_accrual_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN "first_place_seconds_total" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ranking_leader" ADD CONSTRAINT "ranking_leader_leader_app_id_apps_id_fk" FOREIGN KEY ("leader_app_id") REFERENCES "public"."apps"("id") ON DELETE set null ON UPDATE no action;