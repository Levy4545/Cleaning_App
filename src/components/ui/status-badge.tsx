"use client";

import { translateStatus } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

import { statusTheme } from "@/components/ui/status-theme";

export { statusTheme, statusThemes, type StatusTheme } from "@/components/ui/status-theme";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { t } = useI18n();
  const theme = statusTheme(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        theme.pill,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", theme.accent)} />
      {translateStatus(t, status)}
    </span>
  );
}
