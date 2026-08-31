"use client";

import { setBrowserSupabaseConfig } from "./browser-config";
import type { PublicSupabaseConfig } from "./env-keys";

/**
 * Pushes server-read SUPABASE_URL / SUPABASE_ANON_KEY into the browser client.
 * Vercel runtime Secrets are not inlined unless they were present at build time.
 */
export function SupabaseBrowserConfig(config: PublicSupabaseConfig) {
  setBrowserSupabaseConfig(config);
  return null;
}
