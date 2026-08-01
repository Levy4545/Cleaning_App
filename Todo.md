# Cleaning App — Development Todo

Derived from [`docs/uml/`](./docs/uml/) (single-shop design).  
Marketplace multi-tenant work lives in [`docs/uml-marketplace/`](./docs/uml-marketplace/). Lightweight scaffolds (`shops`, `shopId`, `shop_members`, theme JSON) are already in the schema — **no multi-tenant UI yet**.

## Agreed MVP (deployment target)

```text
Client books
  → Admin notified (email and/or SMS)
  → Admin approves → Client notified (email and/or SMS)
  → Service completed (status updates on site)
  → Done → Client can leave a review
```

Happy-path statuses: `PENDING` → `APPROVED` → `COMPLETED` → review.  
Cash payment tracking and cleaner assignment remain in the schema for later; they are not required to ship this MVP slice.

## Priority legend

| Grade | Meaning |
| --- | --- |
| **Critical** | Required for the agreed MVP above |
| **High** | Strongly needed right after MVP |
| **Moderate** | Important polish / completeness |
| **Low** | Nice-to-have UX / QoL |
| **Future** | Marketplace / v1.5+ |

## Status

| Status | Meaning |
| --- | --- |
| `[ ]` | Not started |
| `[~]` | Partial / scaffold exists |
| `[x]` | Done |

---

## 0. Foundation

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [x] | Critical | Next.js App Router + TypeScript + Tailwind | Next 16 + Master-Gold theme |
| [x] | Critical | Supabase auth (email + Google OAuth callback) | `next` / `redirectTo` validated |
| [x] | Critical | Middleware route protection | `/dashboard`, `/settings`, `/book`, `/appointments`, `/admin/*` |
| [x] | Critical | Env validation (`src/env.ts`) | Zod + optional notify keys |
| [x] | Critical | Drizzle + Postgres Docker + migrations | Domain schema through `0003` (`status_note`) |
| [x] | Critical | Roles: `USER` / `ADMIN` / `CLEANER` | Guards; roles not shown in UI chrome |
| [x] | Critical | Marketplace scaffold (silent) | `shops`, `shop_members`, `shopId`, `getDefaultShop()` |
| [x] | Critical | Notification facade (email/SMS stub + Resend/Twilio) | Console stub when unset |
| [x] | Critical | Reviews table + query helpers | Post-complete reviews |
| [x] | Critical | Auth guards on admin pages | `requireAdmin` |
| [x] | High | RLS policies file for all domain tables | `supabase/rls.sql` — apply in Supabase SQL editor |
| [x] | Moderate | Align `eslint-config-next` with Next major | `lint` → `eslint .` |
| [x] | Low | Remove unused deps | Dropped `notenv` |
| [x] | Low | `db:wipe` localhost guard | Requires `--allow-remote` otherwise |

---

## MVP UI progress (current)

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [x] | Critical | Promote admin (`ADMIN_BOOTSTRAP_EMAIL` or `npm run db:promote-admin`) | Email lookup is case-insensitive |
| [x] | Critical | `/admin` shell + overview | Dark/gold shell |
| [x] | Critical | `/admin/calendar` paint-style week slots | Free / occupied / unavailable |
| [x] | Critical | `/admin/appointments` inbox approve / reject / complete | Reject requires reason → `statusNote` |
| [x] | Critical | `/book` 4-step wizard | Mode initialized from selected service |
| [x] | Critical | `/appointments` list + cancel + review | Cancel pending/approved |
| [x] | Critical | Middleware protects customer + admin routes | |
| [x] | Critical | Booking slot lock / race handling | `FOR UPDATE` + active status check |
| [x] | High | Editable profile / phone | `/settings` |
| [x] | Moderate | Week calendar UX | Paint tools + arrows |
| [ ] | Moderate | Admin catalog CRUD UI | Seed covers catalog for now |
| [ ] | High | Cleaner-facing UI | Schema + guards only |
| [ ] | High | Automated tests | Transitions / booking race |

---

