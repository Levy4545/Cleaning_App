import { AppShell } from "@/components/layout/app-shell";
import { AppointmentsInbox, type InboxRow } from "@/components/admin/appointments-inbox";
import { requireAdmin } from "@/lib/auth/guards";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import { listShopAppointmentsInbox } from "@/db/queries/appointments";
import { formatItemType, formatSlotRange } from "@/lib/format";

export default async function AdminAppointmentsPage() {
  const admin = await requireAdmin();
  const shopId = await getDefaultShopId();
  const appointments = await listShopAppointmentsInbox(shopId);

  const rows: InboxRow[] = appointments.map((appointment) => ({
    id: appointment.id,
    status: appointment.status,
    serviceName: appointment.serviceName ?? "Service",
    customerName: appointment.customerName ?? null,
    customerEmail: appointment.customerEmail ?? appointment.customerId,
    customerPhone: appointment.customerPhone ?? null,
    deliveryMode: appointment.deliveryMode,
    window:
      appointment.slotStartsAt && appointment.slotEndsAt
        ? formatSlotRange(appointment.slotStartsAt, appointment.slotEndsAt)
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
            .map((item) => `${formatItemType(item.itemType)} × ${item.quantity}`)
            .join(", ")
        : "Not specified",
    amount: appointment.paymentAmount ?? appointment.servicePrice ?? "0",
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
      title="Appointments"
      description={`${rows.length} total · ${pending} awaiting review`}
    >
      <AppointmentsInbox rows={rows} />
    </AppShell>
  );
}
