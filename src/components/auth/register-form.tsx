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

export function RegisterForm() {
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
        <h1 className="font-display text-3xl tracking-tight text-bone">Create your account</h1>
        <p className="mt-1.5 text-sm text-ash">Book your first cleaning in under a minute.</p>
      </div>

      <form action={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" autoComplete="name" placeholder="Jane Doe" required />
        </div>

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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
            required
          />
        </div>

        {error ? <Alert>{error}</Alert> : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs text-faint">or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <GoogleSignInButton redirectTo="/dashboard" />

      <p className="mt-7 text-center text-sm text-ash">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-gold hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
