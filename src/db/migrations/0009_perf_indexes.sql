-- Performance indexes for hot query paths (list/filter/sort columns).
-- Idempotent so it is safe on databases that pre-date the drizzle snapshot.
CREATE INDEX IF NOT EXISTS "addresses_user_idx" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointment_items_appointment_idx" ON "appointment_items" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_shop_status_created_idx" ON "appointments" USING btree ("shop_id","status","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_customer_idx" ON "appointments" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_slot_idx" ON "appointments" USING btree ("slot_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "availability_slots_shop_starts_idx" ON "availability_slots" USING btree ("shop_id","starts_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_logs_appointment_idx" ON "job_logs" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_recipient_idx" ON "messages" USING btree ("recipient_id","sent_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_appointment_idx" ON "messages" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_feed_idx" ON "notifications" USING btree ("user_id","shop_id","channel","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_appointment_idx" ON "notifications" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_categories_shop_idx" ON "service_categories" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_shop_active_idx" ON "services" USING btree ("shop_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shop_members_user_idx" ON "shop_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shop_members_shop_idx" ON "shop_members" USING btree ("shop_id");
