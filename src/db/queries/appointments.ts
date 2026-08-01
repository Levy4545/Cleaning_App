import { and, desc, eq, gte, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  appointmentItems,
  appointments,
  availabilitySlots,
  jobLogs,
  payments,
  type AppointmentStatus,
  type DeliveryMode,
  type ItemType,
} from "@/db/schema";
import { assertTransition } from "@/lib/appointments/transitions";

export async function listOpenSlots(shopId: string, deliveryMode?: DeliveryMode) {
  const conditions = [
    eq(availabilitySlots.shopId, shopId),
    eq(availabilitySlots.status, "OPEN"),
    gte(availabilitySlots.startsAt, new Date()),
  ];

  if (deliveryMode) {
    conditions.push(eq(availabilitySlots.deliveryMode, deliveryMode));
  }

  return db
    .select()
    .from(availabilitySlots)
    .where(and(...conditions))
    .orderBy(availabilitySlots.startsAt);
}

export async function createSlot(data: {
  shopId: string;
  startsAt: Date;
  endsAt: Date;
  deliveryMode: DeliveryMode;
  capacity: number;
}) {
  const [row] = await db.insert(availabilitySlots).values(data).returning();
  return row;
}

export async function findSlotById(id: string, shopId: string) {
  const [row] = await db
    .select()
    .from(availabilitySlots)
    .where(and(eq(availabilitySlots.id, id), eq(availabilitySlots.shopId, shopId)))
    .limit(1);
  return row ?? null;
}

export async function listAppointmentsForCustomer(customerId: string, shopId: string) {
  return db
    .select()
    .from(appointments)
    .where(and(eq(appointments.customerId, customerId), eq(appointments.shopId, shopId)))
    .orderBy(desc(appointments.createdAt));
}

export async function listAppointmentsForShop(
  shopId: string,
  status?: AppointmentStatus,
) {
  const conditions = [eq(appointments.shopId, shopId)];
  if (status) {
    conditions.push(eq(appointments.status, status));
  }
  return db
    .select()
    .from(appointments)
    .where(and(...conditions))
    .orderBy(desc(appointments.createdAt));
}

export async function findAppointmentById(id: string, shopId: string) {
  const [row] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, id), eq(appointments.shopId, shopId)))
    .limit(1);
  return row ?? null;
}

export async function createBooking(input: {
  shopId: string;
  customerId: string;
  serviceId: string;
  slotId: string;
  addressId?: string | null;
  deliveryMode: DeliveryMode;
  notes?: string;
  amount: string;
  items: Array<{
    itemType: ItemType;
    quantity: number;
    details?: Record<string, unknown>;
  }>;
  actorId: string;
}) {
  return db.transaction(async (tx) => {
    const [slot] = await tx
      .select()
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.id, input.slotId),
          eq(availabilitySlots.shopId, input.shopId),
        ),
      )
      .limit(1)
      .for("update");

    if (!slot || slot.status !== "OPEN") {
      throw new Error("Selected slot is not available");
    }

    if (slot.bookedCount >= slot.capacity) {
      throw new Error("Selected slot is full");
    }

    if (slot.deliveryMode !== input.deliveryMode) {
      throw new Error("Slot delivery mode mismatch");
    }

    const [appointment] = await tx
      .insert(appointments)
      .values({
        shopId: input.shopId,
        customerId: input.customerId,
        serviceId: input.serviceId,
        slotId: input.slotId,
        addressId: input.addressId ?? null,
        deliveryMode: input.deliveryMode,
        notes: input.notes,
        status: "PENDING",
      })
      .returning();

    if (!appointment) {
      throw new Error("Failed to create appointment");
    }

    if (input.items.length > 0) {
      await tx.insert(appointmentItems).values(
        input.items.map((item) => ({
          appointmentId: appointment.id,
          itemType: item.itemType,
          quantity: item.quantity,
          details: item.details ?? {},
        })),
      );
    }

    await tx.insert(payments).values({
      shopId: input.shopId,
      appointmentId: appointment.id,
      method: "CASH",
      status: "UNPAID",
      amount: input.amount,
    });

    const nextCount = slot.bookedCount + 1;
    await tx
      .update(availabilitySlots)
      .set({
        bookedCount: nextCount,
        status: nextCount >= slot.capacity ? "FULL" : "OPEN",
      })
      .where(eq(availabilitySlots.id, slot.id));

    await tx.insert(jobLogs).values({
      shopId: input.shopId,
      appointmentId: appointment.id,
      actorId: input.actorId,
      action: "CREATED",
      note: "Customer created booking",
    });

    return appointment;
  });
}

export async function transitionAppointment(input: {
  appointmentId: string;
  shopId: string;
  to: AppointmentStatus;
  actorId: string;
  note?: string;
  cleanerId?: string | null;
}) {
  return db.transaction(async (tx) => {
    const [appointment] = await tx
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.id, input.appointmentId),
          eq(appointments.shopId, input.shopId),
        ),
      )
      .limit(1)
      .for("update");

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    assertTransition(appointment.status, input.to);

    const [updated] = await tx
      .update(appointments)
      .set({
        status: input.to,
        cleanerId:
          input.cleanerId !== undefined ? input.cleanerId : appointment.cleanerId,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointment.id))
      .returning();

    await tx.insert(jobLogs).values({
      shopId: input.shopId,
      appointmentId: appointment.id,
      actorId: input.actorId,
      action: `STATUS_${input.to}`,
      note: input.note,
    });

    const terminalCancel =
      input.to === "CANCELLED_BY_USER" ||
      input.to === "CANCELLED_BY_ADMIN" ||
      input.to === "REJECTED";

    if (terminalCancel) {
      const [slot] = await tx
        .select()
        .from(availabilitySlots)
        .where(eq(availabilitySlots.id, appointment.slotId))
        .limit(1)
        .for("update");

      if (slot && slot.bookedCount > 0) {
        const nextCount = slot.bookedCount - 1;
        await tx
          .update(availabilitySlots)
          .set({
            bookedCount: nextCount,
            status: slot.status === "BLOCKED" ? "BLOCKED" : "OPEN",
          })
          .where(eq(availabilitySlots.id, slot.id));
      }
    }

    return updated;
  });
}

export async function addJobLog(input: {
  shopId: string;
  appointmentId: string;
  actorId?: string;
  action: string;
  note?: string;
}) {
  await db.insert(jobLogs).values(input);
}

/** Dev helper — ensure capacity math stays consistent. */
export async function countBookedOnSlot(slotId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointments)
    .where(
      and(
        eq(appointments.slotId, slotId),
        sql`${appointments.status} not in ('CANCELLED_BY_USER','CANCELLED_BY_ADMIN','REJECTED')`,
      ),
    );
  return row?.count ?? 0;
}
