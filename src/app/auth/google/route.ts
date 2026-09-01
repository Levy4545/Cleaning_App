import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { googleOAuthCallbackUrl, isLocalOrigin, resolvePublicSiteUrl } from "@/lib/auth/public-site";
import { requirePublicSupabaseConfig } from "@/lib/supabase/env-keys";

/**
 * Starts Google OAuth on the live site only. Localhost is bounced to production
 * so the PKCE cookie and the callback share the same domain.
 */
export async function GET(request: Request) {
  const site = resolvePublicSiteUrl();
  const here = new URL(request.url).origin;

  if (site && isLocalOrigin(here)) {
    return NextResponse.redirect(`${site}/auth/google`);
  }

  const callback = googleOAuthCallbackUrl();
  if (!site || !callback) {
    return NextResponse.redirect(new URL("/login?error=auth", here));
  }

  const { url: supabaseUrl, anonKey } = requirePublicSupabaseConfig();
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback,
    },
  });

  if (error || !data.url) {
    console.error("Google OAuth start failed:", error?.message);
    return NextResponse.redirect(`${site}/login?error=auth`);
  }

  return NextResponse.redirect(data.url);
}
