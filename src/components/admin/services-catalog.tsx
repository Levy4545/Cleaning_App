"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FolderPlus,
  PackagePlus,
  Pencil,
  Power,
  Trash2,
  X,
} from "lucide-react";

import {
  createCatalogService,
  createServiceCategory,
  deleteServiceCategory,
  setCatalogServiceActive,
  updateCatalogService,
  updateServiceCategory,
} from "@/actions/services";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDeliveryMode, formatItemType, formatPriceRange } from "@/lib/format";
import { ServiceIcon } from "@/lib/service-icon";
import { slugify } from "@/lib/slugify";
import { cn } from "@/lib/utils";
import { LocaleFlag } from "@/components/layout/locale-flag";
import { createTranslator } from "@/i18n/dictionary";
import { translateCatalogName, translateCatalogDescription } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import type { Locale } from "@/i18n/locales";

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  serviceCount: number;
};

export type CatalogService = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  nameRo: string;
  descriptionRo: string;
  nameHu: string;
  descriptionHu: string;
  deliveryModes: string[];
  itemTypeOptions: string[];
  durationMinutes: number;
  requiresTimeWindow: boolean;
  priceMin: string;
  priceMax: string;
  isActive: boolean;
};

type DeliveryMode = "ON_SITE" | "DROP_OFF";

type CategoryFormState = {
  name: string;
  slug: string;
};

type ServiceFormState = {
  categoryId: string;
  name: string;
  description: string;
  nameRo: string;
  descriptionRo: string;
  nameHu: string;
  descriptionHu: string;
  deliveryModes: DeliveryMode[];
  itemTypeOptionsText: string;
  durationMinutes: string;
  requiresTimeWindow: boolean;
  priceMin: string;
  priceMax: string;
  isActive: boolean;
};

const emptyCategoryForm = (): CategoryFormState => ({ name: "", slug: "" });

const emptyServiceForm = (categoryId: string): ServiceFormState => ({
  categoryId,
  name: "",
  description: "",
  nameRo: "",
  descriptionRo: "",
  nameHu: "",
  descriptionHu: "",
  deliveryModes: ["DROP_OFF"],
  itemTypeOptionsText: "",
  durationMinutes: "60",
  requiresTimeWindow: true,
  priceMin: "0.00",
  priceMax: "0.00",
  isActive: true,
});

function fallbackLocaleCopy(name: string, description: string | null, locale: Locale) {
  const { t } = createTranslator(locale);
  const translatedName = translateCatalogName(t, name);
  const translatedDescription = translateCatalogDescription(t, description);
  return {
    name: translatedName !== name ? translatedName : "",
    description:
      translatedDescription && translatedDescription !== description ? translatedDescription : "",
  };
}

