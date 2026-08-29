import { syncUserFromAuth } from "@/actions/auth";
import { requireUser } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/app-shell";
import {
  NotificationsPageClient,
  type NotificationListItem,
} from "@/components/notifications/notifications-page";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import {
  countUnreadInAppNotifications,
  listInAppNotificationsForUser,
} from "@/db/queries/notifications";

export default async function NotificationsPage() {
  await syncUserFromAuth();
  const user = await requireUser();
  const shopId = await getDefaultShopId();

  const [rows, unreadCount] = await Promise.all([
    listInAppNotificationsForUser(user.id, shopId, 80),
    countUnreadInAppNotifications(user.id, shopId),
  ]);

  const items: NotificationListItem[] = rows.map((row) => ({
    id: row.id,
    type: row.type,
    subject: row.subject,
    body: row.body,
    href: row.href,
    readAt: row.readAt ? new Date(row.readAt).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString(),
  }));

  return (
    <AppShell
      variant={user.role === "ADMIN" ? "admin" : "customer"}
      user={user}
      title="Notifications"
      description="Booking status updates and messages"
    >
      <NotificationsPageClient items={items} unreadCount={unreadCount} />
    </AppShell>
  );
}
