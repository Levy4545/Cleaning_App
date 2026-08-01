import { Suspense } from "react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthLayout
      quote="Elegance is not about being noticed, it's about being remembered."
      attribution="Giorgio Armani"
    >
      <Suspense fallback={<p className="text-sm text-faint">Loading...</p>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
