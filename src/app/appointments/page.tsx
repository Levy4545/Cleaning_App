import { CalendarPlus } from "lucide-react";

import { syncUserFromAuth } from "@/actions/auth";
import { requireUser } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/app-shell";
import { AppointmentList, type AppointmentRow } from "@/components/booking/appointment-list";
import { ButtonLink } from "@/components/ui/button";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import { findSlotById, listAppointmentsForCustomer } from "@/db/queries/appointments";
import { findServiceById } from "@/db/queries/services";
import { findReviewByAppointment } from "@/db/queries/reviews";
import { getTranslator } from "@/i18n/server";

export default async function AppointmentsPage() {
  await syncUserFromAuth();
  const user = await requireUser();
  const shopId = await getDefaultShopId();
  const { t } = await getTranslator();
  const appointments = await listAppointmentsForCustomer(user.id, shopId);

  const rows: AppointmentRow[] = await Promise.all(
    appointments.map(async (appointment) => {
      const [service, review, slot] = await Promise.all([
        findServiceById(appointment.serviceId, shopId),
        findReviewByAppointment(appointment.id, shopId),
        findSlotById(appointment.slotId, shopId),
      ]);

      return {
        id: appointment.id,
        serviceName: service?.name ?? t("common.service"),
        priceMin: service?.priceMin ?? "0",
        priceMax: service?.priceMax ?? "0",
        status: appointment.status,
        deliveryMode: appointment.deliveryMode,
        createdAt: new Date(appointment.createdAt).toISOString(),
        slotStart: slot ? new Date(slot.startsAt).toISOString() : null,
        slotEnd: slot ? new Date(slot.endsAt).toISOString() : null,
        statusNote: appointment.statusNote ?? null,
        review: review ? { rating: review.rating, comment: review.comment ?? null } : null,
      };
    }),
  );

  return (
    <AppShell
      variant="customer"
      user={user}
      title={t("appointments.title")}
      description={t("appointments.description")}
      actions={
        <ButtonLink href="/book" size="sm">
          <CalendarPlus className="h-4 w-4" />
          {t("appointments.newBooking")}
        </ButtonLink>
      }
    >
      <AppointmentList rows={rows} />
    </AppShell>
  );
}
