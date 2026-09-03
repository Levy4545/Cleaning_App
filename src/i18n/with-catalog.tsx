import type { ReactNode } from "react";

import { I18nProvider } from "@/i18n/provider";
import { getDictionary } from "@/i18n/dictionary";
import { getCatalogTranslationMap, getRequestLocale } from "@/i18n/server";

/** Nested provider so only pages that show service names load the catalog. */
export async function WithCatalog({ children }: { children: ReactNode }) {
  const [locale, catalog] = await Promise.all([getRequestLocale(), getCatalogTranslationMap()]);
  const messages = getDictionary(locale);

  return (
    <I18nProvider initialLocale={locale} messages={messages} catalog={catalog}>
      {children}
    </I18nProvider>
  );
}
