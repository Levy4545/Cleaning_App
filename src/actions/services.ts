"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import { slugify } from "@/lib/slugify";
import {
  countServicesInCategory,
  createCategory,
  createService,
  deleteCategory,
  findCategoryById,
  findCategoryBySlug,
  findServiceById,
  setServiceActive,
  updateCategory,
  updateService,
} from "@/db/queries/services";
import {
  createCategorySchema,
  createServiceSchema,
  setServiceActiveSchema,
  updateCategorySchema,
  updateServiceSchema,
  type CreateCategoryInput,
  type CreateServiceInput,
  type SetServiceActiveInput,
  type UpdateCategoryInput,
  type UpdateServiceInput,
} from "@/validators/services";
import type { ActionResult } from "@/types";

function revalidateCatalogPaths() {
  revalidatePath("/admin/services");
  revalidatePath("/book");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

async function resolveUniqueCategorySlug(
  shopId: string,
  desired: string,
  excludeCategoryId?: string,
) {
  const base = slugify(desired);
  let candidate = base;
  let attempt = 2;

  while (true) {
    const existing = await findCategoryBySlug(shopId, candidate);
    if (!existing || existing.id === excludeCategoryId) {
      return candidate;
    }
    candidate = `${base}-${attempt}`;
    attempt += 1;
  }
}

/**
 * Creates a service category for the default shop.
 *
 * @param input - Category name and optional slug
 * @returns The created category ID, or an error result
 */
export async function createServiceCategory(
  input: CreateCategoryInput,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const shopId = await getDefaultShopId();
  const slug = await resolveUniqueCategorySlug(
    shopId,
    parsed.data.slug?.trim() || parsed.data.name,
  );

  const category = await createCategory({
    shopId,
    name: parsed.data.name.trim(),
    slug,
  });

  if (!category) {
    return { success: false, error: "Could not create category" };
  }

  revalidateCatalogPaths();
  return { success: true, data: { id: category.id } };
}

/**
 * Updates an existing service category.
 *
 * @param input - Category ID, name, and optional slug
 * @returns A success or error result
 */
export async function updateServiceCategory(
  input: UpdateCategoryInput,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const shopId = await getDefaultShopId();
  const existing = await findCategoryById(parsed.data.categoryId, shopId);
  if (!existing) {
    return { success: false, error: "Category not found" };
  }

  const slug = await resolveUniqueCategorySlug(
    shopId,
    parsed.data.slug?.trim() || parsed.data.name,
    existing.id,
  );

  const updated = await updateCategory({
    categoryId: existing.id,
    shopId,
    name: parsed.data.name.trim(),
    slug,
  });

  if (!updated) {
    return { success: false, error: "Could not update category" };
  }

  revalidateCatalogPaths();
  return { success: true };
}

/**
 * Deletes a category when it has no services.
 *
 * @param categoryId - The category to delete
 * @returns A success or error result
 */
export async function deleteServiceCategory(categoryId: string): Promise<ActionResult> {
  await requireAdmin();

  if (!categoryId) {
    return { success: false, error: "Category is required" };
  }

  const shopId = await getDefaultShopId();
  const existing = await findCategoryById(categoryId, shopId);
  if (!existing) {
    return { success: false, error: "Category not found" };
  }

  const serviceCount = await countServicesInCategory(categoryId, shopId);
  if (serviceCount > 0) {
    return {
      success: false,
      error: "Move or deactivate services in this category before deleting it",
    };
  }

  const deleted = await deleteCategory(categoryId, shopId);
  if (!deleted) {
    return { success: false, error: "Could not delete category" };
  }

  revalidateCatalogPaths();
  return { success: true };
}

/**
 * Creates a catalog service for the default shop.
 *
 * @param input - Service fields including category and delivery modes
 * @returns The created service ID, or an error result
 */
export async function createCatalogService(
  input: CreateServiceInput,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = createServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const shopId = await getDefaultShopId();
  const category = await findCategoryById(parsed.data.categoryId, shopId);
  if (!category) {
    return { success: false, error: "Category not found" };
  }

  const service = await createService({
    shopId,
    categoryId: category.id,
    name: parsed.data.name.trim(),
    description: parsed.data.description?.trim() || undefined,
    deliveryModes: parsed.data.deliveryModes,
    durationMinutes: parsed.data.durationMinutes,
    basePrice: parsed.data.basePrice,
    isActive: parsed.data.isActive ?? true,
  });

  if (!service) {
    return { success: false, error: "Could not create service" };
  }

  revalidateCatalogPaths();
  return { success: true, data: { id: service.id } };
}

/**
 * Updates an existing catalog service.
 *
 * @param input - Service ID and editable fields
 * @returns A success or error result
 */
export async function updateCatalogService(
  input: UpdateServiceInput,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updateServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const shopId = await getDefaultShopId();
  const existing = await findServiceById(parsed.data.serviceId, shopId);
  if (!existing) {
    return { success: false, error: "Service not found" };
  }

  const category = await findCategoryById(parsed.data.categoryId, shopId);
  if (!category) {
    return { success: false, error: "Category not found" };
  }

  const updated = await updateService({
    serviceId: existing.id,
    shopId,
    categoryId: category.id,
    name: parsed.data.name.trim(),
    description: parsed.data.description?.trim() || null,
    deliveryModes: parsed.data.deliveryModes,
    durationMinutes: parsed.data.durationMinutes,
    basePrice: parsed.data.basePrice,
    isActive: parsed.data.isActive ?? existing.isActive,
  });

  if (!updated) {
    return { success: false, error: "Could not update service" };
  }

  revalidateCatalogPaths();
  return { success: true };
}

/**
 * Activates or deactivates a catalog service without deleting it.
 *
 * @param input - Service ID and desired active flag
 * @returns A success or error result
 */
export async function setCatalogServiceActive(
  input: SetServiceActiveInput,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = setServiceActiveSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const shopId = await getDefaultShopId();
  const existing = await findServiceById(parsed.data.serviceId, shopId);
  if (!existing) {
    return { success: false, error: "Service not found" };
  }

  const updated = await setServiceActive({
    serviceId: existing.id,
    shopId,
    isActive: parsed.data.isActive,
  });

  if (!updated) {
    return { success: false, error: "Could not update service status" };
  }

  revalidateCatalogPaths();
  return { success: true };
}
