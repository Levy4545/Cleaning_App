"use client";

import { useState, useTransition } from "react";
import { CalendarPlus } from "lucide-react";

import { cancelAppointment } from "@/actions/appointments";
import { ReviewForm } from "@/components/booking/review-form";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StarDisplay } from "@/components/ui/star-rating";
import { StatusBadge, statusTheme } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { formatDeliveryMode, formatMoney, formatSlotRange } from "@/lib/format";
import { ServiceIcon } from "@/lib/service-icon";

export type AppointmentRow = {
  id: string;
  serviceName: string;
  price: string;
  status: string;
  deliveryMode: string;
  createdAt: string;
  slotStart: string | null;
  slotEnd: string | null;
  statusNote: string | null;
  review: { rating: number; comment: string | null } | null;
};

const FILTERS = [
  { id: "ALL", label: "All", match: () => true },
  { id: "PENDING", label: "Pending", match: (s: string) => s === "PENDING" },
  {
    id: "ACTIVE",
    label: "Approved",
    match: (s: string) => s === "APPROVED" || s === "ASSIGNED" || s === "IN_PROGRESS",
  },
  { id: "COMPLETED", label: "Completed", match: (s: string) => s === "COMPLETED" },
  {
    id: "CLOSED",
    label: "Cancelled",
    match: (s: string) =>
      s === "REJECTED" || s === "CANCELLED_BY_USER" || s === "CANCELLED_BY_ADMIN",
  },
];

const CLOSED_STATUSES = ["REJECTED", "CANCELLED_BY_USER", "CANCELLED_BY_ADMIN"];
const CANCELLABLE = ["PENDING", "APPROVED"];

/**
 * Displays bookings with status filters and an empty state when no bookings exist.
 *
 * @param rows - The bookings to display and filter.
 * @returns The rendered booking list or empty state.
 */
export function AppointmentList({ rows }: { rows: AppointmentRow[] }) {
  const [filter, setFilter] = useState("ALL");

  const active = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
  const visible = rows.filter((row) => active.match(row.status));

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={CalendarPlus}
        title="No bookings yet"
        description="Request your first cleaning and track its progress here."
        action={
          <ButtonLink href="/book" size="sm">
            Book a cleaning
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const count = rows.filter((row) => item.match(row.status)).length;
          const selected = item.id === filter;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              aria-pressed={selected}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                selected
                  ? "border-gold bg-gold font-medium text-ink"
                  : "border-line bg-panel text-ash hover:border-line-strong hover:text-bone",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  selected ? "bg-ink/15 text-ink" : "bg-elevated text-faint",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-ash">Nothing in this filter.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((row) => (
            <AppointmentCard key={row.id} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Displays an appointment with its service details, status, pricing, review, and available actions.
 *
 * @param row - The appointment data to display
 * @returns The rendered appointment card
 */
function AppointmentCard({ row }: { row: AppointmentRow }) {
  const theme = statusTheme(row.status);
  const closed = CLOSED_STATUSES.includes(row.status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onCancel = () => {
    if (!window.confirm("Cancel this booking? The time window will open again.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await cancelAppointment(row.id);
      if (result && !result.success) {
        setError(result.error);
      }
    });
  };

  return (
    <li
      className={cn(
        "relative overflow-hidden rounded-xl border border-line bg-panel pl-5",
        closed && "opacity-70",
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", theme.accent)} />

      <div className="p-5">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/5">
            <ServiceIcon serviceName={row.serviceName} className="h-5 w-5 text-gold" strokeWidth={1.25} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-display text-lg text-bone">{row.serviceName}</p>
            <p className={cn("mt-0.5 text-sm text-ash", closed && "line-through")}>
              {formatDeliveryMode(row.deliveryMode)} ·{" "}
              {row.slotStart && row.slotEnd
                ? formatSlotRange(row.slotStart, row.slotEnd)
                : `Requested ${new Date(row.createdAt).toLocaleDateString()}`}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={row.status} />
            <span className="font-display text-lg text-gold">{formatMoney(row.price)}</span>
          </div>
        </div>

        {row.statusNote && row.status === "REJECTED" ? (
          <Alert className="mt-4" title="Message from the shop">
            {row.statusNote}
          </Alert>
        ) : null}

        {row.review ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <StarDisplay rating={row.review.rating} />
            <span className="text-sm text-ash">
              {row.review.comment ? row.review.comment : "Thanks for rating this job."}
            </span>
          </div>
        ) : null}

        {row.status === "COMPLETED" && !row.review ? (
          <ReviewForm appointmentId={row.id} />
        ) : null}

        {CANCELLABLE.includes(row.status) ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="danger-outline"
              size="sm"
              disabled={isPending}
              onClick={onCancel}
            >
              {isPending ? "Cancelling…" : "Cancel booking"}
            </Button>
            {error ? <span className="text-sm text-red-400">{error}</span> : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
