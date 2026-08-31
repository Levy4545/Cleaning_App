"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { peekBrowserSupabaseConfig } from "@/lib/supabase/browser-config";
import { readGoogleProviderEnabled } from "@/lib/supabase/provider-settings";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { useI18n } from "@/i18n/provider";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

type GoogleSignInButtonProps = {
  redirectTo?: string;
};

/**
 * Renders the Google brand icon.
 */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.88-3a7.2 7.2 0 0 1-10.72-3.78h-4v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.34 14.3a7.19 7.19 0 0 1 0-4.6V6.61h-4a12 12 0 0 0 0 10.78l4-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.34 6.61l4 3.09A7.16 7.16 0 0 1 12 4.75Z"
      />
    </svg>
  );
}

function failMessage(caught: unknown, fallback: string) {
  return caught instanceof Error && caught.message ? caught.message : fallback;
}

/**
 * Renders a button that initiates Google sign-in.
 *
 * @param redirectTo - Optional destination to navigate to after authentication
 * @returns The Google sign-in button and any authentication error message
 */
export function GoogleSignInButton({ redirectTo }: GoogleSignInButtonProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const config = peekBrowserSupabaseConfig();
      if (!config) {
        setError(t("auth.authNotConfigured"));
        setLoading(false);
        return;
      }

      const googleEnabled = await readGoogleProviderEnabled(config);
      if (googleEnabled === false) {
        setError(t("auth.googleNotEnabled", { origin: window.location.origin }));
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const callback = new URL("/auth/callback", window.location.origin);
      if (redirectTo) {
        callback.searchParams.set("next", safeRedirectPath(redirectTo));
      }

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callback.toString(),
          skipBrowserRedirect: true,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!data.url) {
        setError(t("auth.googleStartFailed"));
        setLoading(false);
        return;
      }

      window.location.assign(data.url);
    } catch (caught) {
      setError(failMessage(caught, t("auth.googleStartFailed")));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => void handleGoogleSignIn()}
        disabled={loading}
      >
        <GoogleIcon />
        {loading ? t("auth.redirecting") : t("auth.continueGoogle")}
      </Button>
      {error ? <Alert>{error}</Alert> : null}
    </div>
  );
}
