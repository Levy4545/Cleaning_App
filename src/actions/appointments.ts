"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin, requireUser } from "@/lib/auth/guards";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import {
  createBooking,
  findAppointmentById,
  transitionAppointment,
} from "@/db/queries/appointments";
import { findServiceById } from "@/db/queries/services";
import { createReview, findReviewByAppointment } from "@/db/queries/reviews";
import { notifyAdminsEvent, notifyUserEvent } from "@/lib/notifications/dispatch";
import { formatDeliveryMode, formatPriceRange } from "@/lib/format";
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

/**
 * Creates an appointment booking for the authenticated user.
 *
 * Validates the selected service and delivery mode, and requires an address for
 * on-site bookings.
 *
 * @param input - The requested service, time slot, delivery mode, and booking details
 * @returns The created appointment ID or an error result
 */
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

  const options = service.itemTypeOptions ?? [];
  const selectedItemType = parsed.data.itemType?.trim().toLowerCase();

  if (options.length > 0) {
    if (!selectedItemType || !options.map((option) => option.toLowerCase()).includes(selectedItemType)) {
      return { success: false, error: "Pick a valid item type for this service" };
    }
  } else if (selectedItemType) {
    return { success: false, error: "This service does not use item types" };
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
      // Cash quote is a range; store the lower bound on the unpaid payment row.
      amount: service.priceMin,
      actorId: user.id,
      items: [
        {
          itemType: selectedItemType ?? null,
          quantity: parsed.data.quantity,
          details: parsed.data.details ? { note: parsed.data.details } : {},
        },
      ],
    });

    const priceLabel = formatPriceRange(service.priceMin, service.priceMax);
    await notifyAdminsEvent(shopId, {
      type: "BOOKING_CREATED",
      subject: "New booking request",
      body: `${user.name ?? user.email} requested ${service.name} (${formatDeliveryMode(preferredMode)}).\nQuote range: ${priceLabel}.\nOpen the appointments inbox to approve or reject.`,
      appointmentId: appointment.id,
      href: "/admin/appointments",
    });

    revalidatePath("/appointments");
    revalidatePath("/admin/appointments");
    revalidatePath("/book");
    revalidatePath("/admin/calendar");
    revalidatePath("/notifications");

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
    const existing = await findAppointmentById(parsed.data.appointmentId, shopId);
    if (!existing) {
      return { success: false, error: "Appointment not found" };
    }

    const service = await findServiceById(existing.serviceId, shopId);
    const priceLabel = formatPriceRange(
      service?.priceMin ?? "0",
      service?.priceMax ?? service?.priceMin ?? "0",
    );

    const updated = await transitionAppointment({
      appointmentId: parsed.data.appointmentId,
      shopId,
      to: "APPROVED",
      actorId: admin.id,
      note: parsed.data.adminNote ?? `Approved as ${parsed.data.deliveryMode}`,
      deliveryMode: parsed.data.deliveryMode,
    });

    if (updated) {
      await notifyUserEvent({
        shopId,
        userId: updated.customerId,
        type: "BOOKING_APPROVED",
        subject: "Booking approved",
        body: `Your ${service?.name ?? "cleaning"} appointment was approved.\n\nDelivery: ${formatDeliveryMode(parsed.data.deliveryMode)}\nPrice: ${priceLabel} (cash on completion)\n\nSee your appointments for details.`,
        appointmentId: updated.id,
        href: "/appointments",
      });
    }

    revalidatePath("/admin/appointments");
    revalidatePath("/appointments");
    revalidatePath("/admin/calendar");
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not approve",
    };
  }
}

/**
 * Rejects an appointment and notifies the customer of the rejection reason.
 *
 * @param input - The appointment identifier and rejection reason.
 * @returns An action result indicating whether the appointment was rejected, with an error message when unsuccessful.
 */
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
      await notifyUserEvent({
        shopId,
        userId: updated.customerId,
        type: "BOOKING_REJECTED",
        subject: "Booking cancelled by shop",
        body: `Your cleaning appointment was not accepted and has been cancelled.\n\nReason: ${parsed.data.reason}`,
        appointmentId: updated.id,
        href: "/appointments",
      });
    }

    revalidatePath("/admin/appointments");
    revalidatePath("/appointments");
    revalidatePath("/book");
    revalidatePath("/admin/calendar");
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not reject",
    };
  }
}

