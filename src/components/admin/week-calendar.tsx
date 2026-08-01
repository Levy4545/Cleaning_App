"use client";

import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";

import {
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  setAvailabilitySlotStatus,
  updateAvailabilitySlot,
} from "@/actions/availability";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { inputClasses } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type CalendarSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  bookedCount: number;
};

export type CalendarBooking = {
  id: string;
  slotId: string;
  status: string;
  startsAt: string;
  endsAt: string;
  customerEmail: string;
  serviceName: string;
  deliveryMode: string;
};

type CalendarTool = "FREE" | "OCCUPIED" | "UNAVAILABLE";

const HOUR_START = 7;
const HOUR_END = 20;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

const TOOL_TO_STATUS: Record<CalendarTool, "OPEN" | "FULL" | "BLOCKED"> = {
  FREE: "OPEN",
  OCCUPIED: "FULL",
  UNAVAILABLE: "BLOCKED",
};

const TOOLS: { id: CalendarTool; label: string; dot: string; active: string }[] = [
  {
    id: "FREE",
    label: "Free slot",
    dot: "bg-emerald-400",
    active: "border-emerald-500/60 bg-emerald-500/10 text-emerald-300",
  },
  {
    id: "OCCUPIED",
    label: "Occupied",
    dot: "bg-slate-400",
    active: "border-slate-400/60 bg-slate-400/10 text-slate-200",
  },
  {
    id: "UNAVAILABLE",
    label: "Unavailable",
    dot: "bg-red-400",
    active: "border-red-500/60 bg-red-500/10 text-red-300",
  },
];

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function statusLabel(status: string) {
  if (status === "OPEN") return "Free";
  if (status === "FULL") return "Occupied";
  if (status === "BLOCKED") return "Unavailable";
  return status;
}

function slotClasses(status: string) {
  if (status === "OPEN") {
    return "border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25";
  }
  if (status === "FULL") {
    return "border-slate-500/40 bg-slate-500/15 text-slate-300 hover:bg-slate-500/25";
  }
  if (status === "BLOCKED") {
    return "border-red-500/40 bg-red-500/15 text-red-200 hover:bg-red-500/25";
  }
  return "border-line bg-elevated text-ash";
}

function hoverClasses(tool: CalendarTool) {
  if (tool === "FREE") return "hover:bg-emerald-500/10";
  if (tool === "OCCUPIED") return "hover:bg-slate-500/10";
  return "hover:bg-red-500/10";
}

/**
 * Displays and manages a weekly availability calendar with booking information.
 *
 * @param slots - Availability slots shown in the calendar
 * @param bookings - Optional bookings associated with the availability slots
 */
/** Stable client clock for the "now" marker — getSnapshot must not return a fresh Date.now(). */
let cachedNowMs = 0;
const nowListeners = new Set<() => void>();
let nowTimer: ReturnType<typeof setInterval> | null = null;

function subscribeToNow(onStoreChange: () => void) {
  nowListeners.add(onStoreChange);
  if (nowTimer == null) {
    cachedNowMs = Date.now();
    nowTimer = setInterval(() => {
      cachedNowMs = Date.now();
      nowListeners.forEach((listener) => listener());
    }, 60_000);
  }
  return () => {
    nowListeners.delete(onStoreChange);
    if (nowListeners.size === 0 && nowTimer != null) {
      clearInterval(nowTimer);
      nowTimer = null;
    }
  };
}

function getNowSnapshot() {
  if (cachedNowMs === 0) {
    cachedNowMs = Date.now();
  }
  return cachedNowMs;
}

function getNowServerSnapshot() {
  return null as number | null;
}

