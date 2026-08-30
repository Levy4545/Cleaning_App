"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import {
  deleteAvailableDay,
  setAvailableDayStatus,
  upsertAvailableDay,
} from "@/db/queries/available-days";
import type { ActionResult } from "@/types";

function revalidateDays() {
  revalidatePath("/admin");
  revalidatePath("/book");
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function markAvailableDay(input: {
  day: string;
  status?: "OPEN" | "BLOCKED";
}): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  if (!isIsoDate(input.day)) {
    return { success: false, error: "Pick a valid date" };
  }

  const shopId = await getDefaultShopId();
  const row = await upsertAvailableDay({
    shopId,
    day: input.day,
    status: input.status ?? "OPEN",
  });

  if (!row) {
    return { success: false, error: "Could not save the day" };
  }

  revalidateDays();
  return { success: true, data: { id: row.id } };
}

export async function setDayOpen(input: {
  dayId: string;
  isOpen: boolean;
}): Promise<ActionResult> {
  await requireAdmin();
  if (!input.dayId) {
    return { success: false, error: "Day is required" };
  }

  const shopId = await getDefaultShopId();
  const updated = await setAvailableDayStatus({
    dayId: input.dayId,
    shopId,
    status: input.isOpen ? "OPEN" : "BLOCKED",
  });

  if (!updated) {
    return { success: false, error: "Day not found" };
  }

  revalidateDays();
  return { success: true };
}

export async function removeAvailableDay(dayId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!dayId) {
    return { success: false, error: "Day is required" };
  }

  const shopId = await getDefaultShopId();
  const deleted = await deleteAvailableDay(dayId, shopId);
  if (!deleted) {
    return { success: false, error: "Day not found" };
  }

  revalidateDays();
  return { success: true };
}
