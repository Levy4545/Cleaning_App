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
import { localeTag } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import {
  formatDay,
  formatDeliveryMode,
  formatItemType,
  formatPriceRange,
  formatTime,
} from "@/lib/format";
import { ServiceIcon } from "@/lib/service-icon";

type ServiceOption = {
  id: string;
  name: string;
  description: string | null;
  priceMin: string;
  priceMax: string;
  durationMinutes: number;
  requiresTimeWindow: boolean;
  deliveryModes: string[];
  itemTypeOptions: string[];
};

type StepId = "service" | "details" | "time" | "day" | "confirm";

function stepsForService(service?: ServiceOption): StepId[] {
  if (service && service.requiresTimeWindow === false) {
    return ["service", "details", "day", "confirm"];
  }
  return ["service", "details", "time", "confirm"];
}

type SlotOption = {
  id: string;
  startsAt: string;
  endsAt: string;
};

type DeliveryMode = "ON_SITE" | "DROP_OFF";

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

function initialItemTypeForService(service?: ServiceOption): string {
  return service?.itemTypeOptions[0] ?? "";
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
  availableDays = [],
  initialServiceId,
}: {
  services: ServiceOption[];
  slots: SlotOption[];
  availableDays?: string[];
  initialServiceId?: string;
}) {
  const router = useRouter();
  const { t, locale, catalogName } = useI18n();
  const initialService =
    services.find((s) => s.id === initialServiceId) ?? services[0] ?? undefined;

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(initialService?.id ?? "");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(() =>
    initialModeForService(initialService),
  );
  const [itemType, setItemType] = useState(() => initialItemTypeForService(initialService));
  const [quantity, setQuantity] = useState(1);
  const [slotId, setSlotId] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [details, setDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedSlot = slots.find((s) => s.id === slotId);
  const stepIds = stepsForService(selectedService);
  const currentStepId = stepIds[step] ?? "service";
  const needsWindow = selectedService?.requiresTimeWindow !== false;

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
    setItemType(initialItemTypeForService(next));
    if (next.requiresTimeWindow === false) {
      setSlotId("");
    } else {
      setRequestedDate("");
    }
    setStep((current) => Math.min(current, stepsForService(next).length - 1));
  };

  const itemTypeOptions = selectedService?.itemTypeOptions ?? [];

  const stepError = (): string | null => {
    if (currentStepId === "service" && !serviceId) return t("book.pickService");
    if (currentStepId === "details") {
      if (quantity < 1) return t("book.quantityMin");
      if (itemTypeOptions.length > 0 && !itemType) {
        return t("book.pickItemType");
      }
      if (deliveryMode === "ON_SITE" && (!addressLine1.trim() || !addressCity.trim())) {
        return t("book.needAddress");
      }
    }
    if (currentStepId === "time" && !slotId) return t("book.pickWindow");
    if (currentStepId === "day" && !requestedDate) return t("book.pickDay");
    return null;
  };

  const goNext = () => {
    const message = stepError();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, stepIds.length - 1));
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
        slotId: needsWindow && slotId ? slotId : undefined,
        requestedDate: !needsWindow && requestedDate ? requestedDate : undefined,
        preferredDeliveryMode: deliveryMode,
        itemType: itemTypeOptions.length > 0 ? itemType : undefined,
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
        <p className="text-sm text-ash">{t("book.noCatalog")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Stepper step={step} stepIds={stepIds} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <Card glow className="p-6 sm:p-8">
          {currentStepId === "service" ? (
            <StepShell title={t("book.chooseService")} hint={t("book.chooseServiceHint")}>
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
                        <span className="block text-sm font-medium text-bone">
                          {catalogName(service.name, service.id)}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-faint">
                          {t("common.minutes", { n: service.durationMinutes })} ·{" "}
                          {formatPriceRange(service.priceMin, service.priceMax, locale)}
                        </span>
                      </span>
                      {active ? <Check className="h-4 w-4 shrink-0 text-gold" /> : null}
                    </button>
                  );
                })}
              </div>
            </StepShell>
          ) : null}

          {currentStepId === "details" ? (
            <StepShell title={t("book.addDetails")} hint={t("book.addDetailsHint")}>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>{t("book.deliveryPreference")}</Label>
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
                        {formatDeliveryMode(mode, t)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-faint">{t("book.shopConfirms")}</p>
                </div>

                <div
                  className={cn(
                    "grid gap-4",
                    itemTypeOptions.length > 0 ? "sm:grid-cols-2" : "sm:grid-cols-1",
                  )}
                >
                  {itemTypeOptions.length > 0 ? (
                    <div className="space-y-2">
                      <Label htmlFor="itemType">{t("common.itemType")}</Label>
                      <Select
                        id="itemType"
                        value={itemType}
                        onChange={(e) => setItemType(e.target.value)}
                      >
                        {itemTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {formatItemType(option, t)}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="quantity">{t("common.quantity")}</Label>
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
                      {t("book.onSiteAddress")}
                    </p>

                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">{t("book.street")}</Label>
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
                        <Label htmlFor="addressCity">{t("book.city")}</Label>
                        <Input
                          id="addressCity"
                          value={addressCity}
                          onChange={(e) => setAddressCity(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="addressPostalCode">{t("book.postalCode")}</Label>
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
                  <Label htmlFor="details">{t("book.itemDetails")}</Label>
                  <Input
                    id="details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={t("book.itemDetailsPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t("common.notes")}</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("book.notesPlaceholder")}
                  />
                </div>
              </div>
            </StepShell>
          ) : null}

          {currentStepId === "time" ? (
            <StepShell title={t("book.pickTime")} hint={t("book.pickTimeHint")}>
              {days.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <CalendarX2 className="h-8 w-8 text-faint" />
                  <p className="text-sm text-ash">{t("book.noSlots")}</p>
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
                            {day.date.toLocaleDateString(localeTag(locale), { weekday: "short" })}
                          </span>
                          <span className="font-display text-lg leading-none">
                            {day.date.getDate()}
                          </span>
                          <span className="text-[10px] uppercase">
                            {day.date.toLocaleDateString(localeTag(locale), { month: "short" })}
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
                          {formatTime(slot.startsAt, locale)}
                        </button>
                      );
                    })}
                  </div>

                  <Alert tone="info">{t("book.onlyOpenWindows")}</Alert>
                </div>
              )}
            </StepShell>
          ) : null}

          {currentStepId === "day" ? (
            <StepShell title={t("book.pickDayTitle")} hint={t("book.pickDayHint")}>
              {availableDays.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <CalendarX2 className="h-8 w-8 text-faint" />
                  <p className="text-sm text-ash">{t("book.noDays")}</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableDays.map((day) => {
                    const active = day === requestedDate;
                    const date = new Date(`${day}T12:00:00`);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setRequestedDate(day)}
                        aria-pressed={active}
                        className={cn(
                          "flex w-16 flex-col items-center gap-0.5 rounded-lg border px-2 py-2.5 transition-colors",
                          active
                            ? "border-gold bg-gold text-ink"
                            : "border-line bg-surface text-ash hover:border-line-strong hover:text-bone",
                        )}
                      >
                        <span className="text-[10px] font-medium uppercase tracking-wider">
                          {date.toLocaleDateString(localeTag(locale), { weekday: "short" })}
                        </span>
                        <span className="font-display text-lg leading-none">{date.getDate()}</span>
                        <span className="text-[10px] uppercase">
                          {date.toLocaleDateString(localeTag(locale), { month: "short" })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </StepShell>
          ) : null}

          {currentStepId === "confirm" ? (
            <StepShell title={t("book.confirm")} hint={t("book.confirmHint")}>
              <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                <SummaryRow
                  label={t("common.service")}
                  value={
                    selectedService ? catalogName(selectedService.name, selectedService.id) : "—"
                  }
                />
                <SummaryRow
                  label={t("common.delivery")}
                  value={formatDeliveryMode(deliveryMode, t)}
                />
                {itemTypeOptions.length > 0 ? (
                  <SummaryRow
                    label={t("common.itemType")}
                    value={`${formatItemType(itemType, t)} × ${quantity}`}
                  />
                ) : (
                  <SummaryRow label={t("common.quantity")} value={String(quantity)} />
                )}
                <SummaryRow
                  label={t("common.estimate")}
                  value={
                    selectedService
                      ? formatPriceRange(selectedService.priceMin, selectedService.priceMax, locale)
                      : "—"
                  }
                />
                <SummaryRow
                  label={t("common.window")}
                  value={
                    selectedSlot
                      ? `${new Date(selectedSlot.startsAt).toLocaleDateString(localeTag(locale), {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })} · ${formatTime(selectedSlot.startsAt, locale)} – ${formatTime(selectedSlot.endsAt, locale)}`
                      : requestedDate
                        ? formatDay(`${requestedDate}T12:00:00`, locale)
                        : needsWindow
                          ? "—"
                          : t("common.toBeScheduled")
                  }
                />
                {!needsWindow ? (
                  <div className="px-4 py-3 text-xs text-faint">{t("book.noWindowNeeded")}</div>
                ) : null}
                {deliveryMode === "ON_SITE" ? (
                  <SummaryRow
                    label={t("common.address")}
                    value={[addressLine1, addressCity, addressPostalCode]
                      .filter(Boolean)
                      .join(", ")}
                  />
                ) : null}
                {details ? <SummaryRow label={t("common.details")} value={details} /> : null}
                {notes ? <SummaryRow label={t("common.notes")} value={notes} /> : null}
              </dl>

              <Alert tone="info" className="mt-4">
                {t("book.cashNote")}
              </Alert>
            </StepShell>
          ) : null}

          {error ? <Alert className="mt-5">{error}</Alert> : null}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
            <Button type="button" variant="ghost" onClick={goBack} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>

            {currentStepId !== "confirm" ? (
              <Button type="button" onClick={goNext}>
                {t("common.continue")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={submit} disabled={isPending}>
                {isPending ? t("book.sending") : t("book.requestBooking")}
              </Button>
            )}
          </div>
        </Card>

        <Card className="lg:sticky lg:top-28">
          <p className="font-display text-lg text-bone">{t("book.orderSummary")}</p>

          <dl className="mt-4 space-y-3 text-sm">
            <SummaryLine
              label={t("common.service")}
              value={
                selectedService
                  ? catalogName(selectedService.name, selectedService.id)
                  : t("common.notSelected")
              }
            />
            <SummaryLine
              label={t("common.delivery")}
              value={formatDeliveryMode(deliveryMode, t)}
            />
            {itemTypeOptions.length > 0 ? (
              <SummaryLine
                label={t("common.itemType")}
                value={itemType ? formatItemType(itemType, t) : t("common.notSelected")}
              />
            ) : null}
            <SummaryLine label={t("common.quantity")} value={String(quantity)} />
            <SummaryLine
              label={t("common.window")}
              value={
                selectedSlot
                  ? `${formatTime(selectedSlot.startsAt, locale)} – ${formatTime(selectedSlot.endsAt, locale)}`
                  : requestedDate
                    ? formatDay(`${requestedDate}T12:00:00`, locale)
                    : needsWindow
                      ? t("common.notSelected")
                      : t("common.toBeScheduled")
              }
            />
          </dl>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="text-sm text-ash">{t("common.estimate")}</span>
            <span className="font-display text-xl text-gold">
              {selectedService
                ? formatPriceRange(selectedService.priceMin, selectedService.priceMax, locale)
                : "—"}
            </span>
          </div>
          <p className="mt-2 text-xs text-faint">{t("book.rangeCash")}</p>
        </Card>
      </div>
    </div>
  );
}

function Stepper({ step, stepIds }: { step: number; stepIds: StepId[] }) {
  const { t } = useI18n();
  const labels: Record<StepId, string> = {
    service: t("book.stepService"),
    details: t("book.stepDetails"),
    time: t("book.stepTime"),
    day: t("book.stepDay"),
    confirm: t("book.stepConfirm"),
  };
  const steps = stepIds.map((id) => labels[id]);

  return (
    <ol className="flex items-center">
      {steps.map((label, index) => {
        const done = index < step;
        const current = index === step;

        return (
          <li key={label} className={cn("flex items-center", index < steps.length - 1 && "flex-1")}>
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

            {index < steps.length - 1 ? (
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
