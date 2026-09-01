import { NextResponse } from "next/server";

import { getCurrentUser, syncUserFromAuth } from "@/actions/auth";
import { homePathForRole } from "@/lib/auth/home-path";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

function loginErrorRedirect(origin: string, error: string, description?: string | null) {
  const url = new URL("/login", origin);
  url.searchParams.set("error", error);
  if (description) {
    url.searchParams.set("error_description", description.slice(0, 300));
  }
  return NextResponse.redirect(url);
}

/**
 * Handles an authentication callback and redirects the user to the requested or role-based destination.
 *
 * @returns A redirect response to the destination after successful authentication, or to the login page with an authentication error.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const oauthError = searchParams.get("error");
  const oauthDescription = searchParams.get("error_description");

  if (oauthError && !code) {
    return loginErrorRedirect(origin, oauthError, oauthDescription);
  }

  if (!code) {
    return loginErrorRedirect(origin, "auth");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("OAuth code exchange failed:", error.message);
      return loginErrorRedirect(origin, "auth", error.message);
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
    const message = caught instanceof Error ? caught.message : undefined;
    return loginErrorRedirect(origin, "auth", message);
  }
}
