"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/guards";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import {
  countUnreadInAppNotifications,
  listInAppNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/db/queries/notifications";
import type { ActionResult } from "@/types";

export async function getNotificationFeed(): Promise<
  ActionResult<{
    items: Array<{
      id: string;
      type: string;
      subject: string | null;
      body: string;
      href: string | null;
      readAt: string | null;
      createdAt: string;
      appointmentId: string | null;
    }>;
    unreadCount: number;
  }>
> {
  const user = await requireUser();
  const shopId = await getDefaultShopId();
  const [rows, unreadCount] = await Promise.all([
    listInAppNotificationsForUser(user.id, shopId),
    countUnreadInAppNotifications(user.id, shopId),
  ]);

  return {
    success: true,
    data: {
      unreadCount,
      items: rows.map((row) => ({
        id: row.id,
        type: row.type,
        subject: row.subject,
        body: row.body,
        href: row.href,
        readAt: row.readAt ? new Date(row.readAt).toISOString() : null,
        createdAt: new Date(row.createdAt).toISOString(),
        appointmentId: row.appointmentId,
      })),
    },
  };
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const shopId = await getDefaultShopId();
  await markNotificationRead({
    notificationId,
    userId: user.id,
    shopId,
  });
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllAsRead(): Promise<ActionResult> {
  const user = await requireUser();
  const shopId = await getDefaultShopId();
  await markAllNotificationsRead(user.id, shopId);
  revalidatePath("/notifications");
  return { success: true };
}
