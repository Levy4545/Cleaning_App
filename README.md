# Master-Gold Cleaning

Single-shop cleaning booking app built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS**, **Supabase Auth**, **PostgreSQL**, and **Drizzle ORM**.

Customers book hybrid on-site / drop-off jobs; admins manage a week calendar, approve or reject requests, complete jobs, and collect cash on site. Roles (`USER` / `ADMIN` / `CLEANER`) exist in the database for access control but are not shown as labels in the UI.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 (dark/gold “Master-Gold” theme) |
| Auth | Supabase (email/password + Google OAuth) |
| Database | PostgreSQL + Drizzle (production: same Supabase project as Auth; local: Docker) |
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

Also set Supabase keys in `.env.local` (`SUPABASE_URL` + `SUPABASE_ANON_KEY`, or the `NEXT_PUBLIC_*` aliases). Optional: `ADMIN_BOOTSTRAP_EMAIL`, `NOTIFY_CHANNEL`, Resend/Twilio keys. `DATABASE_URL` is the Postgres URI (local Docker or, in production, the same Supabase project’s **Transaction pooler** string).

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
| `npm run db:prepare` | Migrate + seed default shop (runs automatically on Vercel builds) |
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

Production uses **one Supabase project**: Auth (URL + anon key) and app data (Postgres URI from that same project). You do not need a second database host.

### Vercel environment variables

**Project → Settings → Environment Variables** — Production and Preview, available at **Build Time**. Redeploy after saving.

Use **Secret** for all three. **Do not** name the Supabase keys `NEXT_PUBLIC_*` if the type is Secret — Vercel shows *“Remove the public framework prefix… If that’s safe, change the variable to Config.”*

| Variable | Type | Where to copy it |
| --- | --- | --- |
| `SUPABASE_URL` | Secret | Settings → API Keys → Project URL (`https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Secret | Settings → API Keys → `anon` / publishable key |
| `DATABASE_URL` | Secret | **Connect** (green button) → **Transaction pooler** URI. Replace `[YOUR-PASSWORD]` with the **database password** from Settings → Database. Not the service_role key. Port should be **6543**. |

The anon key is still sent to the browser (required for login). Unprefixed names only satisfy Vercel’s Secret UI. Never put the **database password** or **service_role** key in `SUPABASE_ANON_KEY`.

If you already created `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, either:

- delete them and re-add as `SUPABASE_URL` / `SUPABASE_ANON_KEY` (Secret), or
- keep those names and switch the type to **Config** (not Secret).

`POSTGRES_URL` is accepted as an alias of `DATABASE_URL`. Passwords with `@`, `#`, or `%` are encoded automatically.

Optional: `GMAIL_USER` + `GMAIL_APP_PASSWORD` (or `RESEND_API_KEY` + `NOTIFICATION_EMAIL_FROM`) for booking emails. `ADMIN_BOOTSTRAP_EMAIL` promotes that user to admin on first login — leave unset after you have a real admin.

`SUPABASE_SERVICE_ROLE_KEY` is optional (the app does not use it today).

### What the deploy does

`npm run build` on Vercel runs migrations and creates the default shop + sample catalog if they are missing. Then it builds Next.js.

Also:

1. **Google login** — in the production Supabase project:
   - Authentication → Sign In / Providers → **Google**: enable it and paste the Google Cloud **Web application** client ID and secret.
   - Google Cloud authorized redirect URI must be exactly `https://<project-ref>.supabase.co/auth/v1/callback` (shown on that Supabase screen).
   - Authentication → URL Configuration:
     - Site URL: `https://your-app.vercel.app`
     - Redirect URLs: `https://your-app.vercel.app/auth/callback` and `https://your-app.vercel.app/**`
   - If the button stays on “Redirecting…” and never leaves the page, Google is not enabled or this domain is missing from Redirect URLs. Email/password login still works.
2. After the first login, promote an admin if you did not set `ADMIN_BOOTSTRAP_EMAIL`: `npm run db:promote-admin -- you@example.com` with production `DATABASE_URL`.
3. Never run `db:wipe --yes` against production without `--allow-remote` and a conscious decision.
4. If logs say `password authentication failed for user "postgres"`, `DATABASE_URL` still has the wrong database password (or the local `postgres:postgres` default).

## License

MIT
