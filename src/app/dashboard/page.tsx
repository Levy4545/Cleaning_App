import Link from "next/link";
import { ArrowRight, CalendarPlus, CheckCircle2, Clock } from "lucide-react";

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
import { ServiceIcon } from "@/lib/service-icon";
import { formatDeliveryMode, formatSlotRange } from "@/lib/format";
import { localeTag, translateCatalogName } from "@/i18n/format";
import { getTranslator } from "@/i18n/server";

const OPEN_STATUSES = ["PENDING", "APPROVED", "ASSIGNED", "IN_PROGRESS"];

/**
 * Renders the authenticated customer's dashboard with appointment summaries,
 * upcoming bookings, available services, and recent activity.
 *
 * @returns The customer dashboard view.
 */
export default async function DashboardPage() {
  await syncUserFromAuth();
  const user = await requireUser();
  const shopId = await getDefaultShopId();
  const { t, locale } = await getTranslator();

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
      title={t("dashboard.title")}
      description={
        user.name ? t("dashboard.welcomeNamed", { name: user.name }) : t("dashboard.welcome")
      }
      actions={
        <ButtonLink href="/book" size="sm">
          <CalendarPlus className="h-4 w-4" />
          {t("dashboard.bookCta")}
        </ButtonLink>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label={t("dashboard.upcoming")} value={open.length} icon={Clock} tone="amber" />
          <StatCard
            label={t("dashboard.completed")}
            value={completed.length}
            icon={CheckCircle2}
            tone="emerald"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card glow className="lg:col-span-2">
            <CardTitle className="mb-4 text-base">{t("dashboard.nextAppointment")}</CardTitle>

            {next ? (
              <NextAppointment
                serviceName={translateCatalogName(t, next.service?.name ?? t("common.service"))}
                deliveryMode={formatDeliveryMode(next.appointment.deliveryMode, t)}
                status={next.appointment.status}
                window={
                  next.slot
                    ? formatSlotRange(next.slot.startsAt, next.slot.endsAt, locale)
                    : t("dashboard.awaitingWindow")
                }
              />
            ) : (
              <EmptyState
                icon={CalendarPlus}
                title={t("dashboard.nothingScheduled")}
                description={t("dashboard.nothingScheduledBody")}
                action={
                  <ButtonLink href="/book" size="sm">
                    {t("dashboard.bookCta")}
                  </ButtonLink>
                }
              />
            )}
          </Card>

          <Card>
            <CardTitle className="mb-4 text-base">{t("dashboard.quickBook")}</CardTitle>
            {services.length === 0 ? (
              <p className="text-sm text-ash">{t("dashboard.noServices")}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {services.slice(0, 4).map((service) => (
                  <Link
                    key={service.id}
                    href={`/book?service=${service.id}`}
                    className="flex flex-col items-center gap-2 rounded-lg border border-line bg-surface px-3 py-4 text-center transition-colors hover:border-gold/40 hover:bg-elevated"
                  >
                    <ServiceIcon
                      serviceName={service.name}
                      className="h-6 w-6 text-gold"
                      strokeWidth={1.25}
                    />
                    <span className="text-xs leading-tight text-ash">
                      {translateCatalogName(t, service.name)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle className="text-base">{t("dashboard.recent")}</CardTitle>
            <Link
              href="/appointments"
              className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
            >
              {t("common.viewAll")}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="text-sm text-ash">{t("dashboard.noBookings")}</p>
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
                    {translateCatalogName(t, service?.name ?? t("common.service"))}
                  </span>
                  <span className="text-xs text-faint">
                    {slot
                      ? formatSlotRange(slot.startsAt, slot.endsAt, locale)
                      : new Date(appointment.createdAt).toLocaleDateString(localeTag(locale))}
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

/**
 * Displays the next appointment's service, delivery mode, time window, and status.
 *
 * @param serviceName - The appointment's service name.
 * @param deliveryMode - The appointment's delivery mode.
 * @param status - The appointment's current status.
 * @param window - The appointment's scheduled time window.
 */
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
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/5">
        <ServiceIcon serviceName={serviceName} className="h-6 w-6 text-gold" strokeWidth={1.25} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-display text-xl text-bone">{serviceName}</p>
        <p className="mt-1 text-sm text-ash">
          {deliveryMode} · {window}
        </p>
      </div>

      <StatusBadge status={status} />
    </div>
  );
}
