import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { addresses } from "@/db/schema";

export async function listAddressesForUser(userId: string, shopId: string) {
  return db
    .select()
    .from(addresses)
    .where(and(eq(addresses.userId, userId), eq(addresses.shopId, shopId)))
    .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
}

export async function createAddress(data: {
  userId: string;
  shopId: string;
  label?: string;
  line1: string;
  city: string;
  postalCode?: string;
  isDefault?: boolean;
}) {
  if (data.isDefault) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(and(eq(addresses.userId, data.userId), eq(addresses.shopId, data.shopId)));
  }

  const [row] = await db.insert(addresses).values(data).returning();
  return row;
}

export async function findAddressById(id: string, shopId: string) {
  const [row] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.shopId, shopId)))
    .limit(1);
  return row ?? null;
}
