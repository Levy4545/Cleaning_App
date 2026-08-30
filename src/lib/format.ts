import {
  formatDay as formatDayLocale,
  formatLongDate as formatLongDateLocale,
  formatMoney as formatMoneyLocale,
  formatPriceRange as formatPriceRangeLocale,
  formatSlotRange as formatSlotRangeLocale,
  formatTime as formatTimeLocale,
  translateCatalogName,
} from "@/i18n/format";
import type { Translator } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/locales";

export function formatMoney(amount: string | number, locale: Locale = "en") {
  return formatMoneyLocale(amount, locale);
}

export function formatPriceRange(
  min: string | number,
  max: string | number,
  locale: Locale = "en",
) {
  return formatPriceRangeLocale(min, max, locale);
}

export function formatDay(value: Date | string, locale: Locale = "en") {
  return formatDayLocale(value, locale);
}

export function formatTime(value: Date | string, locale: Locale = "en") {
  return formatTimeLocale(value, locale);
}

export function formatSlotRange(
  startsAt: Date | string,
  endsAt: Date | string,
  locale: Locale = "en",
) {
  return formatSlotRangeLocale(startsAt, endsAt, locale);
}

export function formatLongDate(value: Date | string, locale: Locale = "en") {
  return formatLongDateLocale(value, locale);
}

export function formatDeliveryMode(mode: string, t?: Translator["t"]) {
  if (t) {
    return mode === "ON_SITE" ? t("common.onSite") : t("common.dropOff");
  }
  return mode === "ON_SITE" ? "On-site" : "Drop-off";
}

export function formatItemType(itemType: string, t?: Translator["t"]) {
  if (!itemType) return itemType;
  if (t) {
    return translateCatalogName(t, itemType);
  }
  return itemType
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
