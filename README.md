# Cleaning App

Cleaning App is a **production-ready SaaS starter** built with Next.js, Supabase Auth, PostgreSQL, and Drizzle ORM.

It is designed for developers and teams who want a strong foundation for:
- customer portals
- internal dashboards
- admin tools
- authenticated web apps with role-aware data

## Stack and architecture

### Core stack

- **Framework:** Next.js (App Router) + React + TypeScript
- **Styling:** Tailwind CSS
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Database:** PostgreSQL
- **ORM & migrations:** Drizzle ORM + drizzle-kit
- **Validation:** Zod
- **Deployment target:** Vercel

### High-level architecture

- `src/app/*` provides App Router pages and auth callback routes.
- `src/actions/auth.ts` contains server actions for sign-in/sign-up/sign-out/reset-password and auth-to-DB syncing.
- `src/lib/supabase/*` defines browser/server/middleware Supabase clients.
- `src/middleware.ts` refreshes auth sessions and protects private routes.
- `src/db/*` contains Drizzle schema, DB client, queries, and migrations.

## Project structure

```text
.
├── src/
│   ├── app/                # Routes: /, /login, /register, /dashboard, /settings, /auth/callback
│   ├── actions/            # Server actions (auth + user/profile sync)
│   ├── components/         # UI and auth components
│   ├── db/                 # Drizzle schema, queries, migrations
│   ├── hooks/              # Client hooks (for example useUser)
│   ├── lib/supabase/       # Supabase clients for browser/server/middleware
│   ├── validators/         # Zod schemas
│   └── middleware.ts       # Route protection and session refresh
├── supabase/rls.sql        # Row Level Security policies
├── docker-compose.yml      # PostgreSQL for local development
├── docker-compose.full.yml # Next.js + PostgreSQL local stack
└── .github/workflows/ci.yml
```

## Local development setup

### 1) Prerequisites

- Node.js **22+**
- npm
- Docker Desktop (or Docker Engine)

### 2) Install dependencies

```bash
npm ci
```

### 3) Configure environment variables

```bash
cp .env.example .env.local
```

Set the required values in `.env.local`:

```env
DATABASE_URL=******localhost:5432/cleaning_app
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Optional (used by password reset redirect logic in `src/actions/auth.ts`):

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4) Start PostgreSQL with Docker

```bash
npm run docker:up
```

### 5) Run migrations

```bash
npm run db:migrate
```

### 6) Start the development server

```bash
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

## Supabase authentication setup

1. Create a Supabase project.
2. Copy project URL, anon key, and service role key into `.env.local`.
3. In **Supabase → Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:**
     - `http://localhost:3000/auth/callback`
     - `https://your-app.vercel.app/auth/callback` (production)

### Google OAuth setup

1. In Google Cloud Console, configure OAuth consent screen.
2. Create a **Web application** OAuth Client.
3. Add Supabase callback as an authorized redirect URI:

```text
https://<your-project-ref>.supabase.co/auth/v1/callback
```

4. In **Supabase → Authentication → Providers → Google**, enable Google and paste client ID/secret.

The app triggers Google login from `GoogleSignInButton` using `supabase.auth.signInWithOAuth(...)` and returns to `/auth/callback`.

## Route protection and key flows

### Route protection (`src/middleware.ts`)

- Protected routes: `/dashboard`, `/settings`
- Public routes: `/`, `/login`, `/register`, `/auth/*`
- Unauthenticated users hitting protected routes are redirected to `/login?redirectTo=...`.
- Authenticated users visiting `/`, `/login`, or `/register` are redirected to `/dashboard`.

### Key auth/data flows

- **Email sign-up/sign-in:** handled in `src/actions/auth.ts`.
- **OAuth callback:** `src/app/auth/callback/route.ts` exchanges auth code for session.
- **User/profile sync:** `syncUserFromAuth` / `syncUserRecord` keeps `users` and `profiles` aligned with Supabase Auth users.
- **Password reset:** sends reset email and returns to `/auth/callback?next=/settings`.

## Database schema and RLS expectations

Drizzle schema is defined in `src/db/schema.ts` and migrated via files in `src/db/migrations`.

### Tables

- `users`
  - `id` (uuid, matches Supabase Auth user id)
  - `email` (unique)
  - `name`
  - `role` (`USER` | `ADMIN`)
  - `created_at`, `updated_at`
- `profiles`
  - `id` (uuid)
  - `user_id` (unique FK → `users.id`, cascade delete)
  - `avatar`, `bio`

### Row Level Security (RLS)

Policies live in `supabase/rls.sql` and are expected to be applied after tables exist.

Current policies enforce user-owned access patterns (own-row select/update, own-profile insert/update/delete). Keep these policies in sync with any schema changes.

## Docker usage

### PostgreSQL only (recommended local setup)

```bash
npm run docker:up
npm run docker:down
```

### Full app + database

```bash
npm run docker:full
```

(or `docker compose -f docker-compose.full.yml up --build`)

## Vercel deployment

1. Push repository to GitHub.
2. Import into Vercel.
3. Set environment variables:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. In Supabase Auth URL configuration, add:
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/auth/callback`
5. Deploy.

Use managed Postgres (Supabase Postgres, Neon, Railway, etc.) for production `DATABASE_URL`.

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server (Turbopack) |
| `npm run build` | Build production app |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run docker:up` | Start PostgreSQL container |
| `npm run docker:down` | Stop PostgreSQL container |
| `npm run docker:full` | Run full Docker stack (app + db) |

## Security recommendations

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code.
- Keep RLS enabled for user-owned tables and review policies when schema changes.
- Use separate Supabase projects and secrets per environment.
- Rotate secrets regularly.
- Keep privileged operations in server actions/components.
- Validate inputs with shared Zod schemas.

## License

MIT