## 1. Domain schema & data layer

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [x] | Critical | Extend roles + phone on `users` | |
| [x] | Critical | Addresses, services, slots, appointments, payments, reviews, … | |
| [x] | Critical | Migrations + seed (`npm run db:seed`) | Default shop + catalog |
| [x] | Critical | Query helpers + booking/transition helpers | Address created inside booking tx |
| [x] | High | Appointment status transition helper | Allows APPROVED→COMPLETED for MVP |
| [x] | Moderate | Ordered active services | `ORDER BY name` |

---

## 2. Authorization & routing

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [x] | Critical | Role-based redirects after login | `homePathForRole` + safe `redirectTo` |
| [x] | Critical | Protect `/admin/*` with `requireAdmin` | Middleware + server guards |
| [~] | Critical | Protect `/cleaner/*` with `requireCleaner` | Guard exists; no `/cleaner` UI yet |
| [x] | Critical | Honor `redirectTo` on login | Email + OAuth callback validation |
| [ ] | High | Admin user management UI (promote cleaner/admin) | CLI promote exists |
| [x] | Moderate | Sync `AuthUser` type with `role` | |
| [ ] | Moderate | Loading / error / not-found boundaries | |

---

## 3. Profiles & addresses

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [x] | Critical | Editable profile (name, phone) | `/settings` |
| [~] | Critical | CRUD customer addresses | Booking creates one-off ON_SITE address in-tx |
| [ ] | High | Admin can edit any user profile | |
| [ ] | Moderate | Default address flag + “use last address” in booking | |
| [ ] | Low | Avatar upload to storage | |

---

## 4. Service catalog

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [ ] | Critical | Admin: manage categories & services UI | `/admin/services` |
| [x] | Critical | Customer browse active services | `/book` step 1 |
| [x] | Critical | Service fields: delivery modes, duration, base price, active | Seeded |
| [x] | Moderate | Disable booking for inactive services | `isActive` checked |
| [ ] | Low | Service images / icons per category | Icon heuristics exist |

---

## 5. Availability calendar (Admin)

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [x] | Critical | Admin calendar UI to create/edit slots | `/admin/calendar` |
| [x] | Critical | Slot fields + OPEN / FULL / BLOCKED paint | Delivery/capacity simplified in UI |
| [x] | Critical | Prevent unsafe edits with active bookings | |
| [x] | High | Block / unblock blackout times | |
| [x] | High | Hold FULL on book; reopen on cancel/reject | |
| [ ] | Moderate | Recurring slot templates | |
| [ ] | Moderate | Holiday / blackout date helper | |
| [~] | Low | Week view + paint create | Done; drag polish later |

---

## 6. Booking (Customer)

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [x] | Critical | Booking wizard | `/book` |
| [x] | Critical | Appointment items + details | |
| [x] | Critical | ON_SITE requires address; DROP_OFF does not | |
| [x] | Critical | Create `PENDING` + `UNPAID` + slot hold | Atomic transaction |
| [x] | Critical | Customer appointment list | `/appointments` |
| [x] | Critical | Customer cancel when `PENDING` or `APPROVED` | Reopens slot when free |
| [x] | High | Show estimated price | Confirm step |
| [x] | High | Notify admin(s) on new booking | |
| [ ] | Moderate | Booking confirmation page with timeline | Redirects to list today |
| [x] | Moderate | Prevent double-booking race | Row lock + active check |
| [ ] | Low | Save draft if auth expires mid-flow | |
| [ ] | Low | “Book again” from past appointment | |

---

## 7. Admin appointment operations

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [x] | Critical | Admin appointments inbox | Joined inbox query |
| [x] | Critical | Approve `PENDING` → `APPROVED` | Confirms delivery mode |
| [x] | Critical | Reject with required reason | Admin-only; frees slot |
| [ ] | Critical | Assign cleaner `APPROVED` → `ASSIGNED` | Schema ready |
| [ ] | High | Quote override before approve | |
| [ ] | High | Mark cash payment PAID | |
| [~] | High | Appointment detail in inbox | Master-detail UI |
| [ ] | Moderate | Bulk filters: date, cleaner, unpaid | |
| [ ] | Moderate | Reassign cleaner | |
| [ ] | Low | Printable day sheet | |

---

## 8. Cleaner job board

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [ ] | Critical | Cleaner dashboard: assigned jobs | `/cleaner` |
| [ ] | Critical | Start / complete job | |
| [ ] | High | Completion notes | |
| [ ] | High | Optional: mark cash collected | |
| [ ] | Moderate | Mobile-first cleaner UI | |
| [ ] | Future | Before/after photo upload | |

