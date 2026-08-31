import { NextResponse } from "next/server";

import { getCurrentUser, syncUserFromAuth } from "@/actions/auth";
import { homePathForRole } from "@/lib/auth/home-path";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles an authentication callback and redirects the user to the requested or role-based destination.
 *
 * @returns A redirect response to the destination after successful authentication, or to the login page with an authentication error.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const login = `${origin}/login?error=auth`;

  if (!code) {
    return NextResponse.redirect(login);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("OAuth code exchange failed:", error.message);
      return NextResponse.redirect(login);
    }

    try {
      await syncUserFromAuth();
    } catch (syncError) {
      console.error("syncUserFromAuth after Google login failed:", syncError);
    }

    const current = await getCurrentUser().catch(() => null);
    const fallback = homePathForRole(current?.role ?? "USER");
    const next = requestedNext ? safeRedirectPath(requestedNext, fallback) : fallback;
    return NextResponse.redirect(`${origin}${next}`);
  } catch (caught) {
    console.error("OAuth callback failed:", caught);
    return NextResponse.redirect(login);
  }
}
