-- Day-only bookings when a service does not require a time window.

ALTER TABLE "appointments" ADD COLUMN "requested_date" date;--> statement-breakpoint
CREATE TABLE "available_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"day" date NOT NULL,
	"status" "slot_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "available_days" ADD CONSTRAINT "available_days_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "available_days" ADD CONSTRAINT "available_days_shop_day_unique" UNIQUE("shop_id","day");
