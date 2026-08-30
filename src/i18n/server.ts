import { cookies, headers } from "next/headers";
import { cache } from "react";

import { listServiceTranslationsForShop } from "@/db/queries/services";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";

import {
  buildCatalogTranslationMap,
  emptyCatalogTranslationMap,
  type CatalogTranslationMap,
} from "./catalog-map";
import { createTranslator } from "./dictionary";
import { translateCatalogDescription, translateCatalogName } from "./format";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  localeFromAcceptLanguage,
  parseLocale,
  type Locale,
} from "./locales";

export const getCatalogTranslationMap = cache(async (): Promise<CatalogTranslationMap> => {
  try {
    const shopId = await getDefaultShopId();
    const rows = await listServiceTranslationsForShop(shopId);
    return buildCatalogTranslationMap(rows);
  } catch {
    return emptyCatalogTranslationMap();
  }
});

function withCatalog(locale: Locale, catalog: CatalogTranslationMap) {
  const translator = createTranslator(locale);
  return {
    ...translator,
    catalog,
    catalogName: (name: string, serviceId?: string) =>
      translateCatalogName(translator.t, name, { locale, catalog, serviceId }),
    catalogDescription: (description: string | null, serviceId?: string, englishName?: string) =>
      translateCatalogDescription(translator.t, description, {
        locale,
        catalog,
        serviceId,
        englishName,
      }),
  };
}

export async function getRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  const fromCookie = jar.get(LOCALE_COOKIE)?.value;
  if (fromCookie) {
    return parseLocale(fromCookie);
  }

  const headerStore = await headers();
  return localeFromAcceptLanguage(headerStore.get("accept-language")) ?? DEFAULT_LOCALE;
}

export async function getTranslator() {
  const locale = await getRequestLocale();
  const catalog = await getCatalogTranslationMap();
  return withCatalog(locale, catalog);
}
