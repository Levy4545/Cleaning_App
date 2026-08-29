export const LOCALES = ["en", "ro", "hu"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "mg_locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ro: "Română",
  hu: "Magyar",
};

export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-US",
  ro: "ro-RO",
  hu: "hu-HU",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function parseLocale(value: string | null | undefined): Locale {
  if (isLocale(value)) return value;
  return DEFAULT_LOCALE;
}

/** Best match from an Accept-Language header, e.g. `hu-HU,hu;q=0.9,en;q=0.8`. */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const candidates = header
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase() ?? "")
    .filter(Boolean);

  for (const candidate of candidates) {
    const base = candidate.slice(0, 2);
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
