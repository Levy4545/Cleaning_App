"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";

import { useRealtimeNotifications } from "@/components/realtime/realtime-provider";
import { useI18n } from "@/i18n/provider";
import type { Translator } from "@/i18n/dictionary";
import { cn } from "@/lib/utils";

function relativeTime(iso: string, t: Translator["t"]) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return t("notifications.justNow");
  if (minutes < 60) return t("notifications.minutesAgo", { n: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t("notifications.hoursAgo", { n: hours });
  const days = Math.round(hours / 24);
  return t("notifications.daysAgo", { n: days });
}

export function NotificationBell() {
  const { t } = useI18n();
  const { items, unreadCount, markOne, markAll } = useRealtimeNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={
          unreadCount > 0
            ? t("notifications.ariaUnread", { n: unreadCount })
            : t("notifications.aria")
        }
        className="relative rounded-md p-2 text-ash transition-colors hover:bg-elevated hover:text-bone"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-ink">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-line bg-panel shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-medium text-bone">{t("notifications.title")}</p>
            <button
              type="button"
              onClick={markAll}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1 text-xs text-ash transition-colors hover:text-gold disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t("notifications.markAll")}
            </button>
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-ash">
                {t("notifications.noneYet")}
              </li>
            ) : (
              items.slice(0, 12).map((item) => {
                const unread = !item.readAt;
                const content = (
                  <>
                    <p className={cn("text-sm", unread ? "font-medium text-bone" : "text-ash")}>
                      {item.subject ?? t("notifications.update")}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-faint">{item.body}</p>
                    <p className="mt-1.5 text-[10px] uppercase tracking-wide text-faint">
                      {relativeTime(item.createdAt, t)}
                    </p>
                  </>
                );

                return (
                  <li key={item.id} className="border-b border-line last:border-0">
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => {
                          if (unread) markOne(item.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "block px-4 py-3 transition-colors hover:bg-elevated",
                          unread && "bg-gold/5",
                        )}
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (unread) markOne(item.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "block w-full px-4 py-3 text-left transition-colors hover:bg-elevated",
                          unread && "bg-gold/5",
                        )}
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-line px-4 py-2.5">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-gold hover:underline"
            >
              {t("notifications.viewAll")}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
