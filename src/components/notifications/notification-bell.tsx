"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Bell, CheckCheck } from "lucide-react";

import {
  getNotificationFeed,
  markAllAsRead,
  markNotificationAsRead,
} from "@/actions/notifications";
import { useI18n } from "@/i18n/provider";
import type { Translator } from "@/i18n/dictionary";
import { cn } from "@/lib/utils";

type FeedItem = {
  id: string;
  type: string;
  subject: string | null;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

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
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  const refresh = () => {
    startTransition(async () => {
      const result = await getNotificationFeed();
      if (result.success && result.data) {
        setItems(result.data.items);
        setUnreadCount(result.data.unreadCount);
      }
    });
  };

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 45_000);
    return () => window.clearInterval(id);
  }, []);

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

  const onOpen = () => {
    setOpen((value) => !value);
    refresh();
  };

  const onMarkAll = () => {
    startTransition(async () => {
      await markAllAsRead();
      refresh();
    });
  };

  const onClickItem = (item: FeedItem) => {
    startTransition(async () => {
      if (!item.readAt) {
        await markNotificationAsRead(item.id);
      }
      refresh();
    });
    setOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={onOpen}
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
              onClick={onMarkAll}
              disabled={isPending || unreadCount === 0}
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
                        onClick={() => onClickItem(item)}
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
                        onClick={() => onClickItem(item)}
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
