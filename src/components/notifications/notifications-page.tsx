"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Bell } from "lucide-react";

import { markAllAsRead, markNotificationAsRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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

export function NotificationsPageClient({
  items,
  unreadCount,
}: {
  items: NotificationListItem[];
  unreadCount: number;
}) {
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications"
        description="Booking updates and messages will show up here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ash">
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </p>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending || unreadCount === 0}
          onClick={() =>
            startTransition(async () => {
              await markAllAsRead();
            })
          }
        >
          Mark all read
        </Button>
      </div>

      <ul className="overflow-hidden rounded-xl border border-line bg-panel">
        {items.map((item) => {
          const unread = !item.readAt;
          const inner = (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className={cn("text-sm", unread ? "font-medium text-bone" : "text-ash")}>
                  {item.subject ?? "Update"}
                </p>
                <time className="text-xs text-faint">
                  {new Date(item.createdAt).toLocaleString()}
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
                  onClick={() =>
                    startTransition(async () => {
                      if (unread) await markNotificationAsRead(item.id);
                    })
                  }
                  className="block px-5 py-4 transition-colors hover:bg-elevated"
                >
                  {inner}
                </Link>
              ) : (
                <button
                  type="button"
                  className="block w-full px-5 py-4 text-left transition-colors hover:bg-elevated"
                  onClick={() =>
                    startTransition(async () => {
                      if (unread) await markNotificationAsRead(item.id);
                    })
                  }
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
