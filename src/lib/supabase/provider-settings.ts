import type { PublicSupabaseConfig } from "./env-keys";

type AuthSettings = {
  external?: {
    google?: boolean;
  };
};

/**
 * Asks GoTrue whether the Google provider is enabled.
 * Returns null when settings cannot be loaded (network / bad URL).
 */
export async function readGoogleProviderEnabled(
  config: PublicSupabaseConfig,
): Promise<boolean | null> {
  try {
    const base = config.url.replace(/\/$/, "");
    const response = await fetch(`${base}/auth/v1/settings`, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as AuthSettings;
    return Boolean(body.external?.google);
  } catch {
    return null;
  }
}