/**
 * Cancels the authenticated customer's pending or approved appointment.
 *
 * @returns A success result when the appointment is cancelled, or an error result when it cannot be cancelled.
 */
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
    const service = await findServiceById(existing.serviceId, shopId);
    const updated = await transitionAppointment({
      appointmentId,
      shopId,
      to: "CANCELLED_BY_USER",
      actorId: user.id,
      note: "Cancelled by customer",
    });

    if (updated) {
      await notifyAdminsEvent(shopId, {
        type: "BOOKING_CANCELLED",
        subject: "Booking cancelled by customer",
        body: `${user.name ?? user.email} cancelled their ${service?.name ?? "cleaning"} booking.`,
        appointmentId: updated.id,
        href: "/admin/appointments",
      });
    }

    revalidatePath("/appointments");
    revalidatePath("/admin/appointments");
    revalidatePath("/book");
    revalidatePath("/admin/calendar");
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not cancel",
    };
  }
}

/**
 * Admin cancels a pending/approved booking and notifies the customer.
 */
export async function cancelAppointmentByAdmin(
  appointmentId: string,
  reason?: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const shopId = await getDefaultShopId();

  const existing = await findAppointmentById(appointmentId, shopId);
  if (!existing) {
    return { success: false, error: "Appointment not found" };
  }

  if (existing.status !== "PENDING" && existing.status !== "APPROVED") {
    return { success: false, error: "Only pending or approved bookings can be cancelled" };
  }

  const note = reason?.trim() || "Cancelled by shop";

  try {
    const service = await findServiceById(existing.serviceId, shopId);
    const updated = await transitionAppointment({
      appointmentId,
      shopId,
      to: "CANCELLED_BY_ADMIN",
      actorId: admin.id,
      note,
      statusNote: note,
    });

    if (updated) {
      await notifyUserEvent({
        shopId,
        userId: updated.customerId,
        type: "BOOKING_CANCELLED",
        subject: "Booking cancelled",
        body: `Your ${service?.name ?? "cleaning"} appointment was cancelled by the shop.\n\n${note}`,
        appointmentId: updated.id,
        href: "/appointments",
      });
    }

    revalidatePath("/admin/appointments");
    revalidatePath("/appointments");
    revalidatePath("/book");
    revalidatePath("/admin/calendar");
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not cancel",
    };
  }
}

/**
 * Marks an appointment as completed and notifies the customer that a review is available.
 *
 * @param appointmentId - The appointment to complete
 * @returns A successful result or an error describing why completion failed
 */
export async function completeAppointment(appointmentId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const shopId = await getDefaultShopId();

  try {
    const existing = await findAppointmentById(appointmentId, shopId);
    if (!existing) {
      return { success: false, error: "Appointment not found" };
    }

    const service = await findServiceById(existing.serviceId, shopId);

    // MVP shortcut: allow APPROVED -> COMPLETED (and ASSIGNED/IN_PROGRESS too via helper)
    const updated = await transitionAppointment({
      appointmentId,
      shopId,
      to: "COMPLETED",
      actorId: admin.id,
      note: "Marked completed by admin",
    });

    if (updated) {
      const pickupLine =
        updated.deliveryMode === "DROP_OFF"
          ? "Your items are ready for pickup at the shop."
          : "The on-site job is finished.";

      await notifyUserEvent({
        shopId,
        userId: updated.customerId,
        type: "BOOKING_COMPLETED",
        subject: "Service completed — ready for you",
        body: `Your ${service?.name ?? "cleaning"} appointment is complete.\n\n${pickupLine}\nYou can leave a review from My appointments.`,
        appointmentId: updated.id,
        href: "/appointments",
      });
    }

    revalidatePath("/admin/appointments");
    revalidatePath("/appointments");
    revalidatePath("/admin/calendar");
    revalidatePath("/notifications");
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
