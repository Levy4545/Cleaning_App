-- In-app notification metadata + unread tracking for the notifications center.

ALTER TABLE "notifications" ADD COLUMN "appointment_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "type" text DEFAULT 'GENERAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "href" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_created_idx" ON "notifications" ("user_id", "created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_unread_idx" ON "notifications" ("user_id") WHERE "read_at" IS NULL AND "channel" = 'IN_APP';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_appointment_sent_idx" ON "messages" ("appointment_id", "sent_at");
