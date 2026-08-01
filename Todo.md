# Cleaning App — Development Todo

Derived from [`docs/uml/`](./docs/uml/) (single-shop design).  
Marketplace multi-tenant work lives in [`docs/uml-marketplace/`](./docs/uml-marketplace/). Lightweight scaffolds (`shops`, `shopId`, `shop_members`, theme JSON) are already in the schema so future adaptation is easier — **no multi-tenant UI yet**.

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

## 0. Foundation (current starter)

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [x] | Critical | Next.js App Router + TypeScript + Tailwind | Starter |
| [x] | Critical | Supabase auth (email + Google OAuth callback) | Login/register/sign-out |
| [x] | Critical | Middleware route protection | `/dashboard`, `/settings` |
| [x] | Critical | Env validation (`src/env.ts`) | Zod + optional notify keys |
| [x] | Critical | Drizzle + Postgres Docker + migrations baseline | `users`, `profiles` |
| [x] | Critical | Roles: `USER` / `ADMIN` / `CLEANER` | Enum + `requireCleaner` |
| [x] | Critical | Marketplace scaffold (silent) | `shops`, `shop_members`, `shopId` on business tables, `getDefaultShop()` |
| [x] | Critical | Notification facade (email/SMS stub + Resend/Twilio) | Console stub when unset |
| [x] | Critical | Reviews table + query helpers | For post-complete reviews |
| [~] | Critical | Auth guards wired into admin/cleaner pages | Guards exist; routes next |
| [ ] | High | Apply RLS policies in DB | Extend `supabase/rls.sql` |
| [ ] | Moderate | Align `eslint-config-next` with Next major | Hygiene |
| [ ] | Low | Remove unused deps (e.g. accidental packages) | Code hygiene |

---

## 1. Domain schema & data layer

Source: [`docs/uml/02-class-diagram.md`](./docs/uml/02-class-diagram.md)

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [x] | Critical | Extend `user_role` enum with `CLEANER`; add `phone` on `users` | Done |
| [x] | Critical | Add `preferredLanguage` on `profiles` | Done |
| [x] | Critical | Create `addresses` table | + `shopId` scaffold |
| [x] | Critical | Create `service_categories` + `services` | Seeded samples |
| [x] | Critical | Create domain enums | Delivery, items, appointment, payment, slot, notify |
| [x] | Critical | Create `availability_slots` | + capacity / bookedCount |
| [x] | Critical | Create `appointments` + `appointment_items` | |
| [x] | Critical | Create `payments` (CASH only) | |
| [x] | High | Create `job_logs` | |
| [x] | High | Create `messages` | |
| [x] | High | Create `notifications` | EMAIL / SMS / IN_APP |
| [x] | Critical | Create `reviews` | MVP end-state |
| [x] | Critical | Marketplace tables `shops` + `shop_members` | Silent scaffold |
| [x] | Critical | Migrations + seed (`npm run db:seed`) | Default shop + catalog |
| [x] | Critical | Query helpers + booking/transition helpers | `src/db/queries/*` |
| [x] | High | Appointment status transition helper | Allows APPROVED→COMPLETED for MVP |
| [x] | Moderate | Seed script: sample services | Done |

---

## 2. Authorization & routing

Source: [`docs/uml/01-use-cases.md`](./docs/uml/01-use-cases.md), [`05-components.md`](./docs/uml/05-components.md)

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [ ] | Critical | Role-based redirects after login | USER → dashboard; ADMIN → `/admin`; CLEANER → `/cleaner` |
| [ ] | Critical | Protect `/admin/*` with `requireAdmin` | Middleware + server guards |
| [ ] | Critical | Protect `/cleaner/*` with `requireCleaner` | Middleware + server guards |
| [ ] | Critical | Honor `redirectTo` on login | Currently ignored (always `/dashboard`) |
| [ ] | High | Admin user management UI (promote cleaner/admin) | Edit roles safely |
| [ ] | Moderate | Sync `AuthUser` type with `role` | Type hygiene |
| [ ] | Moderate | Loading / error / not-found boundaries | App Router UX |

---

## 3. Profiles & addresses

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [ ] | Critical | Editable profile (name, phone, avatar, bio) | Customer/Admin/Cleaner own profile |
| [ ] | Critical | CRUD customer addresses | Required for ON_SITE bookings |
| [ ] | High | Admin can edit any user profile | Use case `EditUserProfiles` |
| [ ] | Moderate | Default address flag + “use last address” in booking | QoL |
| [ ] | Low | Avatar upload to storage (Supabase Storage) | Else URL-only is fine for MVP |

