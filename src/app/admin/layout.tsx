import { requireAdmin } from "@/lib/auth/guards";
import { syncUserFromAuth } from "@/actions/auth";

/** Guards the section; each admin page renders its own AppShell with a title. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await syncUserFromAuth();
  await requireAdmin();

  return children;
}
