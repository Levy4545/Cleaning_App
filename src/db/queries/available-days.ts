import { and, asc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import { availableDays } from "@/db/schema";

export type DayStatus = "OPEN" | "BLOCKED";

function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export async function listAvailableDays(shopId: string) {
  return db
    .select()
    .from(availableDays)
    .where(eq(availableDays.shopId, shopId))
    .orderBy(asc(availableDays.day));
}

export async function listOpenAvailableDays(shopId: string) {
  return db
    .select()
    .from(availableDays)
    .where(
      and(
        eq(availableDays.shopId, shopId),
        eq(availableDays.status, "OPEN"),
        gte(availableDays.day, todayIso()),
      ),
    )
    .orderBy(asc(availableDays.day));
}

export async function findAvailableDay(shopId: string, day: string) {
  const [row] = await db
    .select()
    .from(availableDays)
    .where(and(eq(availableDays.shopId, shopId), eq(availableDays.day, day)))
    .limit(1);
  return row ?? null;
}

export async function upsertAvailableDay(data: {
  shopId: string;
  day: string;
  status: DayStatus;
}) {
  const existing = await findAvailableDay(data.shopId, data.day);
  if (existing) {
    const [row] = await db
      .update(availableDays)
      .set({ status: data.status })
      .where(eq(availableDays.id, existing.id))
      .returning();
    return row ?? null;
  }

  const [row] = await db.insert(availableDays).values(data).returning();
  return row ?? null;
}

export async function setAvailableDayStatus(data: {
  dayId: string;
  shopId: string;
  status: DayStatus;
}) {
  const [row] = await db
    .update(availableDays)
    .set({ status: data.status })
    .where(and(eq(availableDays.id, data.dayId), eq(availableDays.shopId, data.shopId)))
    .returning();
  return row ?? null;
}

export async function deleteAvailableDay(dayId: string, shopId: string) {
  const [row] = await db
    .delete(availableDays)
    .where(and(eq(availableDays.id, dayId), eq(availableDays.shopId, shopId)))
    .returning();
  return row ?? null;
}
