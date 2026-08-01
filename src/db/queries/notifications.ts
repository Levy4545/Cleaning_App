import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  notifications,
  type NotificationChannel,
  type NotificationStatus,
} from "@/db/schema";
import { sendNotification, type NotifyChannel } from "@/lib/notifications/send";

export async function createAndSendNotification(input: {
  shopId: string;
  userId: string;
  channel: NotifyChannel;
  to: string;
  subject?: string;
  body: string;
}) {
  const [row] = await db
    .insert(notifications)
    .values({
      shopId: input.shopId,
      userId: input.userId,
      channel: input.channel as NotificationChannel,
      subject: input.subject,
      body: input.body,
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

export async function listNotificationsForUser(userId: string, shopId: string) {
  return db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.shopId, shopId)))
    .orderBy(desc(notifications.createdAt));
}
