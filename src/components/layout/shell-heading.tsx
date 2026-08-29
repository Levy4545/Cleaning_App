"use client";

import type { MessageKey, TranslateVars } from "@/i18n/dictionary";
import { useI18n } from "@/i18n/provider";

export function ShellHeading({
  title,
  titleKey,
  description,
  descriptionKey,
  descriptionVars,
  className,
  titleClassName = "font-display text-2xl tracking-tight text-bone",
}: {
  title: string;
  titleKey?: MessageKey;
  description?: string;
  descriptionKey?: MessageKey;
  descriptionVars?: TranslateVars;
  className?: string;
  titleClassName?: string;
}) {
  const { t } = useI18n();
  const heading = titleKey ? t(titleKey) : title;
  const body = descriptionKey ? t(descriptionKey, descriptionVars) : description;

  return (
    <div className={className}>
      <h1 className={titleClassName}>{heading}</h1>
      {body ? <p className="mt-0.5 truncate text-sm text-ash">{body}</p> : null}
    </div>
  );
}
