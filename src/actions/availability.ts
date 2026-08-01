"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import {
  createSlot,
  deleteSlot,
  setSlotStatus,
  updateSlotTimes,
} from "@/db/queries/appointments";
import {
  createSlotSchema,
  updateSlotSchema,
  type CreateSlotInput,
  type UpdateSlotInput,
} from "@/validators/booking";
import type { ActionResult } from "@/types";

function parseRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false as const, error: "Invalid date/time" };
  }
  if (end <= start) {
    return { ok: false as const, error: "End time must be after start time" };
  }
  return { ok: true as const, start, end };
}

export async function createAvailabilitySlot(
  input: CreateSlotInput,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = createSlotSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const range = parseRange(parsed.data.startsAt, parsed.data.endsAt);
  if (!range.ok) {
    return { success: false, error: range.error };
  }

  const shopId = await getDefaultShopId();
  const slot = await createSlot({
    shopId,
    startsAt: range.start,
    endsAt: range.end,
    status: parsed.data.status,
  });

  revalidatePath("/admin/calendar");
  revalidatePath("/book");
  return { success: true, data: { id: slot!.id } };
}

export async function updateAvailabilitySlot(
  input: UpdateSlotInput,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updateSlotSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const range = parseRange(parsed.data.startsAt, parsed.data.endsAt);
  if (!range.ok) {
    return { success: false, error: range.error };
  }

  const shopId = await getDefaultShopId();
  const updated = await updateSlotTimes({
    slotId: parsed.data.slotId,
    shopId,
    startsAt: range.start,
    endsAt: range.end,
  });

  if (!updated) {
    return { success: false, error: "Slot not found" };
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/book");
  return { success: true };
}

export async function setAvailabilitySlotStatus(input: {
  slotId: string;
  status: "OPEN" | "FULL" | "BLOCKED";
}): Promise<ActionResult> {
  await requireAdmin();
  const shopId = await getDefaultShopId();
  const updated = await setSlotStatus({
    slotId: input.slotId,
    shopId,
    status: input.status,
  });
  if (!updated) {
    return { success: false, error: "Slot not found" };
  }
  revalidatePath("/admin/calendar");
  revalidatePath("/book");
  return { success: true };
}

export async function deleteAvailabilitySlot(slotId: string): Promise<ActionResult> {
  await requireAdmin();
  const shopId = await getDefaultShopId();

  try {
    await deleteSlot(slotId, shopId);
    revalidatePath("/admin/calendar");
    revalidatePath("/book");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not delete slot",
    };
  }
}
