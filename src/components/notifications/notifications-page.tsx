"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { useRealtimeNotifications } from "@/components/realtime/realtime-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { localeTag } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export type NotificationListItem = {
  id: string;
  type: string;
  subject: string | null;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

/**
 * Live notifications inbox. Prefers the RealtimeProvider feed; falls back to
 * server-rendered props until the first client fetch completes.
 */
export function NotificationsPageClient({
  items: initialItems,
  unreadCount: initialUnread,
}: {
  items: NotificationListItem[];
  unreadCount: number;
}) {
  const { t, locale } = useI18n();
  const live = useRealtimeNotifications();

  const items = live.feedReady ? live.items : initialItems;
  const unreadCount = live.feedReady ? live.unreadCount : initialUnread;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title={t("notifications.emptyTitle")}
        description={t("notifications.emptyBody")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ash">
          {unreadCount > 0
            ? t("notifications.unread", { n: unreadCount })
            : t("notifications.allCaughtUp")}
        </p>
        <Button
          variant="ghost"
          size="sm"
          disabled={unreadCount === 0}
          onClick={() => live.markAll()}
        >
          {t("notifications.markAll")}
        </Button>
      </div>

      <ul className="overflow-hidden rounded-xl border border-line bg-panel">
        {items.map((item) => {
          const unread = !item.readAt;
          const inner = (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className={cn("text-sm", unread ? "font-medium text-bone" : "text-ash")}>
                  {item.subject ?? t("notifications.update")}
                </p>
                <time className="text-xs text-faint">
                  {new Date(item.createdAt).toLocaleString(localeTag(locale))}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-faint">{item.body}</p>
            </>
          );

          return (
            <li
              key={item.id}
              className={cn("border-b border-line last:border-0", unread && "bg-gold/5")}
            >
              {item.href ? (
                <Link
                  href={item.href}
                  onClick={() => {
                    if (unread) live.markOne(item.id);
                  }}
                  className="block px-5 py-4 transition-colors hover:bg-elevated"
                >
                  {inner}
                </Link>
              ) : (
                <button
                  type="button"
                  className="block w-full px-5 py-4 text-left transition-colors hover:bg-elevated"
                  onClick={() => {
                    if (unread) live.markOne(item.id);
                  }}
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
