import type { NextConfig } from "next";

import { applySupabasePublicEnv } from "./src/lib/supabase/env-keys";

// Vercel Secrets cannot use the NEXT_PUBLIC_ prefix. Copy SUPABASE_URL /
// SUPABASE_ANON_KEY onto NEXT_PUBLIC_* so the browser auth client still works.
const { url: supabaseUrl, anonKey: supabaseAnonKey } = applySupabasePublicEnv();

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
  },
};

if (!process.env.VERCEL) {
  nextConfig.output = "standalone";
}

export default nextConfig;
