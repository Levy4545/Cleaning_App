import { requireAdmin } from "@/lib/auth/guards";
import { WithCatalog } from "@/i18n/with-catalog";

/** Guards the section; each admin page renders its own AppShell with a title. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return <WithCatalog>{children}</WithCatalog>;
}
