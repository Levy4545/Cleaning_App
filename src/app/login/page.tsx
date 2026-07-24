import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
