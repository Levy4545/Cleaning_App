"use client";

import { useState, useTransition } from "react";

import { resetPassword } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await resetPassword({
        email: formData.get("email") as string,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessage("Check your email for a password reset link.");
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1 space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={defaultEmail}
            required
          />
        </div>
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Sending..." : "Send reset link"}
        </Button>
      </div>

      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
    </form>
  );
}
