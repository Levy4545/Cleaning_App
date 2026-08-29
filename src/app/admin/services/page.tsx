import { AppShell } from "@/components/layout/app-shell";
import {
  ServicesCatalog,
  type CatalogCategory,
  type CatalogService,
} from "@/components/admin/services-catalog";
import { requireAdmin } from "@/lib/auth/guards";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import { listAllServices, listCategories, listServiceTranslationsForShop } from "@/db/queries/services";
import { getTranslator } from "@/i18n/server";

export default async function AdminServicesPage() {
  const admin = await requireAdmin();
  const shopId = await getDefaultShopId();
  const { t } = await getTranslator();

  const [categoryRows, serviceRows, translationRows] = await Promise.all([
    listCategories(shopId),
    listAllServices(shopId),
    listServiceTranslationsForShop(shopId),
  ]);

  const translationsByService = new Map<string, { ro?: { name: string; description: string | null }; hu?: { name: string; description: string | null } }>();
  for (const row of translationRows) {
    if (row.locale !== "ro" && row.locale !== "hu") continue;
    const current = translationsByService.get(row.serviceId) ?? {};
    current[row.locale] = { name: row.name, description: row.description };
    translationsByService.set(row.serviceId, current);
  }

  const services: CatalogService[] = serviceRows.map((service) => {
    const locales = translationsByService.get(service.id);
    return {
      id: service.id,
      categoryId: service.categoryId,
      name: service.name,
      description: service.description,
      nameRo: locales?.ro?.name ?? "",
      descriptionRo: locales?.ro?.description ?? "",
      nameHu: locales?.hu?.name ?? "",
      descriptionHu: locales?.hu?.description ?? "",
      deliveryModes: service.deliveryModes,
      itemTypeOptions: service.itemTypeOptions ?? [],
      durationMinutes: service.durationMinutes,
      requiresTimeWindow: service.requiresTimeWindow,
      priceMin: service.priceMin,
      priceMax: service.priceMax,
      isActive: service.isActive,
    };
  });

  const counts = new Map<string, number>();
  for (const service of services) {
    counts.set(service.categoryId, (counts.get(service.categoryId) ?? 0) + 1);
  }

  const categories: CatalogCategory[] = categoryRows.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    serviceCount: counts.get(category.id) ?? 0,
  }));

  return (
    <AppShell
      variant="admin"
      user={admin}
      title={t("admin.servicesTitle")}
      titleKey="admin.servicesTitle"
      description={t("admin.servicesBody")}
      descriptionKey="admin.servicesBody"
    >
      <ServicesCatalog categories={categories} services={services} />
    </AppShell>
  );
}
