import { requireUser } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/app-shell";
import { BookingForm } from "@/components/booking/booking-form";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import { listOpenAvailableDays } from "@/db/queries/available-days";
import { listActiveServices } from "@/db/queries/services";
import { listOpenSlots } from "@/db/queries/appointments";
import { getTranslator } from "@/i18n/server";
import { WithCatalog } from "@/i18n/with-catalog";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const user = await requireUser();
  const { service: initialServiceId } = await searchParams;
  const { t } = await getTranslator();

  const shopId = await getDefaultShopId();
  const [services, slots, openDays] = await Promise.all([
    listActiveServices(shopId),
    listOpenSlots(shopId),
    listOpenAvailableDays(shopId),
  ]);

  return (
    <WithCatalog>
      <AppShell
        variant="customer"
        user={user}
        title={t("book.title")}
        titleKey="book.title"
        description={t("book.description")}
        descriptionKey="book.description"
      >
        <BookingForm
          initialServiceId={initialServiceId}
          services={services.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            priceMin: s.priceMin,
            priceMax: s.priceMax,
            durationMinutes: s.durationMinutes,
            requiresTimeWindow: s.requiresTimeWindow,
            deliveryModes: s.deliveryModes,
            itemTypeOptions: s.itemTypeOptions ?? [],
          }))}
          slots={slots.map((s) => ({
            id: s.id,
            startsAt: s.startsAt.toISOString(),
            endsAt: s.endsAt.toISOString(),
          }))}
          availableDays={openDays.map((row) => row.day)}
        />
      </AppShell>
    </WithCatalog>
  );
}
