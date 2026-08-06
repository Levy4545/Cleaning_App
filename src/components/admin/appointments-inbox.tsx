"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  Inbox,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Search,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react";

import { AppointmentAdminActions } from "@/components/admin/appointment-admin-actions";
import { Avatar } from "@/components/layout/app-sidebar";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { StarDisplay } from "@/components/ui/star-rating";
import { StatusBadge, statusTheme } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { formatDeliveryMode, formatMoney } from "@/lib/format";

export type InboxRow = {
  id: string;
  status: string;
  serviceName: string;
  customerName: string | null;
  customerEmail: string;
  customerPhone: string | null;
  deliveryMode: "ON_SITE" | "DROP_OFF";
  window: string | null;
  requestedAt: string;
  notes: string | null;
  statusNote: string | null;
  address: string | null;
  items: string;
  /** Human-readable service quote range. */
  priceLabel: string;
  amount: string;
  paymentStatus: string;
  review: { rating: number; comment: string | null; createdAt: string } | null;
};

const TIMELINE = [
  { key: "REQUESTED", label: "Request received" },
  { key: "APPROVED", label: "Approved by shop" },
  { key: "ASSIGNED", label: "Assigned to cleaner" },
  { key: "COMPLETED", label: "Completed" },
];

function timelineProgress(status: string) {
  if (status === "COMPLETED") return 4;
  if (status === "ASSIGNED" || status === "IN_PROGRESS") return 3;
  if (status === "APPROVED") return 2;
  return 1;
}

export function AppointmentsInbox({ rows }: { rows: InboxRow[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? null);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.customerName, row.customerEmail, row.serviceName, row.status]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term)),
    );
  }, [rows, query]);

  const selected = visible.find((row) => row.id === selectedId) ?? visible[0] ?? null;

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-panel">
        <EmptyState
          icon={Inbox}
          title="No appointments yet"
          description="Booking requests from customers will land here."
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr] lg:items-start">
      <div className="overflow-hidden rounded-xl border border-line bg-panel">
        <div className="border-b border-line p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer or service"
              className="pl-9"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="p-6 text-center text-sm text-ash">No matches.</p>
        ) : (
          <ul className="max-h-[70vh] overflow-y-auto">
            {visible.map((row) => {
              const active = selected?.id === row.id;
              const theme = statusTheme(row.status);

              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "relative flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors",
                      active ? "bg-gold/10" : "hover:bg-elevated",
                    )}
                  >
                    <span className={cn("absolute inset-y-0 left-0 w-0.5", theme.accent)} />
                    <Avatar name={row.customerName} email={row.customerEmail} />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-bone">
                        {row.customerName ?? row.customerEmail}
                      </span>
                      <span className="block truncate text-xs text-faint">
                        {row.serviceName} ·{" "}
                        {new Date(row.requestedAt).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </span>

                    <StatusBadge status={row.status} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected ? <InboxDetail row={selected} /> : null}
    </div>
  );
}

function InboxDetail({ row }: { row: InboxRow }) {
  const reached = timelineProgress(row.status);

  return (
    <div className="space-y-4 rounded-xl border border-line bg-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-tight text-bone">
            {row.customerName ?? row.customerEmail}
          </h2>
          <p className="mt-1 text-sm text-ash">
            Requested {new Date(row.requestedAt).toLocaleString()}
          </p>
        </div>
        <StatusBadge status={row.status} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <InfoTile icon={Sparkles} label="Service" value={row.serviceName} />
        <InfoTile icon={Truck} label="Delivery" value={formatDeliveryMode(row.deliveryMode)} />
        <InfoTile icon={Package} label="Items" value={row.items} />
        <InfoTile icon={CalendarClock} label="Window" value={row.window ?? "Not scheduled"} />
        <InfoTile icon={MapPin} label="Address" value={row.address ?? "Drop-off at shop"} />
        <InfoTile icon={Phone} label="Phone" value={row.customerPhone ?? row.customerEmail} />
      </div>

      {row.notes ? (
        <div className="rounded-lg border border-line bg-surface p-4">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ash">
            <MessageSquare className="h-3.5 w-3.5" />
            Notes
          </p>
          <p className="mt-2 text-sm leading-relaxed text-bone">{row.notes}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-line bg-surface px-4 py-3">
        <Wallet className="h-5 w-5 text-gold" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-bone">Quote range</p>
          <p className="text-xs text-faint">
            Cash on completion
            {row.paymentStatus === "PAID" ? ` · recorded ${formatMoney(row.amount)}` : ""}
          </p>
        </div>
        <span className="font-display text-xl text-gold">{row.priceLabel}</span>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs font-medium",
            row.paymentStatus === "PAID"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-amber-500/30 bg-amber-500/10 text-amber-300",
          )}
        >
          {row.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
        </span>
      </div>

      <ol className="space-y-0 rounded-lg border border-line bg-surface p-4">
        {TIMELINE.map((step, index) => {
          const done = index < reached;

          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "mt-1 h-2.5 w-2.5 rounded-full border",
                    done ? "border-gold bg-gold" : "border-line-strong bg-transparent",
                  )}
                />
                {index < TIMELINE.length - 1 ? (
                  <span
                    className={cn("w-px flex-1", index + 1 < reached ? "bg-gold/50" : "bg-line")}
                  />
                ) : null}
              </div>
              <span
                className={cn(
                  "pb-4 text-sm",
                  done ? "text-bone" : "text-faint",
                  index === TIMELINE.length - 1 && "pb-0",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {row.statusNote && row.status === "REJECTED" ? (
        <Alert title="Rejection message sent to client">{row.statusNote}</Alert>
      ) : null}

      {row.review ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <StarDisplay rating={row.review.rating} />
            <span className="text-xs text-faint">
              {new Date(row.review.createdAt).toLocaleDateString()}
            </span>
          </div>
          {row.review.comment ? (
            <p className="mt-2 text-sm text-bone">{row.review.comment}</p>
          ) : null}
        </div>
      ) : row.status === "COMPLETED" ? (
        <p className="text-sm text-faint">No review yet.</p>
      ) : null}

      <div className="border-t border-line pt-4">
        <AppointmentAdminActions
          appointmentId={row.id}
          status={row.status}
          preferredDeliveryMode={row.deliveryMode}
        />
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3">
      <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-faint">
        <Icon className="h-3.5 w-3.5 text-gold" />
        {label}
      </p>
      <p className="mt-1.5 text-sm leading-snug text-bone">{value}</p>
    </div>
  );
}
