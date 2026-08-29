import { Suspense } from "react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { getTranslator } from "@/i18n/server";

export default async function LoginPage() {
  const { t } = await getTranslator();

  return (
    <AuthLayout quote={t("auth.loginQuote")} attribution={t("auth.loginAttribution")}>
      <Suspense fallback={<p className="text-sm text-faint">{t("common.loading")}</p>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
