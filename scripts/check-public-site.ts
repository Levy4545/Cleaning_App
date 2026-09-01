import {
  applyPublicSiteUrl,
  googleOAuthCallbackUrl,
  googleOAuthStartUrl,
  isLocalOrigin,
  resolvePublicSiteUrl,
} from "../src/lib/auth/public-site";

function assert(cond: unknown, message: string) {
  if (!cond) throw new Error(message);
}

assert(
  resolvePublicSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://app.example.com/" }) ===
    "https://app.example.com",
  "strips trailing slash via origin",
);

assert(
  resolvePublicSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }) === undefined,
  "rejects localhost",
);

assert(
  resolvePublicSiteUrl({ SITE_URL: "http://127.0.0.1:3000" }) === undefined,
  "rejects 127.0.0.1",
);

assert(
  resolvePublicSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "cleaning-app.vercel.app" }) ===
    "https://cleaning-app.vercel.app",
  "uses Vercel production host",
);

assert(
  googleOAuthCallbackUrl({ NEXT_PUBLIC_SITE_URL: "https://app.example.com" }) ===
    "https://app.example.com/auth/callback",
  "callback is live /auth/callback",
);

assert(
  googleOAuthStartUrl({ NEXT_PUBLIC_SITE_URL: "https://app.example.com" }) ===
    "https://app.example.com/auth/google",
  "start is live /auth/google",
);

assert(isLocalOrigin("http://localhost:3000"), "localhost origin");
assert(!isLocalOrigin("https://app.example.com"), "prod origin");

const env: NodeJS.Dict<string | undefined> = { VERCEL_PROJECT_PRODUCTION_URL: "shop.example.com" };
assert(applyPublicSiteUrl(env) === "https://shop.example.com", "apply copies origin");
assert(env.NEXT_PUBLIC_SITE_URL === "https://shop.example.com", "sets NEXT_PUBLIC_SITE_URL");

console.log("public site URL checks passed");
