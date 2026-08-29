import { env } from "@/env";
import {
  createAndSendNotification,
  insertNotificationRow,
} from "@/db/queries/notifications";
import { findUserById, listUsersByRole } from "@/db/queries/users";
import type { NotificationType } from "@/lib/notifications/types";

export type EventNotifyInput = {
  shopId: string;
  userId: string;
  type: NotificationType;
  subject: string;
  body: string;
  appointmentId?: string;
  /** Deep link for in-app notification clicks */
  href: string;
};

/**
 * Delivers a system event both in-app and by email (and optionally SMS).
 * Failures on one channel do not block the others.
 */
export async function notifyUserEvent(input: EventNotifyInput) {
  const user = await findUserById(input.userId);
  if (!user) {
    return;
  }

  await insertNotificationRow({
    shopId: input.shopId,
    userId: input.userId,
    channel: "IN_APP",
    type: input.type,
    subject: input.subject,
    body: input.body,
    appointmentId: input.appointmentId,
    href: input.href,
    status: "SENT",
  });

  if (user.email) {
    await createAndSendNotification({
      shopId: input.shopId,
      userId: input.userId,
      channel: "EMAIL",
      to: user.email,
      subject: input.subject,
      body: input.body,
      type: input.type,
      appointmentId: input.appointmentId,
      href: input.href,
    });
  }

  if (env.NOTIFY_CHANNEL === "SMS" && (user.phone || user.email)) {
    await createAndSendNotification({
      shopId: input.shopId,
      userId: input.userId,
      channel: "SMS",
      to: user.phone ?? user.email,
      subject: input.subject,
      body: input.body,
      type: input.type,
      appointmentId: input.appointmentId,
      href: input.href,
    });
  }
}

export async function notifyAdminsEvent(
  shopId: string,
  input: Omit<EventNotifyInput, "shopId" | "userId">,
) {
  const admins = await listUsersByRole("ADMIN");
  await Promise.all(
    admins.map((admin) =>
      notifyUserEvent({
        shopId,
        userId: admin.id,
        ...input,
      }),
    ),
  );
}
