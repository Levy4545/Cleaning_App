import { and, desc, eq, gte, inArray, notExists, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  addresses,
  appointmentItems,
  appointments,
  availabilitySlots,
  jobLogs,
  payments,
  reviews,
  services,
  users,
  type AppointmentStatus,
  type DeliveryMode,
} from "@/db/schema";
import { assertTransition } from "@/lib/appointments/transitions";

function activeBookingOnSlotCondition(slotIdColumn: typeof availabilitySlots.id) {
  return and(
    eq(appointments.slotId, slotIdColumn),
    sql`${appointments.status} in ('PENDING','APPROVED','ASSIGNED','IN_PROGRESS')`,
  );
}

export async function listSlotsForShop(shopId: string) {
  return db
    .select()
    .from(availabilitySlots)
    .where(eq(availabilitySlots.shopId, shopId))
    .orderBy(desc(availabilitySlots.startsAt));
}

/** Bookable windows only: OPEN and not already taken by a pending/active booking. */
export async function listOpenSlots(shopId: string) {
  return db
    .select()
    .from(availabilitySlots)
    .where(
      and(
        eq(availabilitySlots.shopId, shopId),
        eq(availabilitySlots.status, "OPEN"),
        gte(availabilitySlots.startsAt, new Date()),
        notExists(
          db
            .select({ id: appointments.id })
            .from(appointments)
            .where(activeBookingOnSlotCondition(availabilitySlots.id)),
        ),
      ),
    )
    .orderBy(availabilitySlots.startsAt);
}

/**
 * Availability windows only — delivery mode / capacity are admin decisions at approve time.
 * DB still stores legacy defaults; UI no longer exposes them.
 */
export async function createSlot(data: {
  shopId: string;
  startsAt: Date;
  endsAt: Date;
  status?: "OPEN" | "FULL" | "BLOCKED";
}) {
  const [row] = await db
    .insert(availabilitySlots)
    .values({
      shopId: data.shopId,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      // Legacy columns kept for schema compatibility; not used by calendar UX.
      deliveryMode: "DROP_OFF",
      capacity: 999,
      bookedCount: 0,
      status: data.status ?? "OPEN",
    })
    .returning();
  return row;
}

export async function updateSlotTimes(data: {
  slotId: string;
  shopId: string;
  startsAt: Date;
  endsAt: Date;
}) {
  const [row] = await db
    .update(availabilitySlots)
    .set({
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    })
    .where(
      and(eq(availabilitySlots.id, data.slotId), eq(availabilitySlots.shopId, data.shopId)),
    )
    .returning();
  return row ?? null;
}

export async function setSlotStatus(data: {
  slotId: string;
  shopId: string;
  status: "OPEN" | "BLOCKED" | "FULL";
}) {
  const [row] = await db
    .update(availabilitySlots)
    .set({ status: data.status })
    .where(
      and(eq(availabilitySlots.id, data.slotId), eq(availabilitySlots.shopId, data.shopId)),
    )
    .returning();
  return row ?? null;
}

export async function deleteSlot(slotId: string, shopId: string) {
  const active = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.slotId, slotId),
        eq(appointments.shopId, shopId),
        sql`${appointments.status} not in ('CANCELLED_BY_USER','CANCELLED_BY_ADMIN','REJECTED')`,
      ),
    )
    .limit(1);

  if (active.length > 0) {
    throw new Error("Cannot delete a slot with active bookings. Block it instead.");
  }

  await db
    .delete(availabilitySlots)
    .where(and(eq(availabilitySlots.id, slotId), eq(availabilitySlots.shopId, shopId)));
}

export async function findSlotById(id: string | null | undefined, shopId: string) {
  if (!id) return null;
  const [row] = await db
    .select()
    .from(availabilitySlots)
    .where(and(eq(availabilitySlots.id, id), eq(availabilitySlots.shopId, shopId)))
    .limit(1);
  return row ?? null;
}

/**
 * Lists calendar bookings for a shop across active and completed appointment statuses.
 *
 * @returns Appointment records with customer, service, status, delivery, note, and slot timing details, ordered by slot start time.
 */
export async function listCalendarBookings(shopId: string) {
  return db
    .select({
      appointmentId: appointments.id,
      customerId: appointments.customerId,
      serviceId: appointments.serviceId,
      status: appointments.status,
      deliveryMode: appointments.deliveryMode,
      statusNote: appointments.statusNote,
      startsAt: availabilitySlots.startsAt,
      endsAt: availabilitySlots.endsAt,
      slotId: availabilitySlots.id,
      customerEmail: users.email,
      serviceName: services.name,
    })
    .from(appointments)
    .innerJoin(availabilitySlots, eq(appointments.slotId, availabilitySlots.id))
    .leftJoin(users, eq(appointments.customerId, users.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        eq(appointments.shopId, shopId),
        sql`${appointments.status} in ('PENDING','APPROVED','ASSIGNED','IN_PROGRESS','COMPLETED')`,
      ),
    )
    .orderBy(availabilitySlots.startsAt);
}

