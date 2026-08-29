import { type ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/locales";

function FlagFrame({
  className,
  children,
  label,
}: {
  className?: string;
  children: ReactNode;
  label: string;
}) {
  return (
    <span
      aria-hidden="true"
      title={label}
      className={cn(
        "relative inline-flex h-4 w-[1.4rem] shrink-0 overflow-hidden rounded-[3px] ring-1 ring-white/15",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Compact SVG flags so the switcher matches the dark gold theme. */
export function LocaleFlag({ locale, className }: { locale: Locale; className?: string }) {
  if (locale === "ro") {
    return (
      <FlagFrame className={className} label="România">
        <svg viewBox="0 0 3 2" className="h-full w-full" preserveAspectRatio="none">
          <rect width="1" height="2" fill="#002B7F" />
          <rect x="1" width="1" height="2" fill="#FCD116" />
          <rect x="2" width="1" height="2" fill="#CE1126" />
        </svg>
      </FlagFrame>
    );
  }

  if (locale === "hu") {
    return (
      <FlagFrame className={className} label="Magyarország">
        <svg viewBox="0 0 3 2" className="h-full w-full" preserveAspectRatio="none">
          <rect width="3" height="2" fill="#FFF" />
          <rect width="3" height="0.67" fill="#CE2939" />
          <rect y="1.33" width="3" height="0.67" fill="#477050" />
        </svg>
      </FlagFrame>
    );
  }

  return (
    <FlagFrame className={className} label="United States">
      <svg viewBox="0 0 19 10" className="h-full w-full" preserveAspectRatio="none">
        <rect width="19" height="10" fill="#BF0A30" />
        <rect y="0.77" width="19" height="0.77" fill="#FFF" />
        <rect y="2.31" width="19" height="0.77" fill="#FFF" />
        <rect y="3.85" width="19" height="0.77" fill="#FFF" />
        <rect y="5.38" width="19" height="0.77" fill="#FFF" />
        <rect y="6.92" width="19" height="0.77" fill="#FFF" />
        <rect y="8.46" width="19" height="0.77" fill="#FFF" />
        <rect width="7.6" height="5.38" fill="#002868" />
      </svg>
    </FlagFrame>
  );
}
