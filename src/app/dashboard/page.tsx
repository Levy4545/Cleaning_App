import Link from "next/link";
import { ArrowRight, CalendarPlus, CheckCircle2, Clock, Wallet } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge, statusTheme } from "@/components/ui/status-badge";
import { syncUserFromAuth } from "@/actions/auth";
import { requireUser } from "@/lib/auth/guards";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import { findSlotById, listAppointmentsForCustomer } from "@/db/queries/appointments";
import { findServiceById, listActiveServices } from "@/db/queries/services";
import { serviceIcon } from "@/lib/service-icon";
import { formatMoney, formatSlotRange } from "@/lib/format";

const OPEN_STATUSES = ["PENDING", "APPROVED", "ASSIGNED", "IN_PROGRESS"];

export default async function DashboardPage() {
  await syncUserFromAuth();
  const user = await requireUser();
  const shopId = await getDefaultShopId();

  const [appointments, services] = await Promise.all([
    listAppointmentsForCustomer(user.id, shopId),
    listActiveServices(shopId),
  ]);

  const rows = await Promise.all(
    appointments.map(async (appointment) => {
      const [service, slot] = await Promise.all([
        findServiceById(appointment.serviceId, shopId),
        findSlotById(appointment.slotId, shopId),
      ]);
      return { appointment, service, slot };
    }),
  );

  const open = rows.filter((row) => OPEN_STATUSES.includes(row.appointment.status));
  const completed = rows.filter((row) => row.appointment.status === "COMPLETED");
  const totalSpent = completed.reduce((sum, row) => sum + Number(row.service?.basePrice ?? 0), 0);

  const next = [...open].sort((a, b) => {
    const aTime = a.slot ? new Date(a.slot.startsAt).getTime() : Infinity;
    const bTime = b.slot ? new Date(b.slot.startsAt).getTime() : Infinity;
    return aTime - bTime;
  })[0];

  const recent = rows.slice(0, 4);

  return (
    <AppShell
      variant="customer"
      user={user}
      title="Dashboard"
      description={`Welcome back${user.name ? `, ${user.name}` : ""}.`}
      actions={
        <ButtonLink href="/book" size="sm">
          <CalendarPlus className="h-4 w-4" />
          Book a cleaning
        </ButtonLink>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Upcoming" value={open.length} icon={Clock} tone="amber" />
          <StatCard
            label="Completed"
            value={completed.length}
            icon={CheckCircle2}
            tone="emerald"
          />
          <StatCard
            label="Total spent"
            value={formatMoney(totalSpent)}
            icon={Wallet}
            tone="gold"
            hint="Cash paid on completion"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card glow className="lg:col-span-2">
            <CardTitle className="mb-4 text-base">Next appointment</CardTitle>

            {next ? (
              <NextAppointment
                serviceName={next.service?.name ?? "Service"}
                deliveryMode={next.appointment.deliveryMode}
                status={next.appointment.status}
                window={
                  next.slot
                    ? formatSlotRange(next.slot.startsAt, next.slot.endsAt)
                    : "Awaiting a confirmed window"
                }
              />
            ) : (
              <EmptyState
                icon={CalendarPlus}
                title="Nothing scheduled"
                description="Book a cleaning and it will show up here."
                action={
                  <ButtonLink href="/book" size="sm">
                    Book a cleaning
                  </ButtonLink>
                }
              />
            )}
          </Card>

          <Card>
            <CardTitle className="mb-4 text-base">Quick book</CardTitle>
            {services.length === 0 ? (
              <p className="text-sm text-ash">No services available yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {services.slice(0, 4).map((service) => {
                  const Icon = serviceIcon(null, service.name);
                  return (
                    <Link
                      key={service.id}
                      href={`/book?service=${service.id}`}
                      className="flex flex-col items-center gap-2 rounded-lg border border-line bg-surface px-3 py-4 text-center transition-colors hover:border-gold/40 hover:bg-elevated"
                    >
                      <Icon className="h-6 w-6 text-gold" strokeWidth={1.25} />
                      <span className="text-xs leading-tight text-ash">{service.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <Link
              href="/appointments"
              className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="text-sm text-ash">No bookings yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map(({ appointment, service, slot }) => (
                <li
                  key={appointment.id}
                  className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${statusTheme(appointment.status).accent}`}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-bone">
                    {service?.name ?? "Service"}
                  </span>
                  <span className="text-xs text-faint">
                    {slot
                      ? formatSlotRange(slot.startsAt, slot.endsAt)
                      : new Date(appointment.createdAt).toLocaleDateString()}
                  </span>
                  <StatusBadge status={appointment.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function NextAppointment({
  serviceName,
  deliveryMode,
  status,
  window,
}: {
  serviceName: string;
  deliveryMode: string;
  status: string;
  window: string;
}) {
  const Icon = serviceIcon(null, serviceName);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/5">
        <Icon className="h-6 w-6 text-gold" strokeWidth={1.25} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-display text-xl text-bone">{serviceName}</p>
        <p className="mt-1 text-sm text-ash">
          {deliveryMode === "ON_SITE" ? "On-site" : "Drop-off"} · {window}
        </p>
      </div>

      <StatusBadge status={status} />
    </div>
  );
}