/** @deprecated use listCalendarBookings */
export async function listPendingCalendarBookings(shopId: string) {
  return listCalendarBookings(shopId).then((rows) =>
    rows.filter((row) => row.status === "PENDING"),
  );
}

export async function listAppointmentsForCustomer(customerId: string, shopId: string) {
  return db
    .select()
    .from(appointments)
    .where(and(eq(appointments.customerId, customerId), eq(appointments.shopId, shopId)))
    .orderBy(desc(appointments.createdAt));
}

/** Customer dashboard + /appointments: appointment + service + slot + review in one round trip. */
export async function listCustomerAppointmentRows(customerId: string, shopId: string) {
  return db
    .select({
      id: appointments.id,
      status: appointments.status,
      deliveryMode: appointments.deliveryMode,
      createdAt: appointments.createdAt,
      requestedDate: appointments.requestedDate,
      statusNote: appointments.statusNote,
      serviceId: appointments.serviceId,
      slotId: appointments.slotId,
      serviceName: services.name,
      servicePriceMin: services.priceMin,
      servicePriceMax: services.priceMax,
      slotStartsAt: availabilitySlots.startsAt,
      slotEndsAt: availabilitySlots.endsAt,
      reviewRating: reviews.rating,
      reviewComment: reviews.comment,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(availabilitySlots, eq(appointments.slotId, availabilitySlots.id))
    .leftJoin(reviews, eq(reviews.appointmentId, appointments.id))
    .where(and(eq(appointments.customerId, customerId), eq(appointments.shopId, shopId)))
    .orderBy(desc(appointments.createdAt));
}

/** Admin overview: appointment + service + customer + slot in one round trip. */
export async function listAdminOverviewAppointments(shopId: string) {
  return db
    .select({
      id: appointments.id,
      status: appointments.status,
      deliveryMode: appointments.deliveryMode,
      requestedDate: appointments.requestedDate,
      serviceId: appointments.serviceId,
      serviceName: services.name,
      servicePriceMin: services.priceMin,
      customerName: users.name,
      customerEmail: users.email,
      slotStartsAt: availabilitySlots.startsAt,
      slotEndsAt: availabilitySlots.endsAt,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(users, eq(appointments.customerId, users.id))
    .leftJoin(availabilitySlots, eq(appointments.slotId, availabilitySlots.id))
    .where(eq(appointments.shopId, shopId))
    .orderBy(desc(appointments.createdAt));
}

/**
 * Lists appointments for a shop, optionally filtered by status.
 *
 * @param shopId - The shop identifier
 * @param status - The appointment status used to filter results
 * @returns The shop's appointments, ordered from newest to oldest
 */
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

/**
 * Lists a shop's appointments with customer, service, slot, payment, address, review, and item details.
 *
 * @param shopId - The shop whose appointments to retrieve
 * @returns Appointment records ordered from newest to oldest, each including its associated items
 */
export async function listShopAppointmentsInbox(shopId: string) {
  const rows = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      deliveryMode: appointments.deliveryMode,
      notes: appointments.notes,
      statusNote: appointments.statusNote,
      createdAt: appointments.createdAt,
      customerId: appointments.customerId,
      serviceName: services.name,
      servicePriceMin: services.priceMin,
      servicePriceMax: services.priceMax,
      customerName: users.name,
      customerEmail: users.email,
      customerPhone: users.phone,
      requestedDate: appointments.requestedDate,
      slotStartsAt: availabilitySlots.startsAt,
      slotEndsAt: availabilitySlots.endsAt,
      paymentAmount: payments.amount,
      paymentStatus: payments.status,
      addressLine1: addresses.line1,
      addressCity: addresses.city,
      addressPostalCode: addresses.postalCode,
      reviewRating: reviews.rating,
      reviewComment: reviews.comment,
      reviewCreatedAt: reviews.createdAt,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(users, eq(appointments.customerId, users.id))
    .leftJoin(availabilitySlots, eq(appointments.slotId, availabilitySlots.id))
    .leftJoin(payments, eq(payments.appointmentId, appointments.id))
    .leftJoin(addresses, eq(appointments.addressId, addresses.id))
    .leftJoin(reviews, eq(reviews.appointmentId, appointments.id))
    .where(eq(appointments.shopId, shopId))
    .orderBy(desc(appointments.createdAt));

  const ids = rows.map((row) => row.id);
  const items =
    ids.length === 0
      ? []
      : await db
          .select()
          .from(appointmentItems)
          .where(inArray(appointmentItems.appointmentId, ids));

  const itemsByAppointment = new Map<string, typeof items>();
  for (const item of items) {
    const list = itemsByAppointment.get(item.appointmentId) ?? [];
    list.push(item);
    itemsByAppointment.set(item.appointmentId, list);
  }

  return rows.map((row) => ({
    ...row,
    items: itemsByAppointment.get(row.id) ?? [],
  }));
}

/**
 * Finds an appointment belonging to a shop by its identifier.
 *
 * @param id - The appointment identifier
 * @param shopId - The shop identifier
 * @returns The matching appointment, or `null` if none exists
 */
export async function findAppointmentById(id: string, shopId: string) {
  const [row] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, id), eq(appointments.shopId, shopId)))
    .limit(1);
  return row ?? null;
}

export async function listItemsForAppointment(appointmentId: string) {
  return db
    .select()
    .from(appointmentItems)
    .where(eq(appointmentItems.appointmentId, appointmentId));
}

export async function findPaymentForAppointment(appointmentId: string, shopId: string) {
  const [row] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.appointmentId, appointmentId), eq(payments.shopId, shopId)))
    .limit(1);
  return row ?? null;
}

