"use server";

import { revalidatePath } from "next/cache";

import { env } from "@/env";
import { requireAdmin, requireUser } from "@/lib/auth/guards";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import {
  createBooking,
  findAppointmentById,
  transitionAppointment,
} from "@/db/queries/appointments";
import { findServiceById } from "@/db/queries/services";
import { findUserById, listUsersByRole } from "@/db/queries/users";
import { createAndSendNotification } from "@/db/queries/notifications";
import { createReview, findReviewByAppointment } from "@/db/queries/reviews";
import {
  createBookingSchema,
  approveAppointmentSchema,
  rejectAppointmentSchema,
  reviewSchema,
  type CreateBookingInput,
  type ApproveAppointmentInput,
  type RejectAppointmentInput,
  type ReviewInput,
} from "@/validators/booking";
import type { ActionResult } from "@/types";

async function notifyUser(input: {
  shopId: string;
  userId: string;
  subject: string;
  body: string;
}) {
  const user = await findUserById(input.userId);
  if (!user) {
    return;
  }

  const channel = env.NOTIFY_CHANNEL;
  const to = channel === "SMS" ? (user.phone ?? user.email) : user.email;

  if (!to) {
    return;
  }

  await createAndSendNotification({
    shopId: input.shopId,
    userId: input.userId,
    channel,
    to,
    subject: input.subject,
    body: input.body,
  });
}

async function notifyAdmins(shopId: string, subject: string, body: string) {
  const admins = await listUsersByRole("ADMIN");
  await Promise.all(
    admins.map((admin) =>
      notifyUser({
        shopId,
        userId: admin.id,
        subject,
        body,
      }),
    ),
  );
}

export async function bookAppointment(
  input: CreateBookingInput,
): Promise<ActionResult<{ appointmentId: string }>> {
  const user = await requireUser();
  const parsed = createBookingSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const shopId = await getDefaultShopId();
  const service = await findServiceById(parsed.data.serviceId, shopId);

  if (!service || !service.isActive) {
    return { success: false, error: "Service not found" };
  }

  const preferredMode = parsed.data.preferredDeliveryMode;

  if (!service.deliveryModes.includes(preferredMode)) {
    return { success: false, error: "Service does not support this delivery mode" };
  }

  let address:
    | {
        line1: string;
        city: string;
        postalCode?: string;
        label?: string;
      }
    | null = null;

  if (preferredMode === "ON_SITE") {
    if (!parsed.data.addressLine1?.trim() || !parsed.data.addressCity?.trim()) {
      return { success: false, error: "Address is required for on-site preference" };
    }

    address = {
      line1: parsed.data.addressLine1.trim(),
      city: parsed.data.addressCity.trim(),
      postalCode: parsed.data.addressPostalCode?.trim(),
      label: "Booking address",
    };
  }

  try {
    const appointment = await createBooking({
      shopId,
      customerId: user.id,
      serviceId: service.id,
      slotId: parsed.data.slotId,
      address,
      deliveryMode: preferredMode,
      notes: parsed.data.notes,
      amount: service.basePrice,
      actorId: user.id,
      items: [
        {
          itemType: parsed.data.itemType,
          quantity: parsed.data.quantity,
          details: parsed.data.details ? { note: parsed.data.details } : {},
        },
      ],
    });

    await notifyAdmins(
      shopId,
      "New booking request",
      `New booking from ${user.email} (preferred: ${preferredMode}). Appointment ID: ${appointment.id}`,
    );

    revalidatePath("/appointments");
    revalidatePath("/admin/appointments");
    revalidatePath("/book");
    revalidatePath("/admin/calendar");

    return { success: true, data: { appointmentId: appointment.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not create booking",
    };
  }
}

export async function approveAppointment(
  input: ApproveAppointmentInput,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = approveAppointmentSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const shopId = await getDefaultShopId();

  try {
    const updated = await transitionAppointment({
      appointmentId: parsed.data.appointmentId,
      shopId,
      to: "APPROVED",
      actorId: admin.id,
      note: parsed.data.adminNote ?? `Approved as ${parsed.data.deliveryMode}`,
      deliveryMode: parsed.data.deliveryMode,
    });

    if (updated) {
      await notifyUser({
        shopId,
        userId: updated.customerId,
        subject: "Booking approved",
        body: `Your cleaning appointment was approved (${parsed.data.deliveryMode.replace("_", "-")}).`,
      });
    }

    revalidatePath("/admin/appointments");
    revalidatePath("/appointments");
    revalidatePath("/admin/calendar");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not approve",
    };
  }
}

