-- Per-service toggle for booking time windows. Off means the appointment has no slot.

ALTER TABLE "services" ADD COLUMN "requires_time_window" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "slot_id" DROP NOT NULL;
