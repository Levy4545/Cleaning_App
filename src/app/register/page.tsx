import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthLayout
      quote="The details are not the details. They make the design."
      attribution="Charles Eames"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