/**
 * Creates a pending appointment and reserves its availability slot.
 *
 * A provided one-off address is stored for the booking without changing the customer's default address.
 *
 * @param input - Booking details, including the shop, customer, service, slot, payment amount, and appointment items
 * @returns The newly created pending appointment
 * @throws Error if the selected slot is unavailable, already booked, or the appointment cannot be created
 */
export async function createBooking(input: {
  shopId: string;
  customerId: string;
  serviceId: string;
  slotId?: string | null;
  requestedDate?: string | null;
  addressId?: string | null;
  address?: {
    line1: string;
    city: string;
    postalCode?: string;
    label?: string;
  } | null;
  deliveryMode: DeliveryMode;
  notes?: string;
  amount: string;
  items: Array<{
    itemType?: string | null;
    quantity: number;
    details?: Record<string, unknown>;
  }>;
  actorId: string;
}) {
  return db.transaction(async (tx) => {
    let slot: typeof availabilitySlots.$inferSelect | null = null;

    if (input.slotId) {
      const [locked] = await tx
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

      if (!locked || locked.status !== "OPEN") {
        throw new Error("Selected slot is not available");
      }

      const [existingActive] = await tx
        .select({ id: appointments.id })
        .from(appointments)
        .where(
          and(
            eq(appointments.slotId, locked.id),
            sql`${appointments.status} in ('PENDING','APPROVED','ASSIGNED','IN_PROGRESS')`,
          ),
        )
        .limit(1);

      if (existingActive) {
        throw new Error("This time window was just booked by someone else. Pick another slot.");
      }

      slot = locked;
    }

    let addressId = input.addressId ?? null;
    if (input.address) {
      // One-off booking address — do not flip the customer's default address.
      const [address] = await tx
        .insert(addresses)
        .values({
          userId: input.customerId,
          shopId: input.shopId,
          line1: input.address.line1,
          city: input.address.city,
          postalCode: input.address.postalCode,
          label: input.address.label ?? "Booking address",
          isDefault: false,
        })
        .returning();
      addressId = address?.id ?? null;
    }

    const [appointment] = await tx
      .insert(appointments)
      .values({
        shopId: input.shopId,
        customerId: input.customerId,
        serviceId: input.serviceId,
        slotId: slot?.id ?? null,
        requestedDate: input.requestedDate ?? null,
        addressId,
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

    if (slot) {
      // Hold the window so other clients cannot book it while pending/active.
      await tx
        .update(availabilitySlots)
        .set({
          bookedCount: slot.bookedCount + 1,
          status: "FULL",
        })
        .where(eq(availabilitySlots.id, slot.id));
    }

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
  statusNote?: string;
  cleanerId?: string | null;
  deliveryMode?: DeliveryMode;
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
        deliveryMode: input.deliveryMode ?? appointment.deliveryMode,
        statusNote:
          input.statusNote !== undefined ? input.statusNote : appointment.statusNote,
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

    if (terminalCancel && appointment.slotId) {
      const [slot] = await tx
        .select()
        .from(availabilitySlots)
        .where(eq(availabilitySlots.id, appointment.slotId))
        .limit(1)
        .for("update");

      if (slot) {
        const [stillActive] = await tx
          .select({ id: appointments.id })
          .from(appointments)
          .where(
            and(
              eq(appointments.slotId, slot.id),
              sql`${appointments.id} <> ${appointment.id}`,
              sql`${appointments.status} in ('PENDING','APPROVED','ASSIGNED','IN_PROGRESS')`,
            ),
          )
          .limit(1);

        const nextCount = Math.max(0, slot.bookedCount - 1);

        await tx
          .update(availabilitySlots)
          .set({
            bookedCount: nextCount,
            // Free the window again only if nothing else is holding it.
            status:
              slot.status === "BLOCKED"
                ? "BLOCKED"
                : stillActive
                  ? "FULL"
                  : "OPEN",
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
