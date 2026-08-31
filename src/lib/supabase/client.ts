import { createBrowserClient } from "@supabase/ssr";

import { requirePublicSupabaseConfig } from "./env-keys";

export function createClient() {
  const { url, anonKey } = requirePublicSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
