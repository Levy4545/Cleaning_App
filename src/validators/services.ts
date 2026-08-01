import { z } from "zod";

const deliveryModeSchema = z.enum(["ON_SITE", "DROP_OFF"]);

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens")
    .optional(),
});

export const updateCategorySchema = createCategorySchema.extend({
  categoryId: z.string().uuid(),
});

export const createServiceSchema = z.object({
  categoryId: z.string().uuid("Pick a category"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional(),
  deliveryModes: z
    .array(deliveryModeSchema)
    .min(1, "Pick at least one delivery mode"),
  durationMinutes: z.coerce
    .number()
    .int("Duration must be a whole number")
    .min(15, "Duration must be at least 15 minutes")
    .max(24 * 60, "Duration is too long"),
  basePrice: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price like 80 or 80.00"),
  isActive: z.boolean().optional(),
});

export const updateServiceSchema = createServiceSchema.extend({
  serviceId: z.string().uuid(),
});

export const setServiceActiveSchema = z.object({
  serviceId: z.string().uuid(),
  isActive: z.boolean(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type SetServiceActiveInput = z.infer<typeof setServiceActiveSchema>;
