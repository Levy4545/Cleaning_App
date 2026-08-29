"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { LocaleFlag } from "@/components/layout/locale-flag";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/locales";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: Locale) => {
    setLocale(next);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={t("language.label")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-elevated px-2.5 text-xs font-medium text-bone",
          "transition-colors hover:border-gold/40 hover:bg-panel",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
          open && "border-gold/50 bg-panel",
        )}
      >
        <LocaleFlag locale={locale} />
        <span className="hidden min-[380px]:inline">{LOCALE_LABELS[locale]}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-faint transition-transform", open && "rotate-180 text-gold")}
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("language.label")}
          className="absolute right-0 z-50 mt-2 min-w-[11.5rem] overflow-hidden rounded-xl border border-line bg-panel py-1 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
        >
          {LOCALES.map((code) => {
            const selected = code === locale;

            return (
              <li key={code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(code)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                    selected
                      ? "bg-gold/10 font-medium text-gold"
                      : "text-ash hover:bg-elevated hover:text-bone",
                  )}
                >
                  <LocaleFlag locale={code} />
                  <span className="flex-1">{LOCALE_LABELS[code]}</span>
                  {selected ? <Check className="h-3.5 w-3.5" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
