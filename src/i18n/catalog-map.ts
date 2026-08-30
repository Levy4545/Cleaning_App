import type { Locale } from "@/i18n/locales";

export type CatalogLocaleFields = {
  name: string;
  description: string | null;
};

export type CatalogTranslationMap = {
  byId: Record<string, Partial<Record<"ro" | "hu", CatalogLocaleFields>>>;
  byEnglishName: Record<string, Partial<Record<"ro" | "hu", CatalogLocaleFields>>>;
};

export function emptyCatalogTranslationMap(): CatalogTranslationMap {
  return { byId: {}, byEnglishName: {} };
}

export function buildCatalogTranslationMap(
  rows: {
    serviceId: string;
    locale: string;
    name: string;
    description: string | null;
    englishName: string;
  }[],
): CatalogTranslationMap {
  const map = emptyCatalogTranslationMap();

  for (const row of rows) {
    if (row.locale !== "ro" && row.locale !== "hu") continue;
    const fields: CatalogLocaleFields = {
      name: row.name,
      description: row.description,
    };
    map.byId[row.serviceId] ??= {};
    map.byId[row.serviceId][row.locale] = fields;
    const key = row.englishName.trim().toLowerCase();
    if (key) {
      map.byEnglishName[key] ??= {};
      map.byEnglishName[key][row.locale] = fields;
    }
  }

  return map;
}

function catalogFields(
  map: CatalogTranslationMap | undefined,
  locale: Locale | undefined,
  serviceId: string | undefined,
  englishName: string,
) {
  if (!map || !locale || locale === "en") return undefined;
  if (locale !== "ro" && locale !== "hu") return undefined;
  if (serviceId) {
    const byId = map.byId[serviceId]?.[locale];
    if (byId) return byId;
  }
  return map.byEnglishName[englishName.trim().toLowerCase()]?.[locale];
}

export function catalogTranslatedName(
  map: CatalogTranslationMap | undefined,
  locale: Locale | undefined,
  name: string,
  serviceId?: string,
) {
  return catalogFields(map, locale, serviceId, name)?.name;
}

export function catalogTranslatedDescription(
  map: CatalogTranslationMap | undefined,
  locale: Locale | undefined,
  englishName: string,
  serviceId?: string,
) {
  return catalogFields(map, locale, serviceId, englishName)?.description;
}
