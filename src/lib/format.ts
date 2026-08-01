const money = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatMoney(amount: string | number) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return money.format(Number.isFinite(value) ? value : 0);
}

export function formatDay(value: Date | string) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatTime(value: Date | string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** "Sat 14 Feb · 10:00 – 12:00" */
export function formatSlotRange(startsAt: Date | string, endsAt: Date | string) {
  return `${formatDay(startsAt)} · ${formatTime(startsAt)} – ${formatTime(endsAt)}`;
}

export function formatDeliveryMode(mode: string) {
  return mode === "ON_SITE" ? "On-site" : "Drop-off";
}

export function formatItemType(itemType: string) {
  return itemType.charAt(0) + itemType.slice(1).toLowerCase();
}
