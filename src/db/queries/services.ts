import { and, asc, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { serviceCategories, serviceTranslations, services } from "@/db/schema";

export type ServiceLocale = "ro" | "hu";

export type ServiceTranslationInput = {
  locale: ServiceLocale;
  name: string;
  description: string | null;
};

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
 * Lists every service for a shop, including inactive ones.
 *
 * @param shopId - The shop identifier
 * @returns All shop services ordered by name
 */
export async function listAllServices(shopId: string) {
  return db
    .select()
    .from(services)
    .where(eq(services.shopId, shopId))
    .orderBy(asc(services.name));
}

/**
 * Lists all service categories belonging to a shop.
 *
 * @param shopId - The shop identifier
 * @returns The shop's service categories ordered by name
 */
export async function listCategories(shopId: string) {
  return db
    .select()
    .from(serviceCategories)
    .where(eq(serviceCategories.shopId, shopId))
    .orderBy(asc(serviceCategories.name));
}

export async function findServiceById(id: string, shopId: string) {
  const [row] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, id), eq(services.shopId, shopId)))
    .limit(1);
  return row ?? null;
}

export async function findCategoryById(id: string, shopId: string) {
  const [row] = await db
    .select()
    .from(serviceCategories)
    .where(and(eq(serviceCategories.id, id), eq(serviceCategories.shopId, shopId)))
    .limit(1);
  return row ?? null;
}

export async function findCategoryBySlug(shopId: string, slug: string) {
  const [row] = await db
    .select()
    .from(serviceCategories)
    .where(and(eq(serviceCategories.shopId, shopId), eq(serviceCategories.slug, slug)))
    .limit(1);
  return row ?? null;
}

/**
 * Counts services that belong to a category within a shop.
 *
 * @param categoryId - The category identifier
 * @param shopId - The shop identifier
 * @returns The number of services in the category
 */
export async function countServicesInCategory(categoryId: string, shopId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(services)
    .where(and(eq(services.categoryId, categoryId), eq(services.shopId, shopId)));
  return Number(row?.value ?? 0);
}

export async function createCategory(data: {
  shopId: string;
  name: string;
  slug: string;
}) {
  const [row] = await db.insert(serviceCategories).values(data).returning();
  return row;
}

export async function updateCategory(data: {
  categoryId: string;
  shopId: string;
  name: string;
  slug: string;
}) {
  const [row] = await db
    .update(serviceCategories)
    .set({ name: data.name, slug: data.slug })
    .where(
      and(eq(serviceCategories.id, data.categoryId), eq(serviceCategories.shopId, data.shopId)),
    )
    .returning();
  return row ?? null;
}

/**
 * Deletes a category when it has no services.
 *
 * @param categoryId - The category to delete
 * @param shopId - The shop identifier
 * @returns The deleted category, or `null` when it was not found
 */
export async function deleteCategory(categoryId: string, shopId: string) {
  const [row] = await db
    .delete(serviceCategories)
    .where(
      and(eq(serviceCategories.id, categoryId), eq(serviceCategories.shopId, shopId)),
    )
    .returning();
  return row ?? null;
}

export async function listServiceTranslationsForShop(shopId: string) {
  return db
    .select({
      serviceId: serviceTranslations.serviceId,
      locale: serviceTranslations.locale,
      name: serviceTranslations.name,
      description: serviceTranslations.description,
      englishName: services.name,
    })
    .from(serviceTranslations)
    .innerJoin(services, eq(serviceTranslations.serviceId, services.id))
    .where(eq(services.shopId, shopId));
}

export async function replaceServiceTranslations(
  serviceId: string,
  rows: ServiceTranslationInput[],
) {
  await db.delete(serviceTranslations).where(eq(serviceTranslations.serviceId, serviceId));
  if (rows.length === 0) return;
  await db.insert(serviceTranslations).values(
    rows.map((row) => ({
      serviceId,
      locale: row.locale,
      name: row.name,
      description: row.description,
    })),
  );
}

export async function createService(data: {
  shopId: string;
  categoryId: string;
  name: string;
  description?: string;
  deliveryModes: string[];
  itemTypeOptions: string[];
  durationMinutes: number;
  priceMin: string;
  priceMax: string;
  isActive?: boolean;
  translations?: ServiceTranslationInput[];
}) {
  const { translations, ...serviceData } = data;
  const [row] = await db.insert(services).values(serviceData).returning();
  if (row && translations) {
    await replaceServiceTranslations(row.id, translations);
  }
  return row;
}

export async function updateService(data: {
  serviceId: string;
  shopId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  deliveryModes: string[];
  itemTypeOptions: string[];
  durationMinutes: number;
  priceMin: string;
  priceMax: string;
  isActive: boolean;
  translations?: ServiceTranslationInput[];
}) {
  const [row] = await db
    .update(services)
    .set({
      categoryId: data.categoryId,
      name: data.name,
      description: data.description ?? null,
      deliveryModes: data.deliveryModes,
      itemTypeOptions: data.itemTypeOptions,
      durationMinutes: data.durationMinutes,
      priceMin: data.priceMin,
      priceMax: data.priceMax,
      isActive: data.isActive,
    })
    .where(and(eq(services.id, data.serviceId), eq(services.shopId, data.shopId)))
    .returning();
  if (row && data.translations) {
    await replaceServiceTranslations(row.id, data.translations);
  }
  return row ?? null;
}

export async function setServiceActive(data: {
  serviceId: string;
  shopId: string;
  isActive: boolean;
}) {
  const [row] = await db
    .update(services)
    .set({ isActive: data.isActive })
    .where(and(eq(services.id, data.serviceId), eq(services.shopId, data.shopId)))
    .returning();
  return row ?? null;
}
