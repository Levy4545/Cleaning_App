import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, syncUserFromAuth } from "@/actions/auth";

export default async function DashboardPage() {
  await syncUserFromAuth();
  const user = await getCurrentUser();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl">
      <Sidebar />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>
              Welcome back{user?.name ? `, ${user.name}` : ""}. This route is protected by
              middleware.
            </CardDescription>
          </CardHeader>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <dt className="text-sm text-slate-500">Email</dt>
              <dd className="mt-1 font-medium text-slate-900">{user?.email}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <dt className="text-sm text-slate-500">User ID</dt>
              <dd className="mt-1 break-all font-mono text-sm text-slate-900">{user?.id}</dd>
            </div>
          </dl>
        </Card>
      </main>
    </div>
  );
}
