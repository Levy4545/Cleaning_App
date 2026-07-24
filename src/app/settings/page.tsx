import { Sidebar } from "@/components/layout/sidebar";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/actions/auth";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl">
      <Sidebar />
      <main className="flex-1 space-y-8 px-4 py-8 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your profile and security settings.</CardDescription>
          </CardHeader>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-slate-500">Name</dt>
              <dd className="font-medium text-slate-900">{user?.name ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">{user?.email}</dd>
            </div>
          </dl>
        </Card>

        <ResetPasswordForm />
      </main>
    </div>
  );
}
