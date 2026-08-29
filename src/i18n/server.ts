import { cookies, headers } from "next/headers";

import { createTranslator } from "./dictionary";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  localeFromAcceptLanguage,
  parseLocale,
  type Locale,
} from "./locales";

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
  return createTranslator(locale);
}
