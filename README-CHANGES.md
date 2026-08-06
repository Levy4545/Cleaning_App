# Changes — Admin catalog, price ranges & service item types

## Latest (this update)

Merged `main` (includes admin calendar infinite-render fix) and shipped three product changes requested next:

### 1. Customer dashboard — no “Total spent”

The customer `/dashboard` no longer shows a Total spent / wallet stat. It keeps **Upcoming** and **Completed** only. Admin revenue on `/admin` is unchanged.

### 2. Per-service item types at booking

Each service has an `itemTypeOptions` list configured in the admin catalog.

| Seeded service | Item types shown at booking |
| --- | --- |
| Car Interior Cleaning | leather, fabric |
| Couch Cleaning | leather, fabric |
| Chair Cleaning | leather, fabric |
| Carpet Cleaning | *(none — field hidden)* |

- Admins set options as a comma-separated list when creating/editing a service.
- Leave blank → the booking wizard hides the item-type field.
- Selected value is stored on `appointment_items.item_type` as free text (no longer a fixed global enum).

### 3. Prices are ranges, not fixed amounts

`base_price` was replaced with `price_min` / `price_max`.

- Admin catalog: **Price min** + **Price max** (max ≥ min required).
- Booking, appointments, landing, and admin inbox show ranges via `formatPriceRange` (e.g. `$300.00 – $500.00`).
- Unpaid payment rows store the **lower bound** until cash PAID tracking lands.

### Schema migration

`src/db/migrations/0004_service_price_range_item_types.sql`

- Adds `item_type_options`, `price_min`, `price_max`
- Backfills seeded Car/Couch/Chair/Carpet defaults
- Converts `appointment_items.item_type` from enum → nullable text
- Drops `base_price` and the old `item_type` enum

Run: `npm run db:migrate`

---

## Earlier — Admin Services Catalog CRUD

- Route: `/admin/services`
- Create/edit categories; create/edit/activate services; delete empty categories
- Admin nav **Services** item

## How to verify

1. Customer dashboard → confirm no “Total spent”.
2. `/book` → Car shows leather/fabric; Carpet does not show item type; prices show as ranges.
3. `/admin/services` → edit a service’s item types / price min–max; confirm booking UI updates.
4. Create a service with blank item types → booking hides the field.

## Quality

- `npx eslint . --ignore-pattern "supabase/**"` — pass  
- `SKIP_ENV_VALIDATION=true npm run typecheck` — pass  
- Playwright E2E covering dashboard, car/carpet booking, admin validation, blank item types — pass  
