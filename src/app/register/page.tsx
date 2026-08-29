import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";
import { getTranslator } from "@/i18n/server";

export default async function RegisterPage() {
  const { t } = await getTranslator();

  return (
    <AuthLayout quote={t("auth.registerQuote")} attribution={t("auth.registerAttribution")}>
      <RegisterForm />
    </AuthLayout>
  );
}