export async function rejectAppointment(
  input: RejectAppointmentInput,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = rejectAppointmentSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const shopId = await getDefaultShopId();

  try {
    const updated = await transitionAppointment({
      appointmentId: parsed.data.appointmentId,
      shopId,
      to: "REJECTED",
      actorId: admin.id,
      note: `Rejected: ${parsed.data.reason}`,
      statusNote: parsed.data.reason,
    });

    if (updated) {
      await notifyUser({
        shopId,
        userId: updated.customerId,
        subject: "Booking rejected",
        body: `Your cleaning appointment was rejected.\n\nReason: ${parsed.data.reason}`,
      });
    }

    revalidatePath("/admin/appointments");
    revalidatePath("/appointments");
    revalidatePath("/book");
    revalidatePath("/admin/calendar");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not reject",
    };
  }
}

export async function cancelAppointment(appointmentId: string): Promise<ActionResult> {
  const user = await requireUser();
  const shopId = await getDefaultShopId();

  const existing = await findAppointmentById(appointmentId, shopId);
  if (!existing || existing.customerId !== user.id) {
    return { success: false, error: "Appointment not found" };
  }

  if (existing.status !== "PENDING" && existing.status !== "APPROVED") {
    return { success: false, error: "Only pending or approved bookings can be cancelled" };
  }

  try {
    const updated = await transitionAppointment({
      appointmentId,
      shopId,
      to: "CANCELLED_BY_USER",
      actorId: user.id,
      note: "Cancelled by customer",
    });

    if (updated) {
      await notifyAdmins(
        shopId,
        "Booking cancelled",
        `Customer ${user.email} cancelled appointment ${updated.id}.`,
      );
    }

    revalidatePath("/appointments");
    revalidatePath("/admin/appointments");
    revalidatePath("/book");
    revalidatePath("/admin/calendar");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not cancel",
    };
  }
}

export async function completeAppointment(appointmentId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const shopId = await getDefaultShopId();

  try {
    const existing = await findAppointmentById(appointmentId, shopId);
    if (!existing) {
      return { success: false, error: "Appointment not found" };
    }

    // MVP shortcut: allow APPROVED -> COMPLETED (and ASSIGNED/IN_PROGRESS too via helper)
    const updated = await transitionAppointment({
      appointmentId,
      shopId,
      to: "COMPLETED",
      actorId: admin.id,
      note: "Marked completed by admin",
    });

    if (updated) {
      await notifyUser({
        shopId,
        userId: updated.customerId,
        subject: "Service completed",
        body: `Your cleaning appointment ${updated.id} is complete. You can leave a review.`,
      });
    }

    revalidatePath("/admin/appointments");
    revalidatePath("/appointments");
    revalidatePath("/admin/calendar");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not complete",
    };
  }
}

export async function submitReview(input: ReviewInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = reviewSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const shopId = await getDefaultShopId();
  const appointment = await findAppointmentById(parsed.data.appointmentId, shopId);

  if (!appointment || appointment.customerId !== user.id) {
    return { success: false, error: "Appointment not found" };
  }

  if (appointment.status !== "COMPLETED") {
    return { success: false, error: "You can only review completed appointments" };
  }

  const existing = await findReviewByAppointment(appointment.id, shopId);
  if (existing) {
    return { success: false, error: "You already left a review" };
  }

  await createReview({
    shopId,
    appointmentId: appointment.id,
    customerId: user.id,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  });

  revalidatePath("/appointments");
  return { success: true };
}
