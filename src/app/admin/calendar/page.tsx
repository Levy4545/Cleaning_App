import { AppShell } from "@/components/layout/app-shell";
import { WeekCalendar } from "@/components/admin/week-calendar";
import { requireAdmin } from "@/lib/auth/guards";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import { listCalendarBookings, listSlotsForShop } from "@/db/queries/appointments";
import { getTranslator } from "@/i18n/server";

export default async function AdminCalendarPage() {
  const admin = await requireAdmin();
  const shopId = await getDefaultShopId();
  const { t } = await getTranslator();

  const [slots, bookingRows] = await Promise.all([
    listSlotsForShop(shopId),
    listCalendarBookings(shopId),
  ]);

  const calendarBookings = bookingRows.map((row) => ({
    id: row.appointmentId,
    slotId: row.slotId,
    status: row.status,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    customerEmail: row.customerEmail ?? t("common.customer"),
    serviceName: row.serviceName ?? t("common.service"),
    deliveryMode: row.deliveryMode,
  }));

  return (
    <AppShell
      variant="admin"
      user={admin}
      title={t("admin.calendarTitle")}
      titleKey="admin.calendarTitle"
      description={t("admin.calendarBody")}
      descriptionKey="admin.calendarBody"
    >
      <WeekCalendar
        slots={slots.map((slot) => ({
          id: slot.id,
          startsAt: slot.startsAt.toISOString(),
          endsAt: slot.endsAt.toISOString(),
          status: slot.status,
          bookedCount: slot.bookedCount,
        }))}
        bookings={calendarBookings}
      />
    </AppShell>
  );
}
