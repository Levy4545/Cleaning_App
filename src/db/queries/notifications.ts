import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  notifications,
  type NotificationChannel,
  type NotificationStatus,
} from "@/db/schema";
import { sendNotification, type NotifyChannel } from "@/lib/notifications/send";
import type { NotificationType } from "@/lib/notifications/types";

export async function insertNotificationRow(input: {
  shopId: string;
  userId: string;
  channel: NotificationChannel;
  type?: NotificationType;
  subject?: string;
  body: string;
  appointmentId?: string | null;
  href?: string | null;
  status?: NotificationStatus;
}) {
  const [row] = await db
    .insert(notifications)
    .values({
      shopId: input.shopId,
      userId: input.userId,
      channel: input.channel,
      type: input.type ?? "GENERAL",
      subject: input.subject,
      body: input.body,
      appointmentId: input.appointmentId ?? null,
      href: input.href ?? null,
      status: input.status ?? "PENDING",
    })
    .returning();

  return row;
}

export async function createAndSendNotification(input: {
  shopId: string;
  userId: string;
  channel: NotifyChannel;
  to: string;
  subject?: string;
  body: string;
  html?: string;
  type?: NotificationType;
  appointmentId?: string | null;
  href?: string | null;
}) {
  const [row] = await db
    .insert(notifications)
    .values({
      shopId: input.shopId,
      userId: input.userId,
      channel: input.channel as NotificationChannel,
      type: input.type ?? "GENERAL",
      subject: input.subject,
      body: input.body,
      appointmentId: input.appointmentId ?? null,
      href: input.href ?? null,
      status: "PENDING",
    })
    .returning();

  const result = await sendNotification({
    shopId: input.shopId,
    userId: input.userId,
    channel: input.channel,
    to: input.to,
    subject: input.subject,
    body: input.body,
    html: input.html,
  });

  const status: NotificationStatus = result.ok ? "SENT" : "FAILED";

  if (row) {
    await db
      .update(notifications)
      .set({ status })
      .where(eq(notifications.id, row.id));
  }

  return { notification: row, result };
}

export async function listInAppNotificationsForUser(
  userId: string,
  shopId: string,
  limit = 40,
) {
  return db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.shopId, shopId),
        eq(notifications.channel, "IN_APP"),
      ),
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/** @deprecated Prefer listInAppNotificationsForUser for the UI inbox */
export async function listNotificationsForUser(userId: string, shopId: string) {
  return listInAppNotificationsForUser(userId, shopId);
}

export async function countUnreadInAppNotifications(userId: string, shopId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.shopId, shopId),
        eq(notifications.channel, "IN_APP"),
        isNull(notifications.readAt),
      ),
    );

  return row?.count ?? 0;
}

export async function markNotificationRead(input: {
  notificationId: string;
  userId: string;
  shopId: string;
}) {
  const [row] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, input.notificationId),
        eq(notifications.userId, input.userId),
        eq(notifications.shopId, input.shopId),
        eq(notifications.channel, "IN_APP"),
      ),
    )
    .returning();

  return row ?? null;
}

export async function markAllNotificationsRead(userId: string, shopId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.shopId, shopId),
        eq(notifications.channel, "IN_APP"),
        isNull(notifications.readAt),
      ),
    );
}
