import { CalendarPlus } from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/app-shell";
import { AppointmentList, type AppointmentRow } from "@/components/booking/appointment-list";
import { ButtonLink } from "@/components/ui/button";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import { listCustomerAppointmentRows } from "@/db/queries/appointments";
import { getTranslator } from "@/i18n/server";
import { WithCatalog } from "@/i18n/with-catalog";

export default async function AppointmentsPage() {
  const user = await requireUser();
  const shopId = await getDefaultShopId();
  const { t } = await getTranslator();
  const appointments = await listCustomerAppointmentRows(user.id, shopId);

  const rows: AppointmentRow[] = appointments.map((appointment) => ({
    id: appointment.id,
    serviceName: appointment.serviceName ?? t("common.service"),
    priceMin: appointment.servicePriceMin ?? "0",
    priceMax: appointment.servicePriceMax ?? "0",
    status: appointment.status,
    deliveryMode: appointment.deliveryMode,
    createdAt: new Date(appointment.createdAt).toISOString(),
    slotStart: appointment.slotStartsAt ? new Date(appointment.slotStartsAt).toISOString() : null,
    slotEnd: appointment.slotEndsAt ? new Date(appointment.slotEndsAt).toISOString() : null,
    requestedDate: appointment.requestedDate ?? null,
    statusNote: appointment.statusNote ?? null,
    review:
      appointment.reviewRating != null
        ? { rating: appointment.reviewRating, comment: appointment.reviewComment ?? null }
        : null,
  }));

  return (
    <WithCatalog>
      <AppShell
        variant="customer"
        user={user}
        title={t("appointments.title")}
        titleKey="appointments.title"
        description={t("appointments.description")}
        descriptionKey="appointments.description"
        actions={
          <ButtonLink href="/book" size="sm">
            <CalendarPlus className="h-4 w-4" />
            {t("appointments.newBooking")}
          </ButtonLink>
        }
      >
        <AppointmentList rows={rows} />
      </AppShell>
    </WithCatalog>
  );
}
