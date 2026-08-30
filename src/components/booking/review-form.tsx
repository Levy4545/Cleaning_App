"use client";

import { useState, useTransition } from "react";

import { submitReview } from "@/actions/appointments";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StarDisplay, StarRating } from "@/components/ui/star-rating";
import { useI18n } from "@/i18n/provider";

export function ReviewForm({ appointmentId }: { appointmentId: string }) {
  const { t } = useI18n();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <StarDisplay rating={rating} />
        <span className="text-sm text-emerald-300">{t("review.thanks")}</span>
      </div>
    );
  }

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitReview({
        appointmentId,
        rating,
        comment: comment || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setDone(true);
    });
  };

  return (
    <div className="mt-4 rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-ash">{t("review.rate")}</p>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <Input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("review.commentPlaceholder")}
          className="min-w-48 flex-1"
        />

        <Button type="button" size="sm" onClick={handleSubmit} disabled={isPending}>
          {isPending ? t("review.sending") : t("review.submit")}
        </Button>
      </div>

      {error ? <Alert className="mt-3">{error}</Alert> : null}
    </div>
  );
}
