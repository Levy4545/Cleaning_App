/**
 * Supabase project URL + anon (publishable) key.
 *
 * Vercel Secrets cannot be named `NEXT_PUBLIC_*` (dashboard error:
 * "Remove the public framework prefix... If that's safe, change the variable to Config").
 * Production therefore uses unprefixed names. Local `.env.local` may still use NEXT_PUBLIC_*.
 *
 * The anon key is designed to be public (row-level security). It is still sent to the
 * browser after build — the unprefixed name only satisfies Vercel's Secret UI.
 */

function firstNonEmpty(
  env: NodeJS.Dict<string | undefined>,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

/** Prefer unprefixed Vercel Secret names, then the Next.js public aliases. */
export const SUPABASE_URL_KEYS = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"] as const;
export const SUPABASE_ANON_KEY_KEYS = [
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export function readSupabaseUrl(
  env: NodeJS.Dict<string | undefined> = process.env,
): string | undefined {
  return firstNonEmpty(env, SUPABASE_URL_KEYS);
}

export function readSupabaseAnonKey(
  env: NodeJS.Dict<string | undefined> = process.env,
): string | undefined {
  return firstNonEmpty(env, SUPABASE_ANON_KEY_KEYS);
}

export type PublicSupabaseConfig = { url: string; anonKey: string };

export function readPublicSupabaseConfig(
  env: NodeJS.Dict<string | undefined> = process.env,
): PublicSupabaseConfig | null {
  const url = readSupabaseUrl(env);
  const anonKey = readSupabaseAnonKey(env);
  if (!url || !anonKey) return null;
  try {
    new URL(url);
  } catch {
    return null;
  }
  return { url, anonKey };
}

/**
 * Copy unprefixed Secrets onto `NEXT_PUBLIC_*` so Next can inline them for the browser client.
 * Call from `next.config.ts` during build / `next dev`.
 */
export function applySupabasePublicEnv(
  env: NodeJS.Dict<string | undefined> = process.env,
): {
  url: string | undefined;
  anonKey: string | undefined;
} {
  const url = readSupabaseUrl(env);
  const anonKey = readSupabaseAnonKey(env);
  if (url) {
    env.SUPABASE_URL = url;
    env.NEXT_PUBLIC_SUPABASE_URL = url;
  }
  if (anonKey) {
    env.SUPABASE_ANON_KEY = anonKey;
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY = anonKey;
  }
  return { url, anonKey };
}

export function requirePublicSupabaseConfig(
  env: NodeJS.Dict<string | undefined> = process.env,
): PublicSupabaseConfig {
  const config = readPublicSupabaseConfig(env);
  if (!config) {
    throw new Error(
      "Missing Supabase URL or anon key. On Vercel add SUPABASE_URL and SUPABASE_ANON_KEY as Secrets (no NEXT_PUBLIC_ prefix). Locally, NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY still work.",
    );
  }
  return config;
}

export function isLocalSupabaseUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}
