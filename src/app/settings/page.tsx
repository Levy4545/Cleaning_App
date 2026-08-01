import { KeyRound, ShieldCheck, UserRound } from "lucide-react";

import { syncUserFromAuth } from "@/actions/auth";
import { requireUser } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/app-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  await syncUserFromAuth();
  const user = await requireUser();

  return (
    <AppShell
      variant="customer"
      user={user}
      title="Settings"
      description="Manage your profile and account security."
    >
      <div className="max-w-3xl space-y-5">
        <Card glow>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4 text-gold" />
              Profile
            </CardTitle>
            <CardDescription>Your details and how the shop reaches you.</CardDescription>
          </CardHeader>

          <ProfileForm
            name={user.name}
            email={user.email}
            phone={user.phone ?? null}
            role={user.role ?? "USER"}
          />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-gold" />
              Password
            </CardTitle>
            <CardDescription>
              We email a secure link instead of asking for your current password.
            </CardDescription>
          </CardHeader>

          <ResetPasswordForm defaultEmail={user.email} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-gold" />
              Sessions
            </CardTitle>
            <CardDescription>
              Signing out ends this session on this device. Use the icon beside your name in the
              sidebar.
            </CardDescription>
          </CardHeader>

          <dl className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            <div className="flex justify-between gap-3 bg-surface px-4 py-3">
              <dt className="text-sm text-ash">Account role</dt>
              <dd className="text-sm text-bone">{user.role ?? "USER"}</dd>
            </div>
            <div className="flex justify-between gap-3 bg-surface px-4 py-3">
              <dt className="text-sm text-ash">Sign-in email</dt>
              <dd className="text-sm text-bone">{user.email}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </AppShell>
  );
}