export function WeekCalendar({
  slots,
  bookings = [],
}: {
  slots: CalendarSlot[];
  bookings?: CalendarBooking[];
}) {
  const router = useRouter();
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));
  const [tool, setTool] = useState<CalendarTool>("FREE");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Client-only "now" marker — avoids hydration mismatch without effect setState.
  const nowMs = useSyncExternalStore(subscribeToNow, getNowSnapshot, getNowServerSnapshot);
  const now = nowMs == null ? null : new Date(nowMs);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i)),
    [weekAnchor],
  );

  const selected = slots.find((s) => s.id === selectedSlotId) ?? null;
  const paintStatus = TOOL_TO_STATUS[tool];
  const bookingSlotIds = useMemo(
    () => new Set(bookings.map((booking) => booking.slotId)),
    [bookings],
  );

  const applyToCell = (day: Date, hour: number, existing?: CalendarSlot) => {
    setError(null);
    const startsAt = new Date(day);
    startsAt.setHours(hour, 0, 0, 0);
    const endsAt = new Date(startsAt);
    endsAt.setHours(hour + 1, 0, 0, 0);

    startTransition(async () => {
      if (existing) {
        const result = await setAvailabilitySlotStatus({
          slotId: existing.id,
          status: paintStatus,
        });
        if (!result.success) {
          setError(result.error);
          return;
        }
      } else {
        const result = await createAvailabilitySlot({
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          status: paintStatus,
        });
        if (!result.success) {
          setError(result.error);
          return;
        }
      }
      router.refresh();
    });
  };

  const run = (action: () => Promise<{ success: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error ?? "Action failed");
        return;
      }
      setSelectedSlotId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => setWeekAnchor((w) => addDays(w, -7))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ash transition-colors hover:border-line-strong hover:text-bone"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <p className="min-w-52 text-center font-display text-lg text-bone">
            {days[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} –{" "}
            {days[6].toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>

          <button
            type="button"
            aria-label="Next week"
            onClick={() => setWeekAnchor((w) => addDays(w, 7))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ash transition-colors hover:border-line-strong hover:text-bone"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekAnchor(startOfWeek(new Date()))}
          >
            Today
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-faint">Paint</span>
          {TOOLS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTool(item.id)}
              aria-pressed={tool === item.id}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                tool === item.id
                  ? item.active
                  : "border-line bg-surface text-ash hover:border-line-strong hover:text-bone",
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", item.dot)} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-faint">
        Click an empty cell to paint it, click an existing block to repaint, double-click to edit
        times. Amber blocks are pending bookings; sky blocks are completed jobs.
      </p>

      <div className="overflow-x-auto rounded-xl border border-line bg-panel">
        <div
          className="grid min-w-[860px]"
          style={{ gridTemplateColumns: "64px repeat(7, minmax(0, 1fr))" }}
        >
          <div className="border-b border-line bg-surface p-2" />
          {days.map((day) => {
            const today = now ? sameDay(day, now) : false;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "border-b border-l border-line bg-surface p-2 text-center",
                  today && "bg-gold/5",
                )}
              >
                <div className="text-[10px] font-medium uppercase tracking-wider text-faint">
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                </div>
                <div
                  className={cn(
                    "mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full font-display text-sm",
                    today ? "bg-gold text-ink" : "text-bone",
                  )}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}

          {HOURS.map((hour) => (
            <div key={hour} className="contents">
              <div className="border-b border-line/60 px-2 py-3 text-right text-[11px] text-faint">
                {`${String(hour).padStart(2, "0")}:00`}
              </div>

              {days.map((day) => {
                const cellStart = new Date(day);
                cellStart.setHours(hour, 0, 0, 0);
                const cellEnd = new Date(cellStart);
                cellEnd.setHours(hour + 1, 0, 0, 0);

                const cellSlots = slots.filter((slot) => {
                  // Hide availability block when a booking already represents this window.
                  if (bookingSlotIds.has(slot.id)) {
                    return false;
                  }
                  const start = new Date(slot.startsAt);
                  return start >= cellStart && start < cellEnd;
                });

                const cellBookings = bookings.filter((booking) => {
                  const start = new Date(booking.startsAt);
                  return start >= cellStart && start < cellEnd;
                });

                const showNowLine =
                  now !== null && sameDay(day, now) && now.getHours() === hour;

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="relative min-h-14 border-b border-l border-line/60 p-1"
                  >
                    {cellSlots.length === 0 && cellBookings.length === 0 ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => applyToCell(day, hour)}
                        className={cn(
                          "absolute inset-0 transition-colors disabled:opacity-60",
                          hoverClasses(tool),
                        )}
                        aria-label={`Paint ${hour}:00 as ${tool}`}
                      />
                    ) : null}

                    {cellBookings.map((booking) => {
                      const start = new Date(booking.startsAt);
                      const end = new Date(booking.endsAt);
                      const isCompleted = booking.status === "COMPLETED";

                      return (
                        <button
                          key={booking.id}
                          type="button"
                          onClick={() => router.push("/admin/appointments")}
                          className={cn(
                            "relative z-20 mb-1 block w-full rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight transition-colors",
                            isCompleted
                              ? "border-sky-500/40 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25"
                              : "border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25",
                          )}
                          title={`${booking.serviceName} · ${booking.customerEmail}`}
                        >
                          <span className="block font-medium">
                            {start.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            –
                            {end.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="block truncate opacity-80">{booking.serviceName}</span>
                        </button>
                      );
                    })}

                    {cellSlots.map((slot) => {
                      const start = new Date(slot.startsAt);
                      const end = new Date(slot.endsAt);

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isPending}
                          onClick={() => applyToCell(day, hour, slot)}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            setSelectedSlotId(slot.id);
                          }}
                          className={cn(
                            "relative z-10 mb-1 block w-full rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight transition-colors",
                            slotClasses(slot.status),
                            selectedSlotId === slot.id &&
                              "ring-2 ring-gold ring-offset-1 ring-offset-panel",
                          )}
                        >
                          <span className="block font-medium">
                            {start.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            –
                            {end.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="block opacity-80">{statusLabel(slot.status)}</span>
                        </button>
                      );
                    })}

                    {showNowLine && now ? (
                      <span
                        className="pointer-events-none absolute inset-x-0 z-30 flex items-center"
                        style={{ top: `${(now.getMinutes() / 60) * 100}%` }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                        <span className="h-px flex-1 bg-gold" />
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-faint">
        <LegendItem className="border-emerald-500/40 bg-emerald-500/15" label="Free" />
        <LegendItem className="border-slate-500/40 bg-slate-500/15" label="Occupied" />
        <LegendItem className="border-red-500/40 bg-red-500/15" label="Unavailable" />
        <LegendItem className="border-amber-500/40 bg-amber-500/15" label="Pending booking" />
        <LegendItem className="border-sky-500/40 bg-sky-500/15" label="Completed" />
      </div>

      {selected ? (
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg text-bone">Edit slot</p>
              <p className="mt-1 text-sm text-ash">
                {new Date(selected.startsAt).toLocaleString()} →{" "}
                {new Date(selected.endsAt).toLocaleString()} · {statusLabel(selected.status)}
                {selected.bookedCount > 0
                  ? ` · ${selected.bookedCount} booking request(s)`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setSelectedSlotId(null)}
              className="rounded-md p-1.5 text-faint transition-colors hover:bg-elevated hover:text-bone"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form
            className="mt-5 grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              run(() =>
                updateAvailabilitySlot({
                  slotId: selected.id,
                  startsAt: new Date(String(form.get("startsAt"))).toISOString(),
                  endsAt: new Date(String(form.get("endsAt"))).toISOString(),
                }),
              );
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="startsAt">Starts</Label>
              <input
                id="startsAt"
                name="startsAt"
                type="datetime-local"
                defaultValue={toLocalInputValue(new Date(selected.startsAt))}
                className={inputClasses}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endsAt">Ends</Label>
              <input
                id="endsAt"
                name="endsAt"
                type="datetime-local"
                defaultValue={toLocalInputValue(new Date(selected.endsAt))}
                className={inputClasses}
              />
            </div>

            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button type="submit" disabled={isPending}>
                Save times
              </Button>
              <Button
                type="button"
                variant="danger-outline"
                disabled={isPending}
                onClick={() => run(() => deleteAvailabilitySlot(selected.id))}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {error ? <Alert>{error}</Alert> : null}
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-3 w-3 rounded border", className)} />
      {label}
    </span>
  );
}
