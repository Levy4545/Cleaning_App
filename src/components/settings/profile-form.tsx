"use client";

import { Lock } from "lucide-react";
import { useState, useTransition } from "react";

import { updateProfile } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  name,
  email,
  phone,
  role,
}: {
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
}) {
  const [values, setValues] = useState({ name: name ?? "", phone: phone ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dirty = values.name !== (name ?? "") || values.phone !== (phone ?? "");

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateProfile({
        name: String(formData.get("name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSaved(true);
    });
  };

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex flex-col items-center gap-2">
          <Avatar name={values.name} email={email} className="h-20 w-20 text-xl" />
          <span className="rounded-full border border-gold/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold">
            {role}
          </span>
        </div>

        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              name="name"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              placeholder="Jane Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input id="email" value={email} readOnly disabled className="pr-9" />
              <Lock className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={values.phone}
              onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
              placeholder="+1 555 123 4567"
            />
          </div>
        </div>
      </div>

      {error ? <Alert>{error}</Alert> : null}
      {saved ? <Alert tone="success">Profile updated.</Alert> : null}

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button
          type="button"
          variant="ghost"
          disabled={!dirty || isPending}
          onClick={() => {
            setValues({ name: name ?? "", phone: phone ?? "" });
            setError(null);
            setSaved(false);
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!dirty || isPending}>
          {isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
