import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { messages, users } from "@/db/schema";

export async function createAppointmentMessage(input: {
  shopId: string;
  senderId: string;
  recipientId: string;
  appointmentId: string;
  body: string;
}) {
  const [row] = await db
    .insert(messages)
    .values({
      shopId: input.shopId,
      senderId: input.senderId,
      recipientId: input.recipientId,
      appointmentId: input.appointmentId,
      body: input.body.trim(),
      sentAt: new Date(),
    })
    .returning();

  return row;
}

export async function listMessagesForAppointment(appointmentId: string, shopId: string) {
  return db
    .select({
      id: messages.id,
      body: messages.body,
      sentAt: messages.sentAt,
      readAt: messages.readAt,
      senderId: messages.senderId,
      recipientId: messages.recipientId,
      senderName: users.name,
      senderEmail: users.email,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(and(eq(messages.appointmentId, appointmentId), eq(messages.shopId, shopId)))
    .orderBy(asc(messages.sentAt));
}

export async function markAppointmentMessagesRead(input: {
  appointmentId: string;
  recipientId: string;
  shopId: string;
}) {
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.appointmentId, input.appointmentId),
        eq(messages.recipientId, input.recipientId),
        eq(messages.shopId, input.shopId),
        isNull(messages.readAt),
      ),
    );
}
