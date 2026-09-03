"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  getNotificationFeed,
  markAllAsRead,
  markNotificationAsRead,
} from "@/actions/notifications";
import { ToastViewport, type ToastItem } from "@/components/ui/toast";
import {
  authorizeRealtime,
  getRealtimeClient,
  subscribeToUserEvents,
} from "@/lib/supabase/realtime";

export type FeedItem = {
  id: string;
  type: string;
  subject: string | null;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
  appointmentId: string | null;
};

type RealtimeContextValue = {
  items: FeedItem[];
  unreadCount: number;
  connected: boolean;
  /** True after the first feed fetch completes (may be empty). */
  feedReady: boolean;
  /** Increments on each Realtime message signal so open threads can reload. */
  messageTick: number;
  reload: () => void;
  markOne: (id: string) => void;
  markAll: () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

/** Safety net when Realtime is down: reconcile while the tab is visible. */
const FALLBACK_POLL_MS = 20_000;
const FALLBACK_POLL_CONNECTED_MS = 60_000;
const REFRESH_DEBOUNCE_MS = 400;
const TOAST_TTL_MS = 6_000;

export function RealtimeProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [feedReady, setFeedReady] = useState(false);
  const [messageTick, setMessageTick] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const seeded = useRef(false);
  const connectedRef = useRef(false);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      router.refresh();
    }, REFRESH_DEBOUNCE_MS);
  }, [router]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: ToastItem) => {
      setToasts((current) => [...current.filter((t) => t.id !== toast.id), toast]);
      setTimeout(() => dismissToast(toast.id), TOAST_TTL_MS);
    },
    [dismissToast],
  );

  /**
   * Fetch authoritative feed from the server. On the first load we only seed
   * (no toast); afterwards, any newly-seen unread items raise a toast. Realtime
   * change payloads are treated as signals only — the server data is the source
   * of truth (the local Realtime payload columns are not guaranteed).
   */
  const reload = useCallback(
    (options?: { toast?: boolean }) => {
      void getNotificationFeed().then((result) => {
        if (!result.success || !result.data) {
          setFeedReady(true);
          return;
        }
        const { items: nextItems, unreadCount: nextUnread } = result.data;

        if (options?.toast && seeded.current) {
          const fresh = nextItems.filter((item) => !seenIds.current.has(item.id) && !item.readAt);
          if (fresh.length > 0) {
            const newest = fresh[0];
            pushToast({
              id: newest.id,
              title: newest.subject ?? "Update",
              body: newest.body,
              href: newest.href,
            });
          }
        }

        setItems(nextItems);
        setUnreadCount(nextUnread);
        for (const item of nextItems) seenIds.current.add(item.id);
        seeded.current = true;
        setFeedReady(true);
      });
    },
    [pushToast],
  );

  const markOne = useCallback((id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id && !item.readAt
          ? { ...item, readAt: new Date().toISOString() }
          : item,
      ),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    void markNotificationAsRead(id);
  }, []);

  const markAll = useCallback(() => {
    setItems((current) =>
      current.map((item) =>
        item.readAt ? item : { ...item, readAt: new Date().toISOString() },
      ),
    );
    setUnreadCount(0);
    void markAllAsRead();
  }, []);

  // Seed once on mount (no toast for existing notifications).
  useEffect(() => {
    reload();
  }, [reload]);

  // Realtime subscription (RLS scopes rows to this user). Re-subscribe when
  // auth settles so the first attempt never stays on an unauthenticated socket.
  useEffect(() => {
    if (!userId) return;

    const client = getRealtimeClient();
    let unsubscribe = () => {};
    let cancelled = false;

    const start = async () => {
      const ok = await authorizeRealtime(client);
      if (cancelled) return;
      unsubscribe();
      if (!ok) {
        setConnected(false);
        connectedRef.current = false;
        return;
      }
      unsubscribe = subscribeToUserEvents(client, userId, {
        onNotification: () => {
          reload({ toast: true });
          scheduleRefresh();
        },
        onAppointmentChange: () => {
          scheduleRefresh();
        },
        onMessage: () => {
          setMessageTick((tick) => tick + 1);
          // New messages also create in-app notifications — refresh feed + RSC.
          reload({ toast: true });
          scheduleRefresh();
        },
        onStatusChange: (status) => {
          const next = status === "SUBSCRIBED";
          connectedRef.current = next;
          setConnected(next);
        },
      });
    };

    void start();

    const { data: authSub } = client.auth.onAuthStateChange(() => {
      void start();
    });

    return () => {
      cancelled = true;
      unsubscribe();
      authSub.subscription.unsubscribe();
    };
  }, [userId, reload, scheduleRefresh]);

  // Visibility-aware fallback poll in case Realtime is unavailable.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const intervalMs = () =>
      connectedRef.current ? FALLBACK_POLL_CONNECTED_MS : FALLBACK_POLL_MS;

    const start = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (document.visibilityState === "visible") reload();
      }, intervalMs());
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        reload();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reload, connected]);

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      connected,
      feedReady,
      messageTick,
      reload,
      markOne,
      markAll,
    }),
    [items, unreadCount, connected, feedReady, messageTick, reload, markOne, markAll],
  );

  return (
    <RealtimeContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </RealtimeContext.Provider>
  );
}

export function useRealtimeNotifications(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtimeNotifications must be used within RealtimeProvider");
  }
  return context;
}
