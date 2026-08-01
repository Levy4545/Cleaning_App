# AGENTS.md

## Cursor Cloud specific instructions

Single Next.js app ("Master-Gold Cleaning", package `cleaning-app`). Standard scripts live in `package.json` and setup is in `README.md` — read those first; this section only covers non-obvious, durable caveats for running it in the Cursor Cloud VM.

### Service architecture (important)

Two independent databases:

- **App Postgres** — application data via Drizzle ORM. Runs as a Docker container (`docker compose up -d`, port `5432`). Connection: `postgresql://postgres:postgres@localhost:5432/cleaning_app`.
- **Local Supabase stack** — used **only for Auth** (login/register). Runs via the Supabase CLI (`supabase start`), API at `http://127.0.0.1:54321`. This is a separate Postgres from the app data; do not point `DATABASE_URL` at it.

### Startup sequence for a fresh VM session

The update script only runs `npm install`. Everything below must be started manually each session (the VM has no `systemd`, so services do not auto-start):

1. Start the Docker daemon in the background: `sudo dockerd` (run it in a tmux session or with `&`). `/etc/docker/daemon.json` is already configured for `fuse-overlayfs` with the containerd snapshotter disabled (required for Docker on this VM). The `ubuntu` user is in the `docker` group, so a fresh login shell can run `docker` without `sudo`; if your shell predates that (permission denied on `/var/run/docker.sock`), use `sudo docker ...` or `sg docker -c '...'`.
2. Start app Postgres: `npm run docker:up` (i.e. `docker compose up -d`).
3. Start local Supabase auth: from the repo root run `supabase start`. If `supabase/config.toml` is missing (it is git-ignored, not committed), run `printf 'n\nn\n' | supabase init` first. Grab the keys with `supabase status` (or from the `start` output): you need `API URL`, `anon key`, `service_role key`.
4. Ensure `.env.local` exists (it is git-ignored, so recreate it if absent). Required values:
   - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cleaning_app`
   - `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>`
   - `SUPABASE_SERVICE_ROLE_KEY=<supabase service_role key>`
   - `ADMIN_BOOTSTRAP_EMAIL=admin@example.com` (optional; see below)
5. Apply schema + seed catalog: `npm run db:migrate` then `npm run db:seed`.
6. Run the app: `npm run dev` (Turbopack, http://localhost:3000).

### Auth / roles notes

- Local Supabase has email confirmations **disabled**, so `register` immediately creates an active session (no inbox step). `site_url` is `127.0.0.1:3000` but the app is served on `localhost:3000`; both work for email/password auth.
- The email in `ADMIN_BOOTSTRAP_EMAIL` is auto-promoted to `ADMIN` on register/login. Otherwise promote after first login with `npm run db:promote-admin -- <email>`.

### Lint / test / build caveats

- `npm run typecheck` and `npm run build` in CI set `SKIP_ENV_VALIDATION=true`; do the same locally when a full `.env.local` is not present.
- Running `supabase start` creates a generated `supabase/.temp/` tree that is **not** in the ESLint ignore list, so `npm run lint` will report hundreds of errors from a minified `supabase/.temp/.../index.ts`. Those are not repo issues (CI has no Supabase temp dir). To lint only the app code, run `npx eslint . --ignore-pattern "supabase/**"`, or lint before starting Supabase.
- There is no automated test suite in this repo.

### Known pre-existing bug (not an environment issue)

`/admin/calendar` (`src/components/admin/week-calendar.tsx`) uses `useSyncExternalStore` with `getSnapshot: () => Date.now()`, which returns a new value every render and triggers a "Maximum update depth exceeded" infinite re-render. The rest of the app (customer booking flow and the `/admin/appointments` inbox, which is where you approve/reject/complete) works fine. Create availability slots via the DB or the `createAvailabilitySlot` server action rather than relying on the calendar UI.