function parseItemTypeOptions(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Admin UI for managing service categories and the bookable catalog.
 *
 * @param categories - Shop categories with service counts
 * @param services - All shop services including inactive ones
 */
export function ServicesCatalog({
  categories,
  services,
}: {
  categories: CatalogCategory[];
  services: CatalogService[];
}) {
  const router = useRouter();
  const { t, locale, catalogName, catalogDescription } = useI18n();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">(
    categories[0]?.id ?? "all",
  );
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(
    emptyServiceForm(categories[0]?.id ?? ""),
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredServices = useMemo(() => {
    if (selectedCategoryId === "all") return services;
    return services.filter((service) => service.categoryId === selectedCategoryId);
  }, [selectedCategoryId, services]);

  const categoryNameById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]));
  }, [categories]);

  const refresh = () => router.refresh();

  const run = (
    action: () => Promise<{ success: boolean; error?: string }>,
    successMessage: string,
    onSuccess?: () => void,
  ) => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error ?? t("common.actionFailed"));
        return;
      }
      setMessage(successMessage);
      onSuccess?.();
      refresh();
    });
  };

  const openCreateCategory = () => {
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm());
    setCategoryFormOpen(true);
    setError(null);
    setMessage(null);
  };

  const openEditCategory = (category: CatalogCategory) => {
    setEditingCategoryId(category.id);
    setCategoryForm({ name: category.name, slug: category.slug });
    setCategoryFormOpen(true);
    setError(null);
    setMessage(null);
  };

  const openCreateService = () => {
    const defaultCategory =
      selectedCategoryId !== "all" ? selectedCategoryId : (categories[0]?.id ?? "");
    setEditingServiceId(null);
    setServiceForm(emptyServiceForm(defaultCategory));
    setServiceFormOpen(true);
    setError(null);
    setMessage(null);
  };

  const openEditService = (service: CatalogService) => {
    const ro = fallbackLocaleCopy(service.name, service.description, "ro");
    const hu = fallbackLocaleCopy(service.name, service.description, "hu");
    setEditingServiceId(service.id);
    setServiceForm({
      categoryId: service.categoryId,
      name: service.name,
      description: service.description ?? "",
      nameRo: service.nameRo || ro.name,
      descriptionRo: service.descriptionRo || ro.description,
      nameHu: service.nameHu || hu.name,
      descriptionHu: service.descriptionHu || hu.description,
      deliveryModes: service.deliveryModes.filter(
        (mode): mode is DeliveryMode => mode === "ON_SITE" || mode === "DROP_OFF",
      ),
      itemTypeOptionsText: service.itemTypeOptions.join(", "),
      durationMinutes: String(service.durationMinutes),
      requiresTimeWindow: service.requiresTimeWindow,
      priceMin: service.priceMin,
      priceMax: service.priceMax,
      isActive: service.isActive,
    });
    setServiceFormOpen(true);
    setError(null);
    setMessage(null);
  };

  const toggleMode = (mode: DeliveryMode) => {
    setServiceForm((prev) => {
      const has = prev.deliveryModes.includes(mode);
      const next = has
        ? prev.deliveryModes.filter((item) => item !== mode)
        : [...prev.deliveryModes, mode];
      return { ...prev, deliveryModes: next.length > 0 ? next : prev.deliveryModes };
    });
  };

  return (
    <div className="space-y-6">
      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">{t("catalog.categories")}</CardTitle>
              <CardDescription>{t("catalog.categoriesHint")}</CardDescription>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={openCreateCategory}>
              <FolderPlus className="h-4 w-4" />
              {t("catalog.add")}
            </Button>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryId("all")}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                selectedCategoryId === "all"
                  ? "bg-gold/10 text-gold"
                  : "text-ash hover:bg-elevated hover:text-bone",
              )}
            >
              <span>{t("catalog.allServices")}</span>
              <span className="text-xs text-faint">{services.length}</span>
            </button>

            {categories.map((category) => (
              <div
                key={category.id}
                className={cn(
                  "group flex items-center gap-1 rounded-lg px-1",
                  selectedCategoryId === category.id && "bg-gold/10",
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={cn(
                    "min-w-0 flex-1 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                    selectedCategoryId === category.id
                      ? "text-gold"
                      : "text-ash hover:text-bone",
                  )}
                >
                  <span className="block truncate font-medium">
                    {translateCatalogName(t, category.name)}
                  </span>
                  <span className="block text-[11px] text-faint">
                    {t("catalog.servicesCount", { n: category.serviceCount })}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Edit ${category.name}`}
                  className="rounded-md p-1.5 text-faint opacity-0 transition-opacity hover:bg-elevated hover:text-bone group-hover:opacity-100"
                  onClick={() => openEditCategory(category)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${category.name}`}
                  disabled={isPending || category.serviceCount > 0}
                  title={
                    category.serviceCount > 0
                      ? t("catalog.moveOrRemove")
                      : t("catalog.deleteEmpty")
                  }
                  className="rounded-md p-1.5 text-faint opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100 disabled:opacity-20"
                  onClick={() =>
                    run(
                      () => deleteServiceCategory(category.id),
                      t("catalog.deletedCategory", { name: category.name }),
                    )
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {categories.length === 0 ? (
              <p className="px-2 py-4 text-sm text-faint">{t("catalog.noCategories")}</p>
            ) : null}
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-bone">
                {selectedCategoryId === "all"
                  ? t("catalog.allServices")
                  : translateCatalogName(
                      t,
                      categoryNameById.get(selectedCategoryId) ?? t("nav.services"),
                    )}
              </h2>
              <p className="text-sm text-ash">
                {t("catalog.inactiveHint")}
              </p>
            </div>
            <Button
              type="button"
              onClick={openCreateService}
              disabled={categories.length === 0}
              title={categories.length === 0 ? t("catalog.createCategoryFirst") : undefined}
            >
              <PackagePlus className="h-4 w-4" />
              {t("catalog.addService")}
            </Button>
          </div>

          {filteredServices.length === 0 ? (
            <Card>
              <EmptyState
                icon={PackagePlus}
                title={t("catalog.emptyTitle")}
                description={
                  categories.length === 0
                    ? t("catalog.emptyNoCategory")
                    : t("catalog.emptyWithCategory")
                }
                action={
                  categories.length > 0 ? (
                    <Button type="button" size="sm" onClick={openCreateService}>
                      {t("catalog.addService")}
                    </Button>
                  ) : (
                    <Button type="button" size="sm" onClick={openCreateCategory}>
                      {t("catalog.addCategory")}
                    </Button>
                  )
                }
              />
            </Card>
          ) : (
            <ul className="space-y-3">
              {filteredServices.map((service) => (
                <li key={service.id}>
                  <Card className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start gap-4">
                      <ServiceIcon
                        serviceName={service.name}
                        className="mt-0.5 h-6 w-6 shrink-0 text-gold"
                        strokeWidth={1.25}
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-bone">
                            {catalogName(service.name, service.id)}
                          </p>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wider",
                              service.isActive
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                : "border-line bg-elevated text-faint",
                            )}
                          >
                            {service.isActive ? t("catalog.active") : t("catalog.inactive")}
                          </span>
                        </div>
                        <p className="text-sm text-ash">
                          {translateCatalogName(
                            t,
                            categoryNameById.get(service.categoryId) ?? t("catalog.uncategorized"),
                          )}{" "}
                          ·{" "}
                          {service.requiresTimeWindow
                            ? t("common.minutes", { n: service.durationMinutes })
                            : t("common.dayOnly")}{" "}
                          · {formatPriceRange(service.priceMin, service.priceMax, locale)}
                        </p>
                        <p className="text-xs text-faint">
                          {service.deliveryModes.map((mode) => formatDeliveryMode(mode, t)).join(" · ")}
                          {service.itemTypeOptions.length > 0
                            ? ` · ${service.itemTypeOptions.map((item) => formatItemType(item, t)).join(", ")}`
                            : ` · ${t("catalog.noItemTypes")}`}
                          {catalogDescription(service.description, service.id, service.name)
                            ? ` · ${catalogDescription(service.description, service.id, service.name)}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={isPending}
                          onClick={() => openEditService(service)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t("catalog.edit")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={service.isActive ? "danger-outline" : "success"}
                          disabled={isPending}
                          onClick={() =>
                            run(
                              () =>
                                setCatalogServiceActive({
                                  serviceId: service.id,
                                  isActive: !service.isActive,
                                }),
                              service.isActive
                                ? t("catalog.deactivated", { name: service.name })
                                : t("catalog.activated", { name: service.name }),
                            )
                          }
                        >
                          <Power className="h-3.5 w-3.5" />
                          {service.isActive ? t("catalog.deactivate") : t("catalog.activate")}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {categoryFormOpen ? (
        <FormDrawer
          title={editingCategoryId ? t("catalog.editCategory") : t("catalog.newCategory")}
          onClose={() => setCategoryFormOpen(false)}
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const close = () => setCategoryFormOpen(false);
              if (editingCategoryId) {
                run(
                  () =>
                    updateServiceCategory({
                      categoryId: editingCategoryId,
                      name: categoryForm.name,
                      slug: categoryForm.slug || undefined,
                    }),
                  t("catalog.categoryUpdated"),
                  close,
                );
              } else {
                run(
                  () =>
                    createServiceCategory({
                      name: categoryForm.name,
                      slug: categoryForm.slug || undefined,
                    }),
                  t("catalog.categoryCreated"),
                  close,
                );
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="category-name">{t("catalog.categoryName")}</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setCategoryForm((prev) => ({
                    name,
                    slug:
                      !editingCategoryId && (!prev.slug || prev.slug === slugify(prev.name))
                        ? slugify(name)
                        : prev.slug,
                  }));
                }}
                placeholder={t("catalog.categoryPlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-slug">{t("catalog.slug")}</Label>
              <Input
                id="category-slug"
                value={categoryForm.slug}
                onChange={(event) =>
                  setCategoryForm((prev) => ({ ...prev, slug: event.target.value }))
                }
                placeholder={t("catalog.slugPlaceholder")}
              />
              <p className="text-xs text-faint">{t("catalog.slugHint")}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setCategoryFormOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {editingCategoryId ? t("catalog.saveCategory") : t("catalog.createCategory")}
              </Button>
            </div>
          </form>
        </FormDrawer>
      ) : null}

      {serviceFormOpen ? (
        <FormDrawer
          title={editingServiceId ? t("catalog.editService") : t("catalog.newService")}
          onClose={() => setServiceFormOpen(false)}
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const close = () => setServiceFormOpen(false);
              const payload = {
                categoryId: serviceForm.categoryId,
                name: serviceForm.name,
                description: serviceForm.description || undefined,
                nameRo: serviceForm.nameRo || undefined,
                descriptionRo: serviceForm.descriptionRo || undefined,
                nameHu: serviceForm.nameHu || undefined,
                descriptionHu: serviceForm.descriptionHu || undefined,
                deliveryModes: serviceForm.deliveryModes,
                itemTypeOptions: parseItemTypeOptions(serviceForm.itemTypeOptionsText),
                durationMinutes: Number(serviceForm.durationMinutes) || 60,
                requiresTimeWindow: serviceForm.requiresTimeWindow,
                priceMin: serviceForm.priceMin,
                priceMax: serviceForm.priceMax,
                isActive: serviceForm.isActive,
              };

              if (editingServiceId) {
                run(
                  () => updateCatalogService({ serviceId: editingServiceId, ...payload }),
                  t("catalog.serviceUpdated"),
                  close,
                );
              } else {
                run(() => createCatalogService(payload), t("catalog.serviceCreated"), close);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="service-category">{t("catalog.category")}</Label>
              <Select
                id="service-category"
                value={serviceForm.categoryId}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, categoryId: event.target.value }))
                }
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {translateCatalogName(t, category.name)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-name">{t("catalog.nameEnglish")}</Label>
              <Input
                id="service-name"
                value={serviceForm.name}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder={t("catalog.serviceNamePlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-description">{t("catalog.descriptionEnglish")}</Label>
              <Textarea
                id="service-description"
                value={serviceForm.description}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder={t("catalog.descriptionPlaceholder")}
              />
            </div>

            <div className="space-y-3 rounded-xl border border-line bg-elevated/50 p-3 sm:p-4">
              <div>
                <p className="text-sm font-medium text-bone">{t("catalog.translations")}</p>
                <p className="text-xs text-faint">{t("catalog.translationsHint")}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="service-name-ro" className="inline-flex items-center gap-2">
                    <LocaleFlag locale="ro" />
                    {t("catalog.nameRomanian")}
                  </Label>
                  <Input
                    id="service-name-ro"
                    value={serviceForm.nameRo}
                    onChange={(event) =>
                      setServiceForm((prev) => ({ ...prev, nameRo: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-name-hu" className="inline-flex items-center gap-2">
                    <LocaleFlag locale="hu" />
                    {t("catalog.nameHungarian")}
                  </Label>
                  <Input
                    id="service-name-hu"
                    value={serviceForm.nameHu}
                    onChange={(event) =>
                      setServiceForm((prev) => ({ ...prev, nameHu: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="service-description-ro" className="inline-flex items-center gap-2">
                    <LocaleFlag locale="ro" />
                    {t("catalog.descriptionRomanian")}
                  </Label>
                  <Textarea
                    id="service-description-ro"
                    value={serviceForm.descriptionRo}
                    onChange={(event) =>
                      setServiceForm((prev) => ({ ...prev, descriptionRo: event.target.value }))
                    }
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-description-hu" className="inline-flex items-center gap-2">
                    <LocaleFlag locale="hu" />
                    {t("catalog.descriptionHungarian")}
                  </Label>
                  <Textarea
                    id="service-description-hu"
                    value={serviceForm.descriptionHu}
                    onChange={(event) =>
                      setServiceForm((prev) => ({ ...prev, descriptionHu: event.target.value }))
                    }
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("catalog.deliveryModes")}</Label>
              <div className="flex flex-wrap gap-2">
                {(["DROP_OFF", "ON_SITE"] as DeliveryMode[]).map((mode) => {
                  const active = serviceForm.deliveryModes.includes(mode);
                  return (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleMode(mode)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                        active
                          ? "border-gold/60 bg-gold/10 text-gold"
                          : "border-line bg-surface text-ash hover:border-line-strong hover:text-bone",
                      )}
                    >
                      {formatDeliveryMode(mode, t)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-item-types">{t("catalog.itemTypes")}</Label>
              <Input
                id="service-item-types"
                value={serviceForm.itemTypeOptionsText}
                onChange={(event) =>
                  setServiceForm((prev) => ({
                    ...prev,
                    itemTypeOptionsText: event.target.value,
                  }))
                }
                placeholder="leather, fabric"
              />
              <p className="text-xs text-faint">{t("catalog.itemTypesHint")}</p>
            </div>

            <label className="flex items-start gap-2 text-sm text-ash">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-line bg-surface text-gold focus:ring-gold/40"
                checked={serviceForm.requiresTimeWindow}
                onChange={(event) =>
                  setServiceForm((prev) => ({
                    ...prev,
                    requiresTimeWindow: event.target.checked,
                  }))
                }
              />
              <span>
                <span className="block text-bone">{t("catalog.requiresTimeWindow")}</span>
                <span className="block text-xs text-faint">{t("catalog.requiresTimeWindowHint")}</span>
              </span>
            </label>

            <div
              className={cn(
                "grid gap-4",
                serviceForm.requiresTimeWindow ? "sm:grid-cols-3" : "sm:grid-cols-2",
              )}
            >
              {serviceForm.requiresTimeWindow ? (
                <div className="space-y-2">
                  <Label htmlFor="service-duration">{t("catalog.duration")}</Label>
                  <Input
                    id="service-duration"
                    type="number"
                    min={15}
                    step={15}
                    value={serviceForm.durationMinutes}
                    onChange={(event) =>
                      setServiceForm((prev) => ({
                        ...prev,
                        durationMinutes: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="service-price-min">{t("catalog.priceMin")}</Label>
                <Input
                  id="service-price-min"
                  inputMode="decimal"
                  value={serviceForm.priceMin}
                  onChange={(event) =>
                    setServiceForm((prev) => ({ ...prev, priceMin: event.target.value }))
                  }
                  placeholder="300.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-price-max">{t("catalog.priceMax")}</Label>
                <Input
                  id="service-price-max"
                  inputMode="decimal"
                  value={serviceForm.priceMax}
                  onChange={(event) =>
                    setServiceForm((prev) => ({ ...prev, priceMax: event.target.value }))
                  }
                  placeholder="500.00"
                  required
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-ash">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line bg-surface text-gold focus:ring-gold/40"
                checked={serviceForm.isActive}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
              {t("catalog.activeBookable")}
            </label>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setServiceFormOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isPending || categories.length === 0}>
                {editingServiceId ? t("catalog.saveService") : t("catalog.createService")}
              </Button>
            </div>
          </form>
        </FormDrawer>
      ) : null}
    </div>
  );
}

function FormDrawer({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-line bg-panel p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h3 className="font-display text-xl text-bone">{title}</h3>
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={onClose}
            className="rounded-md p-1.5 text-faint transition-colors hover:bg-elevated hover:text-bone"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
