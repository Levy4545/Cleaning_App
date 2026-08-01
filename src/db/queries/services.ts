import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { serviceCategories, services } from "@/db/schema";

export async function listActiveServices(shopId: string) {
  return db
    .select()
    .from(services)
    .where(and(eq(services.shopId, shopId), eq(services.isActive, true)));
}

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