---

## 4. Service catalog

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [ ] | Critical | Admin: manage categories & services | `/admin/services` |
| [ ] | Critical | Public/customer browse active services | `/book` step 1 or `/services` |
| [ ] | Critical | Service fields: delivery modes, duration, base price, active flag | UML Service |
| [ ] | Moderate | Disable booking for inactive services | Soft delete pattern |
| [ ] | Low | Service images / icons per category | UX polish |

---

## 5. Availability calendar (Admin)

Source: [`docs/uml/03-sequences.md`](./docs/uml/03-sequences.md) — calendar sequence

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [ ] | Critical | Admin calendar UI to create/edit slots | `/admin/calendar` |
| [ ] | Critical | Slot fields: start/end, delivery mode, capacity, status | OPEN / FULL / BLOCKED |
| [ ] | Critical | Prevent unsafe edits on slots with active bookings | Sequence rule |
| [ ] | High | Block / unblock blackout times | SlotStatus BLOCKED |
| [ ] | High | Auto mark FULL when capacity reached; reopen on cancel | System behavior |
| [ ] | Moderate | Recurring slot templates (e.g. Mon–Fri 9–17) | Admin QoL |
| [ ] | Moderate | Holiday / blackout date helper | Backlog item 15 |
| [ ] | Low | Calendar week/month views + drag to create | UX |

---

## 6. Booking (Customer)

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [ ] | Critical | Booking wizard: service → items → mode → address/slot | `/book` |
| [ ] | Critical | Appointment items: CAR / CARPET / CHAIR / COUCH / OTHER + details JSON | Item-specific forms |
| [ ] | Critical | Enforce ON_SITE requires address; DROP_OFF does not | Delivery rules |
| [ ] | Critical | Create appointment `PENDING` + payment `UNPAID` + capacity update | Atomic transaction |
| [ ] | Critical | Customer appointment list + detail | `/appointments` |
| [ ] | Critical | Customer cancel when `PENDING` or `APPROVED` | Status machine |
| [ ] | High | Show estimated price from service basePrice × items | Before confirm |
| [ ] | High | Email admin(s) on new booking | Notification + log |
| [ ] | Moderate | Booking confirmation page with status timeline | UX |
| [ ] | Moderate | Prevent double-booking race (row lock / capacity check) | Reliability |
| [ ] | Low | Save draft booking in local state if auth expires mid-flow | QoL |
| [ ] | Low | “Book again” from past appointment | QoL |

---

## 7. Admin appointment operations

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [ ] | Critical | Admin appointments inbox (filter by status) | `/admin/appointments` |
| [ ] | Critical | Approve `PENDING` → `APPROVED` | + JobLog + email |
| [ ] | Critical | Reject / cancel with reason | Free slot capacity |
| [ ] | Critical | Assign cleaner `APPROVED` → `ASSIGNED` | Validate cleaner role |
| [ ] | High | Quote override (adjust payment amount before approve) | Backlog item 12 — High for real shops |
| [ ] | High | Mark cash payment PAID | Admin (cleaner optional) |
| [ ] | High | Appointment detail with items, address, logs, messages | Ops hub |
| [ ] | Moderate | Bulk filters: date, cleaner, unpaid, delivery mode | Ops QoL |
| [ ] | Moderate | Reassign cleaner | Common ops need |
| [ ] | Low | Printable day sheet / PDF for shop | Ops QoL |

---

## 8. Cleaner job board

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [ ] | Critical | Cleaner dashboard: assigned jobs | `/cleaner` |
| [ ] | Critical | Start job → `IN_PROGRESS` | Guard: assigned cleaner only |
| [ ] | Critical | Complete job → `COMPLETED` | + email customer |
| [ ] | High | Cleaner can add completion notes | UML recommendation |
| [ ] | High | Optional: cleaner mark cash collected | If policy allows |
| [ ] | Moderate | Mobile-first cleaner UI | Field use |
| [ ] | Future | Before/after photo upload | Backlog item 8 |

---

## 9. Messaging & email notifications

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [ ] | High | Email provider integration (Resend/SMTP) | `src/lib/email` |
| [ ] | High | System emails: booking created, approved, cancelled, completed | From sequences |
| [ ] | High | Persist `notifications` rows (SENT/FAILED) | Audit |
| [ ] | High | Admin compose email to a user | Use case `SendEmailNotification` |
| [ ] | Moderate | In-app messages (optionally tied to appointment) | `/messages` or admin panel |
| [ ] | Moderate | Unread message badge in header | UX |
| [ ] | Low | Email templates (branded HTML) | Polish |
| [ ] | Future | SMS / WhatsApp reminders | Backlog item 14 |

