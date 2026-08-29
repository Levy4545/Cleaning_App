import { z } from "zod";

export const createSlotSchema = z.object({
  startsAt: z.string().min(1, "Start time is required"),
  endsAt: z.string().min(1, "End time is required"),
  /** OPEN = free, FULL = occupied, BLOCKED = unavailable */
  status: z.enum(["OPEN", "FULL", "BLOCKED"]).default("OPEN"),
});

export const updateSlotSchema = z.object({
  slotId: z.string().uuid(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
});

export const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  slotId: z.string().uuid().optional(),
  requestedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date")
    .optional(),
  /** Customer preference — admin confirms/overrides on approve. */
  preferredDeliveryMode: z.enum(["ON_SITE", "DROP_OFF"]).default("DROP_OFF"),
  /** Selected from the service's itemTypeOptions when that list is non-empty. */
  itemType: z.string().trim().min(1).max(40).optional(),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  notes: z.string().max(1000).optional(),
  details: z.string().max(2000).optional(),
  addressLine1: z.string().max(200).optional(),
  addressCity: z.string().max(100).optional(),
  addressPostalCode: z.string().max(30).optional(),
});

export const approveAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  deliveryMode: z.enum(["ON_SITE", "DROP_OFF"]),
  adminNote: z.string().max(1000).optional(),
});

export const rejectAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  reason: z
    .string()
    .trim()
    .min(3, "Please provide a reason for the client")
    .max(1000),
});

export const reviewSchema = z.object({
  appointmentId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type CreateSlotInput = z.infer<typeof createSlotSchema>;
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ApproveAppointmentInput = z.infer<typeof approveAppointmentSchema>;
export type RejectAppointmentInput = z.infer<typeof rejectAppointmentSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
