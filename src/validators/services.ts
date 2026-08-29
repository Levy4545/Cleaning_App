import { z } from "zod";

const deliveryModeSchema = z.enum(["ON_SITE", "DROP_OFF"]);

const moneyAmountSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount like 80 or 80.00");

const itemTypeOptionSchema = z
  .string()
  .trim()
  .min(1, "Item type cannot be empty")
  .max(40, "Item type is too long")
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9\s_-]*$/, "Use letters, numbers, spaces, hyphens, or underscores");

function refineServicePricesAndOptions(
  value: {
    priceMin: string;
    priceMax: string;
    itemTypeOptions: string[];
  },
  ctx: z.RefinementCtx,
) {
  const min = Number(value.priceMin);
  const max = Number(value.priceMax);
  if (!(max >= min)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Max price must be greater than or equal to min price",
      path: ["priceMax"],
    });
  }

  const normalized = value.itemTypeOptions.map((option) => option.trim().toLowerCase());
  if (new Set(normalized).size !== normalized.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Item type options must be unique",
      path: ["itemTypeOptions"],
    });
  }
}

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

const optionalLocaleName = z.string().trim().max(100).optional();
const optionalLocaleDescription = z.string().trim().max(500).optional();

const serviceFieldsSchema = z.object({
  categoryId: z.string().uuid("Pick a category"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional(),
  nameRo: optionalLocaleName,
  descriptionRo: optionalLocaleDescription,
  nameHu: optionalLocaleName,
  descriptionHu: optionalLocaleDescription,
  deliveryModes: z.array(deliveryModeSchema).min(1, "Pick at least one delivery mode"),
  itemTypeOptions: z.array(itemTypeOptionSchema).max(20).default([]),
  durationMinutes: z.coerce
    .number()
    .int("Duration must be a whole number")
    .min(15, "Duration must be at least 15 minutes")
    .max(24 * 60, "Duration is too long"),
  requiresTimeWindow: z.boolean().optional(),
  priceMin: moneyAmountSchema,
  priceMax: moneyAmountSchema,
  isActive: z.boolean().optional(),
});

export const createServiceSchema = serviceFieldsSchema.superRefine(refineServicePricesAndOptions);

export const updateServiceSchema = serviceFieldsSchema
  .extend({
    serviceId: z.string().uuid(),
  })
  .superRefine(refineServicePricesAndOptions);

export const setServiceActiveSchema = z.object({
  serviceId: z.string().uuid(),
  isActive: z.boolean(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type SetServiceActiveInput = z.infer<typeof setServiceActiveSchema>;
