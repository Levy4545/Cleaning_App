"use client";

import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/locales";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className={cn("inline-flex items-center gap-2", className)}>
      <span className="sr-only">{t("language.label")}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        aria-label={t("language.label")}
        className="h-9 cursor-pointer appearance-none rounded-md border border-line bg-elevated px-2.5 pr-7 text-xs font-medium text-bone outline-none transition-colors hover:border-gold/40 focus:border-gold/60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='m5 7.5 5 5 5-5' stroke='%9aa0a6' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.45rem center",
        }}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code} className="bg-panel text-bone">
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
