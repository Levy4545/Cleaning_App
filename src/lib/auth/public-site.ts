/**
 * Canonical public origin of the live site. Google OAuth always returns here —
 * never localhost / 127.0.0.1.
 */

function isLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "0.0.0.0";
}

function asHttpsOrigin(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (isLocalHostname(url.hostname)) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

export function isLocalOrigin(origin: string): boolean {
  try {
    return isLocalHostname(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export function resolvePublicSiteUrl(
  env: NodeJS.Dict<string | undefined> = process.env,
): string | undefined {
  return (
    asHttpsOrigin(env.NEXT_PUBLIC_SITE_URL) ||
    asHttpsOrigin(env.SITE_URL) ||
    asHttpsOrigin(env.VERCEL_PROJECT_PRODUCTION_URL)
  );
}

/** Copy the live origin onto NEXT_PUBLIC_SITE_URL for the browser (call from next.config). */
export function applyPublicSiteUrl(
  env: NodeJS.Dict<string | undefined> = process.env,
): string | undefined {
  const origin = resolvePublicSiteUrl(env);
  if (origin) {
    env.NEXT_PUBLIC_SITE_URL = origin;
    env.SITE_URL = origin;
  }
  return origin;
}

export function googleOAuthStartUrl(
  env: NodeJS.Dict<string | undefined> = process.env,
): string | undefined {
  const site = resolvePublicSiteUrl(env);
  return site ? `${site}/auth/google` : undefined;
}

export function googleOAuthCallbackUrl(
  env: NodeJS.Dict<string | undefined> = process.env,
): string | undefined {
  const site = resolvePublicSiteUrl(env);
  return site ? `${site}/auth/callback` : undefined;
}
