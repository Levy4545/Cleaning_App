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

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const authError = searchParams.get("error");

  const [error, setError] = useState<string | null>(
    authError === "auth" ? "Authentication failed. Please try again." : null,
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
        <h1 className="font-display text-3xl tracking-tight text-bone">Welcome back</h1>
        <p className="mt-1.5 text-sm text-ash">Sign in to continue to Master-Gold Cleaning.</p>
      </div>

      <form action={handleSubmit} className="space-y-5">
        {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
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
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
        </div>

        {error ? <Alert>{error}</Alert> : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs text-faint">or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <GoogleSignInButton redirectTo={redirectTo ?? undefined} />

      <p className="mt-7 text-center text-sm text-ash">
        No account?{" "}
        <Link href="/register" className="font-medium text-gold hover:underline">
          Create one
        </Link>
      </p>
    </Card>
  );
}
