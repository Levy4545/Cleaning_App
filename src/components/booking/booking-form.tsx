"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarX2, Check, MapPin } from "lucide-react";

import { bookAppointment } from "@/actions/appointments";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDeliveryMode, formatMoney, formatTime } from "@/lib/format";
import { ServiceIcon } from "@/lib/service-icon";

type ServiceOption = {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  durationMinutes: number;
  deliveryModes: string[];
};

type SlotOption = {
  id: string;
  startsAt: string;
  endsAt: string;
};

type DeliveryMode = "ON_SITE" | "DROP_OFF";
type ItemType = "CAR" | "CARPET" | "CHAIR" | "COUCH" | "OTHER";

const STEPS = ["Service", "Details", "Time", "Confirm"];

const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: "CAR", label: "Car" },
  { value: "CARPET", label: "Carpet" },
  { value: "CHAIR", label: "Chair" },
  { value: "COUCH", label: "Couch" },
  { value: "OTHER", label: "Other" },
];

/**
 * Creates a local calendar-day key from an ISO date string.
 *
 * @param iso - The ISO date string to convert
 * @returns A string containing the local year, month index, and day
 */
function dayKey(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Selects the initial delivery mode supported by a service.
 *
 * @param service - The service whose supported delivery modes are evaluated
 * @returns `DROP_OFF` when supported, otherwise `ON_SITE` when supported, or `DROP_OFF` when no supported mode is available
 */
function initialModeForService(service?: ServiceOption): DeliveryMode {
  const modes = service?.deliveryModes ?? [];
  if (modes.includes("DROP_OFF")) return "DROP_OFF";
  if (modes.includes("ON_SITE")) return "ON_SITE";
  return "DROP_OFF";
}

/**
 * Renders a multi-step form for selecting a service, providing booking details, choosing an available time slot, and submitting an appointment request.
 *
 * @param services - Services available for booking
 * @param slots - Available appointment time slots
 * @param initialServiceId - Optional service ID to select initially
 */
export function BookingForm({
  services,
  slots,
  initialServiceId,
}: {
  services: ServiceOption[];
  slots: SlotOption[];
  initialServiceId?: string;
}) {
  const router = useRouter();
  const initialService =
    services.find((s) => s.id === initialServiceId) ?? services[0] ?? undefined;

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(initialService?.id ?? "");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(() =>
    initialModeForService(initialService),
  );
  const [itemType, setItemType] = useState<ItemType>("CARPET");
  const [quantity, setQuantity] = useState(1);
  const [slotId, setSlotId] = useState("");
  const [details, setDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedSlot = slots.find((s) => s.id === slotId);

  const availableModes = useMemo(() => {
    const modes = selectedService?.deliveryModes ?? ["DROP_OFF"];
    return modes.filter((m): m is DeliveryMode => m === "ON_SITE" || m === "DROP_OFF");
  }, [selectedService]);

  const days = useMemo(() => {
    const groups = new Map<string, { date: Date; slots: SlotOption[] }>();
    for (const slot of slots) {
      const key = dayKey(slot.startsAt);
      const group = groups.get(key);
      if (group) {
        group.slots.push(slot);
      } else {
        groups.set(key, { date: new Date(slot.startsAt), slots: [slot] });
      }
    }
    return [...groups.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [slots]);

  const [activeDayKey, setActiveDayKey] = useState(
    () => (days[0] ? dayKey(days[0].slots[0].startsAt) : ""),
  );
  const activeDay = days.find((day) => dayKey(day.slots[0].startsAt) === activeDayKey) ?? days[0];

  const selectService = (next: ServiceOption) => {
    setServiceId(next.id);
    setDeliveryMode(initialModeForService(next));
  };

  const stepError = (): string | null => {
    if (step === 0 && !serviceId) return "Pick a service to continue.";
    if (step === 1) {
      if (quantity < 1) return "Quantity must be at least 1.";
      if (deliveryMode === "ON_SITE" && (!addressLine1.trim() || !addressCity.trim())) {
        return "On-site bookings need a street and city.";
      }
    }
    if (step === 2 && !slotId) return "Choose a time window to continue.";
    return null;
  };

  const goNext = () => {
    const message = stepError();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await bookAppointment({
        serviceId,
        slotId,
        preferredDeliveryMode: deliveryMode,
        itemType,
        quantity,
        notes: notes || undefined,
        details: details || undefined,
        addressLine1: addressLine1 || undefined,
        addressCity: addressCity || undefined,
        addressPostalCode: addressPostalCode || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push("/appointments");
      router.refresh();
    });
  };

  if (services.length === 0) {
    return (
      <Card>
        <p className="text-sm text-ash">
          No services available. Ask an admin to seed the catalog.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <Card glow className="p-6 sm:p-8">
          {step === 0 ? (
            <StepShell
              title="Choose a service"
              hint="Pick what needs cleaning. You can add details next."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {services.map((service) => {
                  const active = service.id === serviceId;

                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => selectService(service)}
                      aria-pressed={active}
                      className={cn(
                        "flex gap-3 rounded-xl border p-4 text-left transition-colors",
                        active
                          ? "border-gold/60 bg-gold/5"
                          : "border-line bg-surface hover:border-line-strong hover:bg-elevated",
                      )}
                    >
                      <ServiceIcon
                        serviceName={service.name}
                        className={cn("h-6 w-6 shrink-0", active ? "text-gold" : "text-ash")}
                        strokeWidth={1.25}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-bone">{service.name}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-faint">
                          {service.durationMinutes} min · {formatMoney(service.basePrice)}
                        </span>
                      </span>
                      {active ? <Check className="h-4 w-4 shrink-0 text-gold" /> : null}
                    </button>
                  );
                })}
              </div>
            </StepShell>
          ) : null}

          {step === 1 ? (
            <StepShell title="Add the details" hint="Tell us what we are working with.">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Delivery preference</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableModes.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDeliveryMode(mode)}
                        aria-pressed={deliveryMode === mode}
                        className={cn(
                          "rounded-lg border px-4 py-2 text-sm transition-colors",
                          deliveryMode === mode
                            ? "border-gold/60 bg-gold/10 text-gold"
                            : "border-line bg-surface text-ash hover:border-line-strong hover:text-bone",
                        )}
                      >
                        {formatDeliveryMode(mode)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-faint">The shop confirms this when approving.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="itemType">Item type</Label>
                    <Select
                      id="itemType"
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value as ItemType)}
                    >
                      {ITEM_TYPES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </div>
                </div>

                {deliveryMode === "ON_SITE" ? (
                  <div className="space-y-4 rounded-xl border border-line bg-surface p-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-bone">
                      <MapPin className="h-4 w-4 text-gold" />
                      On-site address
                    </p>

                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Street</Label>
                      <Input
                        id="addressLine1"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="221B Baker Street"
                        required
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="addressCity">City</Label>
                        <Input
                          id="addressCity"
                          value={addressCity}
                          onChange={(e) => setAddressCity(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="addressPostalCode">Postal code</Label>
                        <Input
                          id="addressPostalCode"
                          value={addressPostalCode}
                          onChange={(e) => setAddressPostalCode(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="details">Item details</Label>
                  <Input
                    id="details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Size, stains, plate number..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything else the shop should know?"
                  />
                </div>
              </div>
            </StepShell>
          ) : null}

          {step === 2 ? (
            <StepShell title="Pick a time" hint="Select a date and window that works for you.">
              {days.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <CalendarX2 className="h-8 w-8 text-faint" />
                  <p className="text-sm text-ash">
                    No open availability yet. Check back soon or contact the shop.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {days.map((day) => {
                      const key = dayKey(day.slots[0].startsAt);
                      const active = key === activeDayKey;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setActiveDayKey(key)}
                          aria-pressed={active}
                          className={cn(
                            "flex w-16 flex-col items-center gap-0.5 rounded-lg border px-2 py-2.5 transition-colors",
                            active
                              ? "border-gold bg-gold text-ink"
                              : "border-line bg-surface text-ash hover:border-line-strong hover:text-bone",
                          )}
                        >
                          <span className="text-[10px] font-medium uppercase tracking-wider">
                            {day.date.toLocaleDateString(undefined, { weekday: "short" })}
                          </span>
                          <span className="font-display text-lg leading-none">
                            {day.date.getDate()}
                          </span>
                          <span className="text-[10px] uppercase">
                            {day.date.toLocaleDateString(undefined, { month: "short" })}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {activeDay?.slots.map((slot) => {
                      const active = slot.id === slotId;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSlotId(slot.id)}
                          aria-pressed={active}
                          className={cn(
                            "rounded-lg border px-3 py-2.5 text-sm transition-colors",
                            active
                              ? "border-gold bg-gold font-medium text-ink"
                              : "border-line bg-surface text-bone hover:border-gold/40 hover:bg-elevated",
                          )}
                        >
                          {formatTime(slot.startsAt)}
                        </button>
                      );
                    })}
                  </div>

                  <Alert tone="info">
                    Only open windows are listed. The shop confirms your slot when it reviews the
                    request.
                  </Alert>
                </div>
              )}
            </StepShell>
          ) : null}

          {step === 3 ? (
            <StepShell title="Confirm your booking" hint="Review before sending the request.">
              <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                <SummaryRow label="Service" value={selectedService?.name ?? "—"} />
                <SummaryRow label="Delivery" value={formatDeliveryMode(deliveryMode)} />
                <SummaryRow
                  label="Item"
                  value={`${ITEM_TYPES.find((i) => i.value === itemType)?.label} × ${quantity}`}
                />
                <SummaryRow
                  label="Window"
                  value={
                    selectedSlot
                      ? `${new Date(selectedSlot.startsAt).toLocaleDateString(undefined, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })} · ${formatTime(selectedSlot.startsAt)} – ${formatTime(selectedSlot.endsAt)}`
                      : "—"
                  }
                />
                {deliveryMode === "ON_SITE" ? (
                  <SummaryRow
                    label="Address"
                    value={[addressLine1, addressCity, addressPostalCode]
                      .filter(Boolean)
                      .join(", ")}
                  />
                ) : null}
                {details ? <SummaryRow label="Details" value={details} /> : null}
                {notes ? <SummaryRow label="Notes" value={notes} /> : null}
              </dl>

              <Alert tone="info" className="mt-4">
                Payment is cash on completion. You can cancel while the request is pending
                or after approval (before the job starts).
              </Alert>
            </StepShell>
          ) : null}

          {error ? <Alert className="mt-5">{error}</Alert> : null}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
            <Button type="button" variant="ghost" onClick={goBack} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={goNext}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={submit} disabled={isPending}>
                {isPending ? "Sending request..." : "Request booking"}
              </Button>
            )}
          </div>
        </Card>

        <Card className="lg:sticky lg:top-28">
          <p className="font-display text-lg text-bone">Order summary</p>

          <dl className="mt-4 space-y-3 text-sm">
            <SummaryLine label="Service" value={selectedService?.name ?? "Not selected"} />
            <SummaryLine label="Delivery" value={formatDeliveryMode(deliveryMode)} />
            <SummaryLine label="Quantity" value={String(quantity)} />
            <SummaryLine
              label="Window"
              value={
                selectedSlot
                  ? `${formatTime(selectedSlot.startsAt)} – ${formatTime(selectedSlot.endsAt)}`
                  : "Not selected"
              }
            />
          </dl>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="text-sm text-ash">Total</span>
            <span className="font-display text-2xl text-gold">
              {formatMoney(selectedService?.basePrice ?? 0)}
            </span>
          </div>
          <p className="mt-2 text-xs text-faint">Flat rate per service, paid in cash.</p>
        </Card>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center">
      {STEPS.map((label, index) => {
        const done = index < step;
        const current = index === step;

        return (
          <li key={label} className={cn("flex items-center", index < STEPS.length - 1 && "flex-1")}>
            <div className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                  done && "border-gold bg-gold text-ink",
                  current && "border-gold bg-gold/10 text-gold shadow-[0_0_0_4px_rgba(212,175,55,0.12)]",
                  !done && !current && "border-line text-faint",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-xs",
                  current ? "text-gold" : done ? "text-ash" : "text-faint",
                )}
              >
                {label}
              </span>
            </div>

            {index < STEPS.length - 1 ? (
              <span
                className={cn(
                  "mx-2 -mt-6 h-px flex-1 transition-colors",
                  index < step ? "bg-gold/60" : "bg-line",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function StepShell({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl tracking-tight text-bone">{title}</h2>
        <p className="mt-1 text-sm text-ash">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-3 bg-surface px-4 py-3">
      <dt className="text-xs uppercase tracking-wider text-faint">{label}</dt>
      <dd className="max-w-[60%] text-right text-sm text-bone">{value}</dd>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ash">{label}</dt>
      <dd className="max-w-[60%] truncate text-right text-bone">{value}</dd>
    </div>
  );
}
