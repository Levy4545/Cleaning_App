import { NextResponse } from "next/server";

import { getCurrentUser, syncUserFromAuth } from "@/actions/auth";
import { homePathForRole } from "@/lib/auth/home-path";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      await syncUserFromAuth();
      const current = await getCurrentUser();
      const fallback = homePathForRole(current?.role ?? "USER");
      const next = requestedNext ? safeRedirectPath(requestedNext, fallback) : fallback;
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
