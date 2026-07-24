# Cleaning App

Production-ready SaaS starter built with **Next.js 15**, **React 19**, **TypeScript**, **Tailwind CSS**, **Supabase Auth**, **PostgreSQL**, and **Drizzle ORM**.

Suitable for SaaS apps, dashboards, internal tools, admin panels, and customer portals.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Auth | Supabase (email/password + Google OAuth) |
| Database | PostgreSQL |
| ORM | Drizzle ORM + migrations |
| Validation | Zod |
| Local DB | Docker Compose |
| Deployment | Vercel |
| CI | GitHub Actions |

## Project structure

```text
src/
├── app/           # App Router pages, layouts, and route handlers
├── components/    # Reusable UI and feature components
├── lib/           # Shared utilities and Supabase clients
├── actions/       # Server Actions (mutations, auth flows)
├── hooks/         # Client-side React hooks
├── db/            # Drizzle schema, client, and migrations
├── types/         # Shared TypeScript types
├── validators/    # Zod schemas for input validation
└── middleware.ts  # Route protection and session refresh
```

### Folder purposes

- **`app/`** — Routes, layouts, and API/callback handlers (`/login`, `/dashboard`, `/auth/callback`).
- **`components/`** — Presentational and interactive UI split by domain (`auth/`, `layout/`, `ui/`).
- **`lib/`** — Framework integrations (Supabase browser/server clients, helpers).
- **`actions/`** — Server-side mutations callable from forms and components.
- **`hooks/`** — Client hooks such as `useUser` for live auth state.
- **`db/`** — Database schema, connection, and SQL migrations.
- **`types/`** — App-wide TypeScript interfaces and result types.
- **`validators/`** — Zod schemas keeping server/client validation in sync.

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

```env
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 3. Start PostgreSQL (Docker)

```bash
npm run docker:up
```

This starts PostgreSQL 17 on port `5432` with a persistent volume.

Default connection string:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cleaning_app
```

### 4. Run migrations

```bash
npm run db:migrate
```

Other database commands:

```bash
npm run db:generate   # Generate migrations from schema changes
npm run db:studio     # Open Drizzle Studio
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **Project URL** and **anon key** into `.env.local`.
3. Copy **service role key** (server-only) into `.env.local`.
4. Enable auth providers:
   - **Email** — enabled by default
   - **Google** — see below

### Auth callback URL

In Supabase → Authentication → URL Configuration, add:

```text
http://localhost:3000/auth/callback
```

For production, also add:

```text
https://your-app.vercel.app/auth/callback
```

## Google OAuth setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com).
2. Configure the **OAuth consent screen** (External or Internal).
3. Create **OAuth 2.0 Client ID** credentials (Web application).
4. Add authorized redirect URI from Supabase:

   ```text
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

5. In Supabase → Authentication → Providers → Google:
   - Enable Google
   - Paste **Client ID** and **Client Secret**

The app uses:

```ts
supabase.auth.signInWithOAuth({ provider: "google" })
```

via the **Continue with Google** button on login/register pages.

## Route protection

Protected routes:

- `/dashboard`
- `/settings`

Public routes:

- `/`
- `/login`
- `/register`
- `/auth/callback`

Middleware in `src/middleware.ts` refreshes Supabase sessions and redirects unauthenticated users to `/login`.

## Database schema

### `users`

| Column | Type |
| --- | --- |
| id | uuid (matches Supabase Auth user id) |
| email | text |
| name | text |
| createdAt | timestamp |
| updatedAt | timestamp |

### `profiles`

| Column | Type |
| --- | --- |
| id | uuid |
| userId | uuid → users.id |
| avatar | text |
| bio | text |

Relations are defined in `src/db/schema.ts`.

## Row Level Security

SQL policies are provided in `supabase/rls.sql`. Apply them in the Supabase SQL editor after migrations so users can only access their own records when using Supabase client queries.

## Docker

### PostgreSQL only (recommended for local dev)

```bash
docker compose up -d
```

### Full stack (Next.js + PostgreSQL)

```bash
npm run docker:full
```

Or:

```bash
docker compose -f docker-compose.full.yml up --build
```

The app container expects env vars from your shell or a `.env` file.

## Vercel deployment

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set environment variables:

   ```env
   DATABASE_URL
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```

4. In Supabase URL configuration, add:

   ```text
   https://your-app.vercel.app
   https://your-app.vercel.app/auth/callback
   ```

5. Deploy.

Use a managed PostgreSQL provider (Supabase Postgres, Neon, Railway, etc.) for `DATABASE_URL` in production.

## CI/CD

GitHub Actions workflow at `.github/workflows/ci.yml` runs on push/PR:

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run docker:up` | Start PostgreSQL |
| `npm run docker:down` | Stop PostgreSQL |

## Security recommendations

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
- Enable RLS on all user-owned tables (`supabase/rls.sql`).
- Use server components and server actions for privileged operations.
- Validate all inputs with Zod (`src/validators/`).
- Environment variables are validated at build/runtime via `src/env.ts`.
- Rotate secrets regularly and use separate Supabase projects per environment.

## Production best practices

- Use separate `.env` files for development, staging, and production.
- Run `npm run db:generate` whenever the Drizzle schema changes.
- Sync Supabase auth users to your `users` table on sign-up/OAuth callback.
- Monitor Vercel and Supabase dashboards for errors and auth anomalies.
- Enable email confirmation in Supabase for production if required by your use case.

## License

MIT