---

## 10. Payments (cash only)

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [ ] | Critical | Create UNPAID payment on booking | No card gateway |
| [ ] | Critical | Admin UI to mark PAID + `paidAt` | |
| [ ] | Moderate | Manual refund status `REFUNDED_MANUAL` | Rare correction |
| [ ] | Moderate | Unpaid filter / badge on admin lists | Ops QoL |
| [ ] | Low | Simple cash report by day/week | Ops QoL |
| [x] | — | Card / Stripe | **Out of scope** per UML |

---

## 11. UX / QoL proposals (not all in UML)

| Done | Priority | Task | Why |
| --- | --- | --- | --- |
| [ ] | High | Empty states with clear CTAs | “No appointments yet — Book now” |
| [ ] | High | Toast / inline success & error feedback on all actions | Trust |
| [ ] | High | Status badges + human-readable labels | PENDING ≠ jargon for customers |
| [ ] | High | Responsive nav: customer / admin / cleaner shells | Role clarity |
| [ ] | Moderate | Appointment status timeline component | Reduces “what’s next?” support |
| [ ] | Moderate | Confirm dialogs for cancel / reject / mark paid | Prevent mistakes |
| [ ] | Moderate | Skeleton loaders on lists | Perceived performance |
| [ ] | Moderate | i18n-ready strings (even if English-only first) | Profile has preferredLanguage |
| [ ] | Moderate | Accessibility: focus states, labels, contrast | Baseline quality |
| [ ] | Moderate | Public tracking page (token link, no login) | Share status with family |
| [ ] | Low | Dark mode toggle | Preference |
| [ ] | Low | Keyboard shortcuts on admin inbox | Power users |
| [ ] | Low | “Copy booking summary” to clipboard | Phone/WhatsApp handoff |
| [ ] | Low | Onboarding checklist for first admin setup | Services → slots → test book |
| [ ] | Low | Favicon + OG meta + basic SEO for landing | Marketing |

---

## 12. Quality, security, DevOps

| Done | Priority | Task | Notes |
| --- | --- | --- | --- |
| [x] | High | GitHub Actions CI (lint, typecheck, build) | Exists |
| [ ] | Critical | Integration tests for appointment state transitions | Prevent illegal jumps |
| [ ] | High | Tests for booking capacity race / cancel frees slot | Critical path |
| [ ] | High | Authorize every action server-side (never UI-only) | IDOR protection |
| [ ] | High | Rate-limit auth + booking endpoints (middleware/edge) | Abuse |
| [ ] | Moderate | Structured logging for JobLog + failed emails | Ops |
| [ ] | Moderate | Staging env + seed data | Deploy QoL |
| [ ] | Moderate | Vercel env checklist in README | Already partially documented |
| [ ] | Low | E2E smoke (Playwright): register → book → approve | Confidence |
| [ ] | Low | Error monitoring (Sentry) | Production |

---

## 13. Future (after solid single-shop MVP)

From UML backlog + marketplace package — **do not start until MVP works**.

| Done | Priority | Task |
| --- | --- | --- |
| [ ] | Future | Before/after photos on completion |
| [ ] | Future | Customer reviews/ratings |
| [ ] | Future | Recurring appointments |
| [ ] | Future | Service area / travel radius |
| [ ] | Future | No-show status + customer flag |
| [ ] | Future | Drop-off storage / tag inventory |
| [ ] | Future | Multi-tenant marketplace (`docs/uml-marketplace`) |
| [ ] | Future | Subdomains + per-shop themes |

---

## Suggested build order (MVP path)

1. ~~**Schema + migrations + marketplace scaffold**~~ ✅  
2. **Guards + route shells** — `/admin`, role redirects, promote an admin user  
3. **Services + calendar UI** — admin defines what & when  
4. **Booking wizard** — customer creates PENDING + notify admin (email/SMS)  
5. **Admin approve** — APPROVED + notify client (email/SMS)  
6. **Complete service** — status → COMPLETED on site + client visibility  
7. **Reviews** — client rates completed job  
8. **UX polish + tests** → near deployment  
9. **Future** — cleaner board, cash reports, marketplace activation  

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
