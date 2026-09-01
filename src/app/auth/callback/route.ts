import { NextResponse } from "next/server";

import { getCurrentUser, syncUserFromAuth } from "@/actions/auth";
import { homePathForRole } from "@/lib/auth/home-path";
import { resolvePublicSiteUrl } from "@/lib/auth/public-site";
import { createClient } from "@/lib/supabase/server";

function loginRedirect(site: string, error: string, description?: string | null) {
  const url = new URL("/login", site);
  url.searchParams.set("error", error);
  if (description) {
    url.searchParams.set("error_description", description.slice(0, 300));
  }
  return NextResponse.redirect(url);
}

/**
 * Completes Google OAuth on the live site and sends the user to the dashboard.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const site = resolvePublicSiteUrl();
  const here = requestUrl.origin;

  if (site && here !== site) {
    return NextResponse.redirect(`${site}/login`);
  }

  const destination = site ?? here;

  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");
  const oauthDescription = requestUrl.searchParams.get("error_description");

  if (oauthError && !code) {
    return loginRedirect(destination, oauthError, oauthDescription);
  }

  if (!code) {
    return loginRedirect(destination, "auth");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("OAuth code exchange failed:", error.message);
      return loginRedirect(destination, "auth", error.message);
    }

    try {
      await syncUserFromAuth();
    } catch (syncError) {
      console.error("syncUserFromAuth after Google login failed:", syncError);
    }

    const current = await getCurrentUser().catch(() => null);
    const home = homePathForRole(current?.role ?? "USER");
    return NextResponse.redirect(`${destination}${home}`);
  } catch (caught) {
    console.error("OAuth callback failed:", caught);
    const message = caught instanceof Error ? caught.message : undefined;
    return loginRedirect(destination, "auth", message);
  }
}
