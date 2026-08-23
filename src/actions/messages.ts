"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import { findAppointmentById } from "@/db/queries/appointments";
import {
  createAppointmentMessage,
  listMessagesForAppointment,
  markAppointmentMessagesRead,
} from "@/db/queries/messages";
import { listUsersByRole } from "@/db/queries/users";
import { notifyAdminsEvent, notifyUserEvent } from "@/lib/notifications/dispatch";
import type { ActionResult } from "@/types";

const sendMessageSchema = z.object({
  appointmentId: z.string().uuid(),
  body: z.string().trim().min(1, "Message cannot be empty").max(2000),
});

export async function listAppointmentMessages(
  appointmentId: string,
): Promise<
  ActionResult<
    Array<{
      id: string;
      body: string;
      sentAt: string;
      senderId: string;
      senderName: string | null;
      senderEmail: string;
      isMine: boolean;
    }>
  >
> {
  const user = await requireUser();
  const shopId = await getDefaultShopId();
  const appointment = await findAppointmentById(appointmentId, shopId);

  if (!appointment) {
    return { success: false, error: "Appointment not found" };
  }

  const isCustomer = appointment.customerId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isCustomer && !isAdmin) {
    return { success: false, error: "Not allowed" };
  }

  await markAppointmentMessagesRead({
    appointmentId,
    recipientId: user.id,
    shopId,
  });

  const rows = await listMessagesForAppointment(appointmentId, shopId);
  return {
    success: true,
    data: rows.map((row) => ({
      id: row.id,
      body: row.body,
      sentAt: new Date(row.sentAt).toISOString(),
      senderId: row.senderId,
      senderName: row.senderName,
      senderEmail: row.senderEmail,
      isMine: row.senderId === user.id,
    })),
  };
}

/**
 * Posts a comment on an appointment and notifies the other party (in-app + email).
 */
export async function sendAppointmentMessage(
  input: z.infer<typeof sendMessageSchema>,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const shopId = await getDefaultShopId();
  const appointment = await findAppointmentById(parsed.data.appointmentId, shopId);
  if (!appointment) {
    return { success: false, error: "Appointment not found" };
  }

  const isCustomer = appointment.customerId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isCustomer && !isAdmin) {
    return { success: false, error: "Not allowed" };
  }

  let recipientId: string;
  if (isCustomer) {
    const admins = await listUsersByRole("ADMIN");
    const admin = admins[0];
    if (!admin) {
      return { success: false, error: "No admin available to receive messages" };
    }
    recipientId = admin.id;
  } else {
    recipientId = appointment.customerId;
  }

  const message = await createAppointmentMessage({
    shopId,
    senderId: user.id,
    recipientId,
    appointmentId: appointment.id,
    body: parsed.data.body,
  });

  if (!message) {
    return { success: false, error: "Could not send message" };
  }

  const preview =
    parsed.data.body.length > 160
      ? `${parsed.data.body.slice(0, 157)}…`
      : parsed.data.body;

  if (isCustomer) {
    await notifyAdminsEvent(shopId, {
      type: "APPOINTMENT_MESSAGE",
      subject: "New message on a booking",
      body: `${user.name ?? user.email} wrote about a booking:\n\n"${preview}"`,
      appointmentId: appointment.id,
      href: "/admin/appointments",
    });
  } else {
    await notifyUserEvent({
      shopId,
      userId: appointment.customerId,
      type: "APPOINTMENT_MESSAGE",
      subject: "New message about your booking",
      body: `The shop left a message about your booking:\n\n"${preview}"`,
      appointmentId: appointment.id,
      href: "/appointments",
    });
  }

  revalidatePath("/appointments");
  revalidatePath("/admin/appointments");
  revalidatePath("/notifications");

  return { success: true, data: { id: message.id } };
}
