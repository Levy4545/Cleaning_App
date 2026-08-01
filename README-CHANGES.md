# Admin Services Catalog — Changes

This document summarizes the Admin catalog CRUD feature added in this change set.

## Idea implemented

**Next Critical MVP item from `Todo.md`:** Admin manage categories & services UI at `/admin/services`.

Previously the catalog only existed via `npm run db:seed`. Admins had no in-app way to add, edit, or deactivate bookable services.

## What changed

### New route

- **`/admin/services`** — admin-only catalog manager (protected by existing `requireAdmin` + middleware)

### New / updated files

| Path | Change |
| --- | --- |
| `src/app/admin/services/page.tsx` | New RSC page: loads all categories + services for the default shop |
| `src/components/admin/services-catalog.tsx` | New client UI: category sidebar, service list, create/edit drawers, activate/deactivate |
| `src/actions/services.ts` | New server actions for category + service mutations |
| `src/validators/services.ts` | New Zod schemas for catalog inputs |
| `src/db/queries/services.ts` | Extended with list-all, find/update/delete category helpers, update/activate service |
| `src/lib/slugify.ts` | Shared slug helper for category slugs |
| `src/components/layout/nav-items.ts` | Added **Services** link to `adminNav` |
| `README.md` / `Todo.md` | Documented the new route and marked the task done |

### Capabilities

**Categories**
- Create / edit name + slug (slug auto-generated from name; uniqueness enforced per shop)
- Delete only when the category has **zero** services (CASCADE would wipe child services)

**Services**
- Create / edit: category, name, description, delivery modes (`DROP_OFF` / `ON_SITE`), duration, base price, active flag
- Soft-deactivate / reactivate (`isActive`) — hard delete avoided because appointments FK is `ON DELETE restrict`
- Inactive services remain visible to admins but stay hidden from `/book` (still filtered by `listActiveServices`)

### Behavior notes

- Mutations call `requireAdmin()` and revalidate `/admin/services`, `/book`, `/dashboard`, and `/`.
- Empty categories can be removed; categories with services show a disabled delete control with a tooltip.
- UI matches the existing Master-Gold admin shell (cards, gold primary actions, modal drawers).

## How to try it

1. Sign in as an admin (`ADMIN_BOOTSTRAP_EMAIL` or `npm run db:promote-admin -- you@example.com`).
2. Open [http://localhost:3000/admin/services](http://localhost:3000/admin/services).
3. Add a category (e.g. “Home”), then add a service under it.
4. Confirm the new active service appears in the customer `/book` wizard.
5. Deactivate the service and confirm it disappears from `/book` while remaining listed in the admin catalog.

## Out of scope (still open in Todo)

- Cleaner-facing UI
- Automated tests
- Cash PAID admin UI
- Service images / recurring slots
