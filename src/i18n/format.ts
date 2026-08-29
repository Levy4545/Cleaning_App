import type { MessageKey, Translator } from "@/i18n/dictionary";
import { LOCALE_TAGS, type Locale } from "@/i18n/locales";

const STATUS_KEYS: Record<string, MessageKey> = {
  PENDING: "status.PENDING",
  APPROVED: "status.APPROVED",
  ASSIGNED: "status.ASSIGNED",
  IN_PROGRESS: "status.IN_PROGRESS",
  COMPLETED: "status.COMPLETED",
  CANCELLED_BY_USER: "status.CANCELLED_BY_USER",
  CANCELLED_BY_ADMIN: "status.CANCELLED_BY_ADMIN",
  REJECTED: "status.REJECTED",
};

export function translateStatus(t: Translator["t"], status: string) {
  const key = STATUS_KEYS[status];
  return key ? t(key) : t("status.UNKNOWN");
}

const CATALOG_KEYS: Record<string, Parameters<Translator["t"]>[0]> = {
  "car interior cleaning": "catalog.carInterior",
  "carpet cleaning": "catalog.carpet",
  "chair cleaning": "catalog.chair",
  "couch cleaning": "catalog.couch",
  "mattress cleaning": "catalog.mattress",
  "pillow cleaning": "catalog.pillow",
  vehicle: "catalog.vehicle",
  "textile & furniture": "catalog.textile",
  "textile and furniture": "catalog.textile",
  "home care": "catalog.homeCare",
  leather: "catalog.leather",
  fabric: "catalog.fabric",
};

export function translateCatalogName(t: Translator["t"], name: string) {
  const key = CATALOG_KEYS[name.trim().toLowerCase()];
  return key ? t(key) : name;
}

const CATALOG_DESCRIPTION_KEYS: Record<string, Parameters<Translator["t"]>[0]> = {
  "vacuum and detail interior surfaces": "catalog.vacuumInterior",
  "deep clean carpets by size": "catalog.deepCleanCarpets",
  "upholstery cleaning for sofas": "catalog.upholsterySofas",
  "single or dining chair cleaning": "catalog.chairCleaningDesc",
};

export function translateCatalogDescription(t: Translator["t"], description: string | null) {
  if (!description) return description;
  const key = CATALOG_DESCRIPTION_KEYS[description.trim().toLowerCase()];
  return key ? t(key) : description;
}

/** Display currency for catalog quotes, bookings, and recorded payments. */
export const CURRENCY = "RON";

export function localeTag(locale: Locale) {
  return LOCALE_TAGS[locale];
}

export function formatMoney(amount: string | number, locale: Locale = "en") {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat(localeTag(locale), {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatPriceRange(
  min: string | number,
  max: string | number,
  locale: Locale = "en",
) {
  const low = typeof min === "string" ? Number(min) : min;
  const high = typeof max === "string" ? Number(max) : max;
  const safeLow = Number.isFinite(low) ? low : 0;
  const safeHigh = Number.isFinite(high) ? high : safeLow;

  if (safeLow === safeHigh) {
    return formatMoney(safeLow, locale);
  }

  return `${formatMoney(safeLow, locale)} – ${formatMoney(safeHigh, locale)}`;
}

export function formatDay(value: Date | string, locale: Locale = "en") {
  return new Date(value).toLocaleDateString(localeTag(locale), {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatTime(value: Date | string, locale: Locale = "en") {
  return new Date(value).toLocaleTimeString(localeTag(locale), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatSlotRange(
  startsAt: Date | string,
  endsAt: Date | string,
  locale: Locale = "en",
) {
  return `${formatDay(startsAt, locale)} · ${formatTime(startsAt, locale)} – ${formatTime(endsAt, locale)}`;
}

export function formatLongDate(value: Date | string, locale: Locale = "en") {
  return new Date(value).toLocaleDateString(localeTag(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
