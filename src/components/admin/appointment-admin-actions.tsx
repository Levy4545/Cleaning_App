"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";

import {
  approveAppointment,
  cancelAppointmentByAdmin,
  completeAppointment,
  rejectAppointment,
} from "@/actions/appointments";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useI18n } from "@/i18n/provider";
import { formatDeliveryMode } from "@/lib/format";

const COMPLETABLE = ["APPROVED", "ASSIGNED", "IN_PROGRESS"];

export function AppointmentAdminActions({
  appointmentId,
  status,
  preferredDeliveryMode,
}: {
  appointmentId: string;
  status: string;
  preferredDeliveryMode: "ON_SITE" | "DROP_OFF";
}) {
  const { t } = useI18n();
  const [deliveryMode, setDeliveryMode] = useState<"ON_SITE" | "DROP_OFF">(preferredDeliveryMode);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<{ success: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error ?? t("common.actionFailed"));
      }
    });
  };

  if (status !== "PENDING" && !COMPLETABLE.includes(status)) {
    return error ? <Alert>{error}</Alert> : null;
  }

  return (
    <div className="space-y-4">
      {status === "PENDING" ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-52 space-y-2">
              <Label htmlFor={`mode-${appointmentId}`}>{t("admin.confirmMode")}</Label>
              <Select
                id={`mode-${appointmentId}`}
                value={deliveryMode}
                onChange={(e) => setDeliveryMode(e.target.value as "ON_SITE" | "DROP_OFF")}
              >
                <option value="DROP_OFF">{t("common.dropOff")}</option>
                <option value="ON_SITE">{t("common.onSite")}</option>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger-outline"
                disabled={isPending}
                onClick={() => setShowRejectForm((v) => !v)}
              >
                <X className="h-4 w-4" />
                {t("admin.reject")}
              </Button>
              <Button
                variant="success"
                disabled={isPending}
                onClick={() => run(() => approveAppointment({ appointmentId, deliveryMode }))}
              >
                <Check className="h-4 w-4" />
                {t("admin.approve")}
              </Button>
            </div>
          </div>

          <p className="text-xs text-faint">
            {t("admin.customerPreferred", {
              mode: formatDeliveryMode(preferredDeliveryMode, t),
            })}
          </p>

          {showRejectForm ? (
            <div className="space-y-3 rounded-lg border border-red-500/25 bg-red-500/5 p-4">
              <Label htmlFor={`reason-${appointmentId}`}>{t("admin.reasonForClient")}</Label>
              <Input
                id={`reason-${appointmentId}`}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t("admin.rejectPlaceholder")}
              />
              <Button
                variant="danger"
                size="sm"
                disabled={isPending}
                onClick={() => run(() => rejectAppointment({ appointmentId, reason: rejectReason }))}
              >
                {t("admin.sendRejection")}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      {COMPLETABLE.includes(status) ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="danger-outline"
            disabled={isPending}
            onClick={() => {
              const reason = window.prompt(t("admin.cancelNote")) ?? undefined;
              run(() => cancelAppointmentByAdmin(appointmentId, reason || undefined));
            }}
          >
            <X className="h-4 w-4" />
            {t("appointments.cancel")}
          </Button>
          <Button
            variant="success"
            disabled={isPending}
            onClick={() => run(() => completeAppointment(appointmentId))}
          >
            <Check className="h-4 w-4" />
            {t("admin.markCompleted")}
          </Button>
        </div>
      ) : null}

      {error ? <Alert>{error}</Alert> : null}
    </div>
  );
}
