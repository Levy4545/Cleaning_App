"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { signInWithEmail } from "@/actions/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useI18n } from "@/i18n/provider";

/**
 * Renders a login form with email, password, and Google sign-in options.
 *
 * @returns The login form interface.
 */
export function LoginForm() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const authError = searchParams.get("error");

  const [error, setError] = useState<string | null>(
    authError === "auth" ? t("auth.authFailed") : null,
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await signInWithEmail({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        redirectTo: redirectTo ?? undefined,
      });

      if (result && !result.success) {
        setError(result.error);
      }
    });
  };

  return (
    <Card glow className="p-8">
      <div className="mb-7 text-center">
        <h1 className="font-display text-3xl tracking-tight text-bone">{t("auth.welcomeBack")}</h1>
        <p className="mt-1.5 text-sm text-ash">{t("auth.loginSubtitle")}</p>
      </div>

      <form action={handleSubmit} className="space-y-5">
        {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

        <div className="space-y-2">
          <Label htmlFor="email">{t("common.email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("common.password")}</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder={t("auth.passwordPlaceholder")}
            required
          />
        </div>

        {error ? <Alert>{error}</Alert> : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("auth.signingIn") : t("common.signIn")}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs text-faint">{t("common.or")}</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <GoogleSignInButton redirectTo={redirectTo ?? undefined} />

      <p className="mt-7 text-center text-sm text-ash">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="font-medium text-gold hover:underline">
          {t("auth.createOne")}
        </Link>
      </p>
    </Card>
  );
}
