const money = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatMoney(amount: string | number) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return money.format(Number.isFinite(value) ? value : 0);
}

/**
 * Formats an inclusive service price range for display.
 *
 * @param min - Lower bound of the quote range
 * @param max - Upper bound of the quote range
 * @returns A single amount when bounds match, otherwise `"$min – $max"`
 */
export function formatPriceRange(min: string | number, max: string | number) {
  const low = typeof min === "string" ? Number(min) : min;
  const high = typeof max === "string" ? Number(max) : max;
  const safeLow = Number.isFinite(low) ? low : 0;
  const safeHigh = Number.isFinite(high) ? high : safeLow;

  if (safeLow === safeHigh) {
    return formatMoney(safeLow);
  }

  return `${formatMoney(safeLow)} – ${formatMoney(safeHigh)}`;
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

/** Title-cases a free-text item type option (e.g. leather → Leather). */
export function formatItemType(itemType: string) {
  if (!itemType) return itemType;
  return itemType
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
