"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { setLocaleCookie } from "@/i18n/actions";
import {
  createTranslator,
  type MessageKey,
  type TranslateVars,
  type Translator,
} from "@/i18n/dictionary";
import { LOCALE_COOKIE, parseLocale, type Locale } from "@/i18n/locales";

type I18nContextValue = Translator & {
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
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
      setLocale,
    }),
    [translator, setLocale],
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
