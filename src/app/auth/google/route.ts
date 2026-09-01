import { NextResponse } from "next/server";

import { resolvePublicSiteUrl } from "@/lib/auth/public-site";
import { createClient } from "@/lib/supabase/server";

/**
 * Starts Google OAuth on the live site. Localhost and preview hosts are sent
 * there first so the PKCE cookie and `/auth/callback` share that domain.
 */
export async function GET(request: Request) {
  const here = new URL(request.url).origin;
  const site = resolvePublicSiteUrl();

  if (!site) {
    return NextResponse.redirect(new URL("/login?error=auth", here));
  }

  if (here !== site) {
    return NextResponse.redirect(`${site}/auth/google`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${site}/auth/callback`,
    },
  });

  if (error || !data.url) {
    console.error("Google OAuth start failed:", error?.message);
    return NextResponse.redirect(`${site}/login?error=auth`);
  }

  return NextResponse.redirect(data.url);
}