---

## 9. Messaging & email notifications

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [~] | High | Email/SMS provider integration | Facade + stubs |
| [x] | High | System notify: created, approved, rejected, cancelled, completed | |
| [x] | High | Persist `notifications` rows | |
| [ ] | High | Admin compose email to a user | |
| [ ] | Moderate | In-app messages UI | Table exists |
| [ ] | Moderate | Unread message badge | |
| [ ] | Low | Branded HTML templates | |
| [ ] | Future | SMS / WhatsApp reminders | |

---

## 10. Payments (cash only)

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [x] | Critical | Create UNPAID payment on booking | |
| [ ] | Critical | Admin UI to mark PAID + `paidAt` | |
| [ ] | Moderate | Manual refund status | |
| [ ] | Moderate | Unpaid filter / badge | |
| [ ] | Low | Cash report by day/week | |
| [x] | — | Card / Stripe | **Out of scope** |

---

## 11. UX / QoL

| Done | Priority | Task | Why |
| --- | --- | --- | --- |
| [x] | High | Empty states with clear CTAs | |
| [~] | High | Inline success & error feedback | Forms / alerts |
| [x] | High | Status badges + human-readable labels | |
| [x] | High | Responsive nav shells | Customer + admin |
| [ ] | Moderate | Appointment status timeline | |
| [x] | Moderate | Confirm dialogs for cancel / reject | |
| [ ] | Moderate | Skeleton loaders | |
| [ ] | Moderate | i18n-ready strings | |
| [ ] | Moderate | Accessibility pass | |
| [ ] | Moderate | Public tracking page | |
| [x] | Low | Dark branded theme | Master-Gold |
| [ ] | Low | Keyboard shortcuts on admin inbox | |
| [ ] | Low | Copy booking summary | |
| [ ] | Low | Onboarding checklist for first admin | |
| [ ] | Low | Favicon + OG meta | |

---

## 12. Quality, security, DevOps

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [x] | High | GitHub Actions CI (lint, typecheck, build) | |
| [ ] | Critical | Integration tests for appointment transitions | |
| [ ] | High | Tests for booking race / cancel frees slot | |
| [x] | High | Authorize actions server-side | Guards on mutations |
| [ ] | High | Rate-limit auth + booking | |
| [ ] | Moderate | Structured logging | |
| [ ] | Moderate | Staging env + seed data | |
| [x] | Moderate | README env / wipe / script docs | Updated |
| [ ] | Low | E2E smoke (Playwright) | |
| [ ] | Low | Error monitoring (Sentry) | |

---

## 13. Future (after solid single-shop MVP)

| Done | Priority | Task |
| --- | --- | --- |
| [ ] | Future | Before/after photos on completion |
| [x] | Future | Customer reviews/ratings | **Moved into MVP — shipped** |
| [ ] | Future | Recurring appointments |
| [ ] | Future | Service area / travel radius |
| [ ] | Future | No-show status + customer flag |
| [ ] | Future | Drop-off storage / tag inventory |
| [ ] | Future | Multi-tenant marketplace (`docs/uml-marketplace`) |
| [ ] | Future | Subdomains + per-shop themes |

---

## Suggested build order (MVP path)

1. ~~Schema + migrations + marketplace scaffold~~ ✅  
2. ~~Guards + route shells~~ ✅  
3. ~~Services + calendar UI~~ ✅ (admin catalog CRUD still open)  
4. ~~Booking wizard + notify~~ ✅  
5. ~~Admin approve / reject~~ ✅  
6. ~~Complete + reviews~~ ✅  
7. ~~Customer cancel~~ ✅  
8. **UX polish + tests + cash PAID UI** → near deployment  
9. **Future** — cleaner board, marketplace activation  

---

## Quick MVP definition of done

A demo is successful when:

1. Admin has services and open slots  
2. Customer books (ON_SITE or DROP_OFF)  
3. Admin receives email or SMS notification  
4. Admin approves; customer receives email or SMS  
5. Status moves to COMPLETED on the site  
6. Customer submits a review  

When that works, expand High/Moderate items, then consider marketplace activation (`resolveShopFromHost`).
