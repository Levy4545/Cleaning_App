import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, Clock, Wallet } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Avatar } from "@/components/layout/app-sidebar";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth/guards";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import {
  findSlotById,
  listAppointmentsForShop,
  listSlotsForShop,
} from "@/db/queries/appointments";
import { findServiceById } from "@/db/queries/services";
import { findUserById } from "@/db/queries/users";
import { formatLongDate, formatMoney, formatSlotRange } from "@/lib/format";
import { getTranslator } from "@/i18n/server";

export default async function AdminHomePage() {
  const admin = await requireAdmin();
  const shopId = await getDefaultShopId();
  const { t, locale, catalogName } = await getTranslator();

  const [appointments, slots] = await Promise.all([
    listAppointmentsForShop(shopId),
    listSlotsForShop(shopId),
  ]);

  const pending = appointments.filter((a) => a.status === "PENDING");
  const approved = appointments.filter((a) => a.status === "APPROVED");
  const completed = appointments.filter((a) => a.status === "COMPLETED");
  const openSlots = slots.filter((s) => s.status === "OPEN").length;

  const attention = await Promise.all(
    [...pending, ...approved].slice(0, 5).map(async (appointment) => {
      const [service, customer, slot] = await Promise.all([
        findServiceById(appointment.serviceId, shopId),
        findUserById(appointment.customerId),
        findSlotById(appointment.slotId, shopId),
      ]);

      return {
        id: appointment.id,
        status: appointment.status,
        serviceName: catalogName(service?.name ?? t("common.service"), service?.id),
        customerName: customer?.name ?? null,
        customerEmail: customer?.email ?? t("common.customer"),
        window: slot ? formatSlotRange(slot.startsAt, slot.endsAt, locale) : t("admin.noWindow"),
      };
    }),
  );

  // Quote ranges — revenue uses the lower bound until cash PAID tracking lands.
  const completedPrices = await Promise.all(
    completed.map(async (appointment) => {
      const service = await findServiceById(appointment.serviceId, shopId);
      return Number(service?.priceMin ?? 0);
    }),
  );
  const revenue = completedPrices.reduce((sum, price) => sum + price, 0);

  return (
    <AppShell
      variant="admin"
      user={admin}
      title={t("admin.overview")}
      titleKey="admin.overview"
      description={formatLongDate(new Date(), locale)}
      actions={
        <ButtonLink href="/admin/calendar" size="sm">
          <CalendarClock className="h-4 w-4" />
          {t("admin.manageAvailability")}
        </ButtonLink>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t("admin.pending")} value={pending.length} icon={Clock} tone="amber" />
          <StatCard
            label={t("admin.approved")}
            value={approved.length}
            icon={CheckCircle2}
            tone="blue"
          />
          <StatCard
            label={t("admin.openSlots")}
            value={openSlots}
            icon={CalendarClock}
            tone="emerald"
          />
          <StatCard
            label={t("admin.revenue")}
            value={formatMoney(revenue, locale)}
            icon={Wallet}
            tone="gold"
            hint={t("admin.completedJobs", { n: completed.length })}
          />
        </div>

        <Card glow>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle className="text-base">{t("admin.needsAttention")}</CardTitle>
            <Link
              href="/admin/appointments"
              className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
            >
              {t("admin.openInbox")}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {attention.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title={t("admin.allClear")}
              description={t("admin.allClearBody")}
            />
          ) : (
            <ul className="divide-y divide-line">
              {attention.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Avatar name={row.customerName} email={row.customerEmail} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-bone">
                      {row.customerName ?? row.customerEmail}
                    </p>
                    <p className="truncate text-xs text-faint">
                      {row.serviceName} · {row.window}
                    </p>
                  </div>

                  <StatusBadge status={row.status} />

                  <ButtonLink href="/admin/appointments" size="sm" variant="secondary">
                    {t("admin.review")}
                  </ButtonLink>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
