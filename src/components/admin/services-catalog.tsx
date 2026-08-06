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
  deliveryModes: string[];
  itemTypeOptions: string[];
  durationMinutes: number;
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
  deliveryModes: DeliveryMode[];
  itemTypeOptionsText: string;
  durationMinutes: string;
  priceMin: string;
  priceMax: string;
  isActive: boolean;
};

const emptyCategoryForm = (): CategoryFormState => ({ name: "", slug: "" });

const emptyServiceForm = (categoryId: string): ServiceFormState => ({
  categoryId,
  name: "",
  description: "",
  deliveryModes: ["DROP_OFF"],
  itemTypeOptionsText: "",
  durationMinutes: "60",
  priceMin: "0.00",
  priceMax: "0.00",
  isActive: true,
});

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
        setError(result.error ?? "Action failed");
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
    setEditingServiceId(service.id);
    setServiceForm({
      categoryId: service.categoryId,
      name: service.name,
      description: service.description ?? "",
      deliveryModes: service.deliveryModes.filter(
        (mode): mode is DeliveryMode => mode === "ON_SITE" || mode === "DROP_OFF",
      ),
      itemTypeOptionsText: service.itemTypeOptions.join(", "),
      durationMinutes: String(service.durationMinutes),
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
              <CardTitle className="text-base">Categories</CardTitle>
              <CardDescription>Group services for the booking wizard.</CardDescription>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={openCreateCategory}>
              <FolderPlus className="h-4 w-4" />
              Add
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
              <span>All services</span>
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
                  <span className="block truncate font-medium">{category.name}</span>
                  <span className="block text-[11px] text-faint">
                    {category.serviceCount} service{category.serviceCount === 1 ? "" : "s"}
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
                      ? "Move or remove services first"
                      : "Delete empty category"
                  }
                  className="rounded-md p-1.5 text-faint opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100 disabled:opacity-20"
                  onClick={() =>
                    run(
                      () => deleteServiceCategory(category.id),
                      `Deleted category “${category.name}”`,
                    )
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {categories.length === 0 ? (
              <p className="px-2 py-4 text-sm text-faint">No categories yet.</p>
            ) : null}
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-bone">
                {selectedCategoryId === "all"
                  ? "All services"
                  : (categoryNameById.get(selectedCategoryId) ?? "Services")}
              </h2>
              <p className="text-sm text-ash">
                Inactive services stay in the catalog but cannot be booked.
              </p>
            </div>
            <Button
              type="button"
              onClick={openCreateService}
              disabled={categories.length === 0}
              title={categories.length === 0 ? "Create a category first" : undefined}
            >
              <PackagePlus className="h-4 w-4" />
              Add service
            </Button>
          </div>

          {filteredServices.length === 0 ? (
            <Card>
              <EmptyState
                icon={PackagePlus}
                title="No services here"
                description={
                  categories.length === 0
                    ? "Create a category, then add your first service."
                    : "Add a service so customers can book it."
                }
                action={
                  categories.length > 0 ? (
                    <Button type="button" size="sm" onClick={openCreateService}>
                      Add service
                    </Button>
                  ) : (
                    <Button type="button" size="sm" onClick={openCreateCategory}>
                      Add category
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
                          <p className="font-medium text-bone">{service.name}</p>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wider",
                              service.isActive
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                : "border-line bg-elevated text-faint",
                            )}
                          >
                            {service.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-sm text-ash">
                          {categoryNameById.get(service.categoryId) ?? "Uncategorized"} ·{" "}
                          {service.durationMinutes} min ·{" "}
                          {formatPriceRange(service.priceMin, service.priceMax)}
                        </p>
                        <p className="text-xs text-faint">
                          {service.deliveryModes.map(formatDeliveryMode).join(" · ")}
                          {service.itemTypeOptions.length > 0
                            ? ` · ${service.itemTypeOptions.map(formatItemType).join(", ")}`
                            : " · No item types"}
                          {service.description ? ` · ${service.description}` : ""}
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
                          Edit
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
                                ? `Deactivated “${service.name}”`
                                : `Activated “${service.name}”`,
                            )
                          }
                        >
                          <Power className="h-3.5 w-3.5" />
                          {service.isActive ? "Deactivate" : "Activate"}
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
          title={editingCategoryId ? "Edit category" : "New category"}
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
                  "Category updated",
                  close,
                );
              } else {
                run(
                  () =>
                    createServiceCategory({
                      name: categoryForm.name,
                      slug: categoryForm.slug || undefined,
                    }),
                  "Category created",
                  close,
                );
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
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
                placeholder="Vehicle"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-slug">Slug</Label>
              <Input
                id="category-slug"
                value={categoryForm.slug}
                onChange={(event) =>
                  setCategoryForm((prev) => ({ ...prev, slug: event.target.value }))
                }
                placeholder="vehicle"
              />
              <p className="text-xs text-faint">Leave blank to generate from the name.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setCategoryFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {editingCategoryId ? "Save category" : "Create category"}
              </Button>
            </div>
          </form>
        </FormDrawer>
      ) : null}

      {serviceFormOpen ? (
        <FormDrawer
          title={editingServiceId ? "Edit service" : "New service"}
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
                deliveryModes: serviceForm.deliveryModes,
                itemTypeOptions: parseItemTypeOptions(serviceForm.itemTypeOptionsText),
                durationMinutes: Number(serviceForm.durationMinutes),
                priceMin: serviceForm.priceMin,
                priceMax: serviceForm.priceMax,
                isActive: serviceForm.isActive,
              };

              if (editingServiceId) {
                run(
                  () => updateCatalogService({ serviceId: editingServiceId, ...payload }),
                  "Service updated",
                  close,
                );
              } else {
                run(() => createCatalogService(payload), "Service created", close);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="service-category">Category</Label>
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
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-name">Name</Label>
              <Input
                id="service-name"
                value={serviceForm.name}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Car Interior Cleaning"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-description">Description</Label>
              <Textarea
                id="service-description"
                value={serviceForm.description}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="What is included?"
              />
            </div>

            <div className="space-y-2">
              <Label>Delivery modes</Label>
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
                      {formatDeliveryMode(mode)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-item-types">Item types</Label>
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
              <p className="text-xs text-faint">
                Comma-separated. Leave blank to hide item type on booking.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="service-duration">Duration (minutes)</Label>
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
              <div className="space-y-2">
                <Label htmlFor="service-price-min">Price min</Label>
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
                <Label htmlFor="service-price-max">Price max</Label>
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
              Active and bookable
            </label>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setServiceFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || categories.length === 0}>
                {editingServiceId ? "Save service" : "Create service"}
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
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-panel p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h3 className="font-display text-xl text-bone">{title}</h3>
          <button
            type="button"
            aria-label="Close"
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
