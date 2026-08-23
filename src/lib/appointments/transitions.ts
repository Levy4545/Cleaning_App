import type { AppointmentStatus } from "@/db/schema";

/**
 * MVP happy path: PENDING -> APPROVED -> COMPLETED
 * Extra UML states remain valid for later (assign cleaner, etc.).
 */
const ALLOWED: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ["APPROVED", "REJECTED", "CANCELLED_BY_USER", "CANCELLED_BY_ADMIN"],
  APPROVED: ["ASSIGNED", "COMPLETED", "CANCELLED_BY_ADMIN", "CANCELLED_BY_USER"],
  ASSIGNED: ["IN_PROGRESS", "COMPLETED", "CANCELLED_BY_ADMIN"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED_BY_USER: [],
  CANCELLED_BY_ADMIN: [],
  REJECTED: [],
};

export function canTransition(
  from: AppointmentStatus,
  to: AppointmentStatus,
): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertTransition(from: AppointmentStatus, to: AppointmentStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid appointment transition: ${from} -> ${to}`);
  }
}
