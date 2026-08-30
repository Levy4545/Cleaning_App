"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Trash2 } from "lucide-react";

import { markAvailableDay, removeAvailableDay, setDayOpen } from "@/actions/available-days";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDay } from "@/lib/format";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export type AvailableDayRow = {
  id: string;
  day: string;
  status: string;
};

export function AvailableDaysManager({ days }: { days: AvailableDayRow[] }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [day, setDay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<{ success: boolean; error?: string }>, success: string) => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error ?? t("common.actionFailed"));
        return;
      }
      setMessage(success);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardTitle className="mb-1 text-base">{t("admin.freeDays")}</CardTitle>
      <p className="mb-4 text-sm text-ash">{t("admin.freeDaysBody")}</p>

      {error ? <Alert className="mb-3">{error}</Alert> : null}
      {message ? (
        <Alert tone="success" className="mb-3">
          {message}
        </Alert>
      ) : null}

      <form
        className="mb-4 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!day) return;
          run(() => markAvailableDay({ day, status: "OPEN" }), t("admin.dayAdded"));
        }}
      >
        <div className="min-w-40 flex-1 space-y-2">
          <Label htmlFor="free-day">{t("common.day")}</Label>
          <Input
            id="free-day"
            type="date"
            value={day}
            onChange={(event) => setDay(event.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={isPending || !day}>
          <CalendarPlus className="h-4 w-4" />
          {t("admin.addFreeDay")}
        </Button>
      </form>

      {days.length === 0 ? (
        <p className="text-sm text-faint">{t("admin.noFreeDays")}</p>
      ) : (
        <ul className="divide-y divide-line">
          {days.map((row) => {
            const open = row.status === "OPEN";
            return (
              <li key={row.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-bone">{formatDay(`${row.day}T12:00:00`, locale)}</p>
                  <p className={cn("text-xs", open ? "text-emerald-300" : "text-faint")}>
                    {open ? t("admin.markFree") : t("admin.markBusy")}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={isPending}
                  onClick={() =>
                    run(
                      () => setDayOpen({ dayId: row.id, isOpen: !open }),
                      t("admin.dayUpdated"),
                    )
                  }
                >
                  {open ? t("admin.markBusy") : t("admin.markFree")}
                </Button>
                <button
                  type="button"
                  aria-label={t("common.delete")}
                  disabled={isPending}
                  onClick={() => run(() => removeAvailableDay(row.id), t("admin.dayRemoved"))}
                  className="rounded-md p-1.5 text-faint transition-colors hover:bg-elevated hover:text-bone"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
