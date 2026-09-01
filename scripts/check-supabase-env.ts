import {
  applySupabasePublicEnv,
  isLocalSupabaseUrl,
  readPublicSupabaseConfig,
  readSupabaseAnonKey,
  readSupabaseUrl,
} from "../src/lib/supabase/env-keys";

function assert(cond: unknown, message: string) {
  if (!cond) throw new Error(message);
}

assert(
  readSupabaseUrl({ SUPABASE_URL: "https://abc.supabase.co" }) === "https://abc.supabase.co",
  "reads unprefixed SUPABASE_URL",
);

assert(
  readSupabaseUrl({ NEXT_PUBLIC_SUPABASE_URL: "https://legacy.supabase.co" }) ===
    "https://legacy.supabase.co",
  "reads NEXT_PUBLIC_SUPABASE_URL alias",
);

assert(
  readSupabaseUrl({
    SUPABASE_URL: "https://secret.supabase.co",
    NEXT_PUBLIC_SUPABASE_URL: "https://public.supabase.co",
  }) === "https://secret.supabase.co",
  "unprefixed Secret wins over NEXT_PUBLIC_ alias",
);

assert(
  readSupabaseAnonKey({ SUPABASE_ANON_KEY: "  sb_anon  " }) === "sb_anon",
  "trims unprefixed anon key",
);

assert(
  readPublicSupabaseConfig({
    SUPABASE_URL: "https://abc.supabase.co",
    SUPABASE_ANON_KEY: "anon",
  })?.url === "https://abc.supabase.co",
  "config from Vercel Secret names",
);

assert(
  readPublicSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  })?.anonKey === "anon",
  "config from NEXT_PUBLIC aliases",
);

assert(readPublicSupabaseConfig({}) === null, "missing keys → null (no throw)");

assert(readPublicSupabaseConfig({ SUPABASE_URL: "not-a-url", SUPABASE_ANON_KEY: "x" }) === null, "invalid URL → null");

const env: NodeJS.Dict<string | undefined> = {
  SUPABASE_URL: "https://from-secret.supabase.co",
  SUPABASE_ANON_KEY: "anon-from-secret",
};
const applied = applySupabasePublicEnv(env);
assert(applied.url === "https://from-secret.supabase.co", "apply returns url");
assert(env.NEXT_PUBLIC_SUPABASE_URL === "https://from-secret.supabase.co", "copies URL onto NEXT_PUBLIC_");
assert(env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "anon-from-secret", "copies anon key onto NEXT_PUBLIC_");

assert(isLocalSupabaseUrl("http://127.0.0.1:54321"), "local 127.0.0.1");
assert(isLocalSupabaseUrl("http://localhost:54321"), "local localhost");
assert(!isLocalSupabaseUrl("https://abcd.supabase.co"), "hosted is not local");

console.log("supabase env alias checks passed");
