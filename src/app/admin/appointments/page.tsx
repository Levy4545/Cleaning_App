import { AppShell } from "@/components/layout/app-shell";
import { AppointmentsInbox, type InboxRow } from "@/components/admin/appointments-inbox";
import { requireAdmin } from "@/lib/auth/guards";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import { listShopAppointmentsInbox } from "@/db/queries/appointments";
import { formatDay, formatItemType, formatPriceRange, formatSlotRange } from "@/lib/format";
import { getTranslator } from "@/i18n/server";

/**
 * Renders the administrator appointments inbox with appointment totals and pending count.
 */
export default async function AdminAppointmentsPage() {
  const admin = await requireAdmin();
  const shopId = await getDefaultShopId();
  const { t, locale } = await getTranslator();
  const appointments = await listShopAppointmentsInbox(shopId);

  const rows: InboxRow[] = appointments.map((appointment) => ({
    id: appointment.id,
    status: appointment.status,
    serviceName: appointment.serviceName ?? t("common.service"),
    customerName: appointment.customerName ?? null,
    customerEmail: appointment.customerEmail ?? appointment.customerId,
    customerPhone: appointment.customerPhone ?? null,
    deliveryMode: appointment.deliveryMode,
    window:
      appointment.slotStartsAt && appointment.slotEndsAt
        ? formatSlotRange(appointment.slotStartsAt, appointment.slotEndsAt, locale)
        : appointment.requestedDate
          ? formatDay(`${appointment.requestedDate}T12:00:00`, locale)
          : null,
    requestedAt: new Date(appointment.createdAt).toISOString(),
    notes: appointment.notes ?? null,
    statusNote: appointment.statusNote ?? null,
    address:
      appointment.addressLine1 || appointment.addressCity
        ? [appointment.addressLine1, appointment.addressCity, appointment.addressPostalCode]
            .filter(Boolean)
            .join(", ")
        : null,
    items:
      appointment.items.length > 0
        ? appointment.items
            .map((item) => {
              const qty = `× ${item.quantity}`;
              return item.itemType
                ? `${formatItemType(item.itemType, t)} ${qty}`
                : t("common.itemQty", { n: item.quantity });
            })
            .join(", ")
        : t("common.notSpecified"),
    priceLabel: formatPriceRange(
      appointment.servicePriceMin ?? "0",
      appointment.servicePriceMax ?? appointment.servicePriceMin ?? "0",
      locale,
    ),
    amount: appointment.paymentAmount ?? appointment.servicePriceMin ?? "0",
    paymentStatus: appointment.paymentStatus ?? "UNPAID",
    review:
      appointment.reviewRating != null
        ? {
            rating: appointment.reviewRating,
            comment: appointment.reviewComment ?? null,
            createdAt: appointment.reviewCreatedAt
              ? new Date(appointment.reviewCreatedAt).toISOString()
              : new Date().toISOString(),
          }
        : null,
  }));

  const pending = rows.filter((row) => row.status === "PENDING").length;

  return (
    <AppShell
      variant="admin"
      user={admin}
      title={t("admin.appointmentsTitle")}
      titleKey="admin.appointmentsTitle"
      description={t("admin.appointmentsCount", { total: rows.length, pending })}
      descriptionKey="admin.appointmentsCount"
      descriptionVars={{ total: rows.length, pending }}
    >
      <AppointmentsInbox rows={rows} />
    </AppShell>
  );
}
