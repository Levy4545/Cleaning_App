import { AppShell } from "@/components/layout/app-shell";
import { AppointmentsInbox, type InboxRow } from "@/components/admin/appointments-inbox";
import { requireAdmin } from "@/lib/auth/guards";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import {
  findPaymentForAppointment,
  findSlotById,
  listAppointmentsForShop,
  listItemsForAppointment,
} from "@/db/queries/appointments";
import { findAddressById } from "@/db/queries/addresses";
import { findServiceById } from "@/db/queries/services";
import { findUserById } from "@/db/queries/users";
import { findReviewByAppointment } from "@/db/queries/reviews";
import { formatItemType, formatSlotRange } from "@/lib/format";

export default async function AdminAppointmentsPage() {
  const admin = await requireAdmin();
  const shopId = await getDefaultShopId();
  const appointments = await listAppointmentsForShop(shopId);

  const rows: InboxRow[] = await Promise.all(
    appointments.map(async (appointment) => {
      const [service, customer, review, slot, items, payment, address] = await Promise.all([
        findServiceById(appointment.serviceId, shopId),
        findUserById(appointment.customerId),
        findReviewByAppointment(appointment.id, shopId),
        findSlotById(appointment.slotId, shopId),
        listItemsForAppointment(appointment.id),
        findPaymentForAppointment(appointment.id, shopId),
        appointment.addressId ? findAddressById(appointment.addressId, shopId) : null,
      ]);

      return {
        id: appointment.id,
        status: appointment.status,
        serviceName: service?.name ?? "Service",
        customerName: customer?.name ?? null,
        customerEmail: customer?.email ?? appointment.customerId,
        customerPhone: customer?.phone ?? null,
        deliveryMode: appointment.deliveryMode,
        window: slot ? formatSlotRange(slot.startsAt, slot.endsAt) : null,
        requestedAt: new Date(appointment.createdAt).toISOString(),
        notes: appointment.notes ?? null,
        statusNote: appointment.statusNote ?? null,
        address: address
          ? [address.line1, address.city, address.postalCode].filter(Boolean).join(", ")
          : null,
        items:
          items.length > 0
            ? items
                .map((item) => `${formatItemType(item.itemType)} × ${item.quantity}`)
                .join(", ")
            : "Not specified",
        amount: payment?.amount ?? service?.basePrice ?? "0",
        paymentStatus: payment?.status ?? "UNPAID",
        review: review
          ? {
              rating: review.rating,
              comment: review.comment ?? null,
              createdAt: new Date(review.createdAt).toISOString(),
            }
          : null,
      };
    }),
  );

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
