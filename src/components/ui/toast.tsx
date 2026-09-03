"use client";

import Link from "next/link";
import { Bell, X } from "lucide-react";

export type ToastItem = {
  id: string;
  title: string;
  body?: string | null;
  href?: string | null;
};

/**
 * Fixed, stacked toast viewport. Purely presentational — the RealtimeProvider
 * owns the toast list and dismissal.
 */
export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const body = (
          <div className="flex w-full items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
              <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-bone">{toast.title}</p>
              {toast.body ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-ash">{toast.body}</p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDismiss(toast.id);
              }}
              className="shrink-0 rounded-md p-1 text-faint transition-colors hover:text-bone"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );

        return (
          <div
            key={toast.id}
            className="pointer-events-auto w-full max-w-sm animate-in rounded-xl border border-line bg-panel px-4 py-3 shadow-xl"
          >
            {toast.href ? (
              <Link href={toast.href} onClick={() => onDismiss(toast.id)} className="block">
                {body}
              </Link>
            ) : (
              body
            )}
          </div>
        );
      })}
    </div>
  );
}
