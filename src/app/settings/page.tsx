import { KeyRound, ShieldCheck, UserRound } from "lucide-react";

import { syncUserFromAuth } from "@/actions/auth";
import { requireUser } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/app-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslator } from "@/i18n/server";

export default async function SettingsPage() {
  await syncUserFromAuth();
  const user = await requireUser();
  const { t } = await getTranslator();

  return (
    <AppShell
      variant="customer"
      user={user}
      title={t("settings.title")}
      description={t("settings.description")}
    >
      <div className="max-w-3xl space-y-5">
        <Card glow>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4 text-gold" />
              {t("settings.profile")}
            </CardTitle>
            <CardDescription>{t("settings.profileBody")}</CardDescription>
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
              {t("settings.password")}
            </CardTitle>
            <CardDescription>{t("settings.passwordBody")}</CardDescription>
          </CardHeader>

          <ResetPasswordForm defaultEmail={user.email} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-gold" />
              {t("settings.sessions")}
            </CardTitle>
            <CardDescription>{t("settings.sessionsBody")}</CardDescription>
          </CardHeader>

          <dl className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            <div className="flex justify-between gap-3 bg-surface px-4 py-3">
              <dt className="text-sm text-ash">{t("settings.accountRole")}</dt>
              <dd className="text-sm text-bone">{user.role ?? "USER"}</dd>
            </div>
            <div className="flex justify-between gap-3 bg-surface px-4 py-3">
              <dt className="text-sm text-ash">{t("settings.signInEmail")}</dt>
              <dd className="text-sm text-bone">{user.email}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </AppShell>
  );
}
