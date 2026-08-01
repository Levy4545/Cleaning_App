import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { serviceCategories, services } from "@/db/schema";

/**
 * Lists all active services for a shop in ascending name order.
 *
 * @param shopId - The shop identifier
 * @returns The shop's active services ordered by name
 */
export async function listActiveServices(shopId: string) {
  return db
    .select()
    .from(services)
    .where(and(eq(services.shopId, shopId), eq(services.isActive, true)))
    .orderBy(asc(services.name));
}

/**
 * Lists all service categories belonging to a shop.
 *
 * @param shopId - The shop identifier
 * @returns The shop's service categories
 */
export async function listCategories(shopId: string) {
  return db.select().from(serviceCategories).where(eq(serviceCategories.shopId, shopId));
}

export async function findServiceById(id: string, shopId: string) {
  const [row] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, id), eq(services.shopId, shopId)))
    .limit(1);
  return row ?? null;
}

export async function createCategory(data: {
  shopId: string;
  name: string;
  slug: string;
}) {
  const [row] = await db.insert(serviceCategories).values(data).returning();
  return row;
}

export async function createService(data: {
  shopId: string;
  categoryId: string;
  name: string;
  description?: string;
  deliveryModes: string[];
  durationMinutes: number;
  basePrice: string;
  isActive?: boolean;
}) {
  const [row] = await db.insert(services).values(data).returning();
  return row;
}
