import { createBrowserClient } from "@supabase/ssr";

import { getBrowserSupabaseConfig } from "./browser-config";

export function createClient() {
  const { url, anonKey } = getBrowserSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
