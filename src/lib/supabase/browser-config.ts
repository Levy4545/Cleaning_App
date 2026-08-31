import {
  readPublicSupabaseConfig,
  requirePublicSupabaseConfig,
  type PublicSupabaseConfig,
} from "./env-keys";

let injected: PublicSupabaseConfig | null = null;

/** Called from a client provider so runtime Vercel Secrets reach the browser. */
export function setBrowserSupabaseConfig(config: PublicSupabaseConfig | null) {
  injected = config;
}

export function peekBrowserSupabaseConfig(): PublicSupabaseConfig | null {
  return injected ?? readPublicSupabaseConfig();
}

export function getBrowserSupabaseConfig(): PublicSupabaseConfig {
  return injected ?? requirePublicSupabaseConfig();
}
