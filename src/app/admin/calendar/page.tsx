import { AppShell } from "@/components/layout/app-shell";
import { WeekCalendar } from "@/components/admin/week-calendar";
import { requireAdmin } from "@/lib/auth/guards";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import { listCalendarBookings, listSlotsForShop } from "@/db/queries/appointments";
import { findServiceById } from "@/db/queries/services";
import { findUserById } from "@/db/queries/users";
import { getTranslator } from "@/i18n/server";

export default async function AdminCalendarPage() {
  const admin = await requireAdmin();
  const shopId = await getDefaultShopId();
  const { t } = await getTranslator();

  const [slots, bookingRows] = await Promise.all([
    listSlotsForShop(shopId),
    listCalendarBookings(shopId),
  ]);

  const calendarBookings = await Promise.all(
    bookingRows.map(async (row) => {
      const [customer, service] = await Promise.all([
        findUserById(row.customerId),
        findServiceById(row.serviceId, shopId),
      ]);

      return {
        id: row.appointmentId,
        slotId: row.slotId,
        status: row.status,
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt.toISOString(),
        customerEmail: customer?.email ?? t("common.customer"),
        serviceName: service?.name ?? t("common.service"),
        deliveryMode: row.deliveryMode,
      };
    }),
  );

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
