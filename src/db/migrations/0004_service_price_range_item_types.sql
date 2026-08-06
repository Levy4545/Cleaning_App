-- Price ranges + per-service item type options; appointment item_type becomes free text.

ALTER TABLE "services" ADD COLUMN "item_type_options" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "price_min" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "price_max" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint

-- Preserve existing fixed prices as equal min/max ranges.
UPDATE "services" SET "price_min" = "base_price", "price_max" = "base_price";--> statement-breakpoint

-- Seeded catalog defaults: material options + illustrative ranges.
UPDATE "services"
SET
  "item_type_options" = ARRAY['leather', 'fabric']::text[],
  "price_min" = '300.00',
  "price_max" = '500.00'
WHERE lower("name") LIKE '%car%' AND lower("name") NOT LIKE '%carpet%';--> statement-breakpoint

UPDATE "services"
SET
  "item_type_options" = ARRAY['leather', 'fabric']::text[],
  "price_min" = '250.00',
  "price_max" = '450.00'
WHERE lower("name") LIKE '%couch%';--> statement-breakpoint

UPDATE "services"
SET
  "item_type_options" = ARRAY['leather', 'fabric']::text[],
  "price_min" = '80.00',
  "price_max" = '150.00'
WHERE lower("name") LIKE '%chair%';--> statement-breakpoint

UPDATE "services"
SET
  "item_type_options" = '{}'::text[],
  "price_min" = '200.00',
  "price_max" = '400.00'
WHERE lower("name") LIKE '%carpet%';--> statement-breakpoint

ALTER TABLE "services" DROP COLUMN "base_price";--> statement-breakpoint

-- Convert enum-backed item_type to nullable free text (leather/fabric/…).
ALTER TABLE "appointment_items" ALTER COLUMN "item_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment_items" ALTER COLUMN "item_type" SET DATA TYPE text USING "item_type"::text;--> statement-breakpoint
DROP TYPE IF EXISTS "public"."item_type";
