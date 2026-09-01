import type { NextConfig } from "next";

import { applyPublicSiteUrl } from "./src/lib/auth/public-site";
import { applySupabasePublicEnv } from "./src/lib/supabase/env-keys";

const { url: supabaseUrl, anonKey: supabaseAnonKey } = applySupabasePublicEnv();
const siteUrl = applyPublicSiteUrl();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  env: {
    ...(supabaseUrl
      ? { SUPABASE_URL: supabaseUrl, NEXT_PUBLIC_SUPABASE_URL: supabaseUrl }
      : {}),
    ...(supabaseAnonKey
      ? {
          SUPABASE_ANON_KEY: supabaseAnonKey,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
        }
      : {}),
    ...(siteUrl ? { NEXT_PUBLIC_SITE_URL: siteUrl, SITE_URL: siteUrl } : {}),
  },
};

if (!process.env.VERCEL) {
  nextConfig.output = "standalone";
}

export default nextConfig;
