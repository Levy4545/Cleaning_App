"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { emptyCatalogTranslationMap, type CatalogTranslationMap } from "@/i18n/catalog-map";
import { setLocaleCookie } from "@/i18n/actions";
import {
  createTranslator,
  type MessageKey,
  type TranslateVars,
  type Translator,
} from "@/i18n/dictionary";
import { translateCatalogDescription, translateCatalogName } from "@/i18n/format";
import { LOCALE_COOKIE, parseLocale, type Locale } from "@/i18n/locales";

type I18nContextValue = Translator & {
  catalog: CatalogTranslationMap;
  catalogName: (name: string, serviceId?: string) => string;
  catalogDescription: (
    description: string | null,
    serviceId?: string,
    englishName?: string,
  ) => string | null;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLocale,
  catalog = emptyCatalogTranslationMap(),
  children,
}: {
  initialLocale: Locale;
  catalog?: CatalogTranslationMap;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const translator = useMemo(() => createTranslator(locale), [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      const resolved = parseLocale(next);
      setLocaleState(resolved);
      document.cookie = `${LOCALE_COOKIE}=${resolved};path=/;max-age=31536000;samesite=lax`;
      document.documentElement.lang = resolved;
      void setLocaleCookie(resolved).then(() => router.refresh());
    },
    [router],
  );

  const value = useMemo(
    () => ({
      ...translator,
      catalog,
      catalogName: (name: string, serviceId?: string) =>
        translateCatalogName(translator.t, name, { locale, catalog, serviceId }),
      catalogDescription: (
        description: string | null,
        serviceId?: string,
        englishName?: string,
      ) =>
        translateCatalogDescription(translator.t, description, {
          locale,
          catalog,
          serviceId,
          englishName,
        }),
      setLocale,
    }),
    [translator, catalog, locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export function useT() {
  const { t } = useI18n();
  return t;
}

export type { MessageKey, TranslateVars };
