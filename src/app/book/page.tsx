import { syncUserFromAuth } from "@/actions/auth";
import { requireUser } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/app-shell";
import { BookingForm } from "@/components/booking/booking-form";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import { listActiveServices } from "@/db/queries/services";
import { listOpenSlots } from "@/db/queries/appointments";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  await syncUserFromAuth();
  const user = await requireUser();
  const { service: initialServiceId } = await searchParams;

  const shopId = await getDefaultShopId();
  const [services, slots] = await Promise.all([
    listActiveServices(shopId),
    listOpenSlots(shopId),
  ]);

  return (
    <AppShell
      variant="customer"
      user={user}
      title="Book a cleaning"
      description="Four quick steps. An admin confirms your request."
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
          deliveryModes: s.deliveryModes,
          itemTypeOptions: s.itemTypeOptions ?? [],
        }))}
        slots={slots.map((s) => ({
          id: s.id,
          startsAt: s.startsAt.toISOString(),
          endsAt: s.endsAt.toISOString(),
        }))}
      />
    </AppShell>
  );
}
