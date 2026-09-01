"use client";

import { buttonClasses } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useI18n } from "@/i18n/provider";
import { googleOAuthStartUrl } from "@/lib/auth/public-site";

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

/**
 * Sends the browser to the live site to start Google OAuth.
 * Never uses localhost as the OAuth redirect — after Gmail the user lands on the real dashboard.
 */
export function GoogleSignInButton() {
  const { t } = useI18n();
  // Direct NEXT_PUBLIC_* access so Next.js inlines it for the browser.
  const href =
    googleOAuthStartUrl({ NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL }) ?? "";

  if (!href) {
    return <Alert>{t("auth.siteUrlMissing")}</Alert>;
  }

  return (
    <a href={href} className={buttonClasses("secondary", "md", "w-full")}>
      <GoogleIcon />
      {t("auth.continueGoogle")}
    </a>
  );
}
