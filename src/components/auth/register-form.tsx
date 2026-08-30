"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { signUpWithEmail } from "@/actions/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useI18n } from "@/i18n/provider";

export function RegisterForm() {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await signUpWithEmail({
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      });

      if (result && !result.success) {
        setError(result.error);
      }
    });
  };

  return (
    <Card glow className="p-8">
      <div className="mb-7 text-center">
        <h1 className="font-display text-3xl tracking-tight text-bone">
          {t("auth.createAccountTitle")}
        </h1>
        <p className="mt-1.5 text-sm text-ash">{t("auth.registerSubtitle")}</p>
      </div>

      <form action={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">{t("common.name")}</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder={t("auth.namePlaceholder")}
            required
          />
        </div>

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
            autoComplete="new-password"
            placeholder={t("auth.newPasswordPlaceholder")}
            minLength={8}
            required
          />
        </div>

        {error ? <Alert>{error}</Alert> : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("auth.creatingAccount") : t("auth.createAccount")}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs text-faint">{t("common.or")}</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <GoogleSignInButton redirectTo="/dashboard" />

      <p className="mt-7 text-center text-sm text-ash">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-gold hover:underline">
          {t("common.signIn")}
        </Link>
      </p>
    </Card>
  );
}
