/**
 * Proves Edge middleware can load when Vercel Secrets use unprefixed names
 * and when DATABASE_URL is missing (must not throw at import time).
 */
import { readPublicSupabaseConfig } from "../src/lib/supabase/env-keys";

function main() {
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  process.env.SUPABASE_URL = "https://prod.supabase.co";
  process.env.SUPABASE_ANON_KEY = "anon-secret-name";

  const config = readPublicSupabaseConfig();
  if (config?.url !== "https://prod.supabase.co" || config.anonKey !== "anon-secret-name") {
    throw new Error(`expected unprefixed config, got ${JSON.stringify(config)}`);
  }

  return import("../src/lib/supabase/middleware").then(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    if (readPublicSupabaseConfig() !== null) {
      throw new Error("expected null when all supabase keys are missing");
    }
    return import("../src/lib/supabase/middleware");
  });
}

void main().then(() => {
  console.log("middleware loads with unprefixed Secrets and without DATABASE_URL");
});
