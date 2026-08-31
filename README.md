# Master-Gold Cleaning

Single-shop cleaning booking app built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS**, **Supabase Auth**, **PostgreSQL**, and **Drizzle ORM**.

Customers book hybrid on-site / drop-off jobs; admins manage a week calendar, approve or reject requests, complete jobs, and collect cash on site. Roles (`USER` / `ADMIN` / `CLEANER`) exist in the database for access control but are not shown as labels in the UI.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 (dark/gold “Master-Gold” theme) |
| Auth | Supabase (email/password + Google OAuth) |
| Database | PostgreSQL + Drizzle ORM migrations |
| Validation | Zod |
| Notifications | Resend / Twilio (or console stubs) |
| Local DB | Docker Compose |
| CI | GitHub Actions |

## What’s built (MVP)

```text
Client books
  → Admin notified (email and/or SMS)
  → Admin approves (confirms delivery mode) → Client notified
  → Admin marks completed → Client can review
```

- **Customer:** `/book` 4-step wizard, `/appointments` (filter + cancel pending/approved + review), `/settings` profile/phone
- **Admin:** `/admin`, `/admin/calendar` paint-style week slots, `/admin/appointments` master-detail inbox, `/admin/services` catalog CRUD
- **Concurrency:** booking locks the slot (`FOR UPDATE`) and rejects races; cancel/reject can reopen the window
- **Dev helpers:** `db:seed`, `db:promote-admin`, `db:wipe` (localhost-only unless `--allow-remote`)

Marketplace tables (`shops`, `shop_members`, `shopId`) are scaffolded for later; the app runs as one default shop today.

## Project structure

```text
src/
├── app/              # Routes: /, /book, /appointments, /admin/*, /auth/*
├── components/       # UI + booking / admin / layout
├── lib/              # Auth guards, tenancy, notifications, formatters
├── actions/          # Server actions (auth, booking, availability)
├── db/               # Schema (tables/relations), queries, migrations
├── validators/       # Zod schemas
└── middleware.ts     # Session refresh + protected routes
scripts/              # seed, promote-admin, wipe
supabase/rls.sql      # RLS policies for Supabase client access
```

## Quick start

```bash
npm install
cp .env.example .env.local
npm run docker:up
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Default local DB:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cleaning_app
```

Also set Supabase keys in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Optional: `ADMIN_BOOTSTRAP_EMAIL`, `NOTIFY_CHANNEL`, Resend/Twilio keys.

Promote an admin after first login:

```bash
npm run db:promote-admin -- you@example.com
```

## Routes

| Path | Who | Purpose |
| --- | --- | --- |
| `/` | Public | Landing |
| `/login`, `/register` | Public | Auth (`redirectTo` honored after email login / OAuth) |
| `/dashboard`, `/book`, `/appointments`, `/settings` | Signed-in | Customer flows |
| `/admin`, `/admin/calendar`, `/admin/appointments`, `/admin/services` | Admin | Ops + catalog |

Middleware protects `/dashboard`, `/settings`, `/book`, `/appointments`, and `/admin/*`.

## Database domain

Schema lives in `src/db/schema/` (`tables.ts`, `relations.ts`).

Core tables: `shops`, `users`, `profiles`, `shop_members`, `addresses`, `service_categories`, `services`, `availability_slots`, `appointments`, `appointment_items`, `payments`, `job_logs`, `messages`, `notifications`, `reviews`.

Apply Supabase RLS after migrations:

```bash
# paste / run supabase/rls.sql in the Supabase SQL editor
```

App mutations use Drizzle over `DATABASE_URL`; RLS covers direct Supabase client access.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `start` | Production |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Generate migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Default shop + sample catalog |
| `npm run db:promote-admin` | Promote user by email |
| `npm run db:wipe` | Parameterized local data wipe (dry-run by default) |
| `npm run docker:up` / `down` | Postgres container |

Wipe examples:

```bash
npm run db:wipe -- appointments availability
npm run db:wipe -- appointments availability --yes
npm run db:wipe -- all --keep-admins --yes
```

## Deploy notes

Vercel runs `next build`, which loads `src/env.ts` and **fails immediately** if required vars are missing. Add them in **Project → Settings → Environment Variables** for Production and Preview, and leave them available at **Build Time**. Redeploy after saving.

Required:

| Variable | Example |
| --- | --- |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/cleaning_app?sslmode=require` (app Postgres, **not** the Supabase Auth DB) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project API anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (server only) |

Optional: `GMAIL_USER` + `GMAIL_APP_PASSWORD` (or `RESEND_API_KEY` + `NOTIFICATION_EMAIL_FROM`) for booking emails. Leave `ADMIN_BOOTSTRAP_EMAIL` unset after the first admin exists.

Also:

1. In the production Supabase project, set Site URL and redirect URLs to the Vercel domain (and `/auth/callback` if you use Google).
2. Run migrations against production `DATABASE_URL` (`npm run db:migrate` with that URL).
3. Seed the catalog and promote an admin once (`npm run db:seed`, `npm run db:promote-admin -- you@example.com`).
4. Never run `db:wipe --yes` against production without `--allow-remote` and a conscious decision.

## License

MIT
