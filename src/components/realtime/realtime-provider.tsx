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
  reload: () => void;
  markOne: (id: string) => void;
  markAll: () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

/** Safety net: reconcile with the server periodically while the tab is visible. */
const FALLBACK_POLL_MS = 120_000;
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
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenIds = useRef<Set<string>>(new Set());

  const reload = useCallback(() => {
    void getNotificationFeed().then((result) => {
      if (result.success && result.data) {
        setItems(result.data.items);
        setUnreadCount(result.data.unreadCount);
        for (const item of result.data.items) seenIds.current.add(item.id);
      }
    });
  }, []);

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

  // Seed once on mount.
  useEffect(() => {
    reload();
  }, [reload]);

  // Realtime subscription (RLS scopes rows to this user).
  useEffect(() => {
    if (!userId) return;

    const client = getRealtimeClient();
    let unsubscribe = () => {};
    let cancelled = false;

    void authorizeRealtime(client).then(() => {
      if (cancelled) return;
      unsubscribe = subscribeToUserEvents(client, userId, {
        onNotificationInsert: (row) => {
          if (seenIds.current.has(row.id)) return;
          seenIds.current.add(row.id);

          if (row.channel === "IN_APP") {
            const item: FeedItem = {
              id: row.id,
              type: row.type,
              subject: row.subject,
              body: row.body,
              href: row.href,
              readAt: row.read_at,
              createdAt: row.created_at,
              appointmentId: row.appointment_id,
            };
            setItems((current) => [item, ...current].slice(0, 40));
            if (!row.read_at) setUnreadCount((count) => count + 1);
            pushToast({
              id: row.id,
              title: row.subject ?? "Update",
              body: row.body,
              href: row.href,
            });
          }

          // New data (e.g. a booking for admins) — pull authoritative render.
          scheduleRefresh();
        },
        onAppointmentUpdate: () => {
          scheduleRefresh();
        },
        onStatusChange: (status) => {
          setConnected(status === "SUBSCRIBED");
        },
      });
    });

    const { data: authSub } = client.auth.onAuthStateChange(() => {
      void authorizeRealtime(client);
    });

    return () => {
      cancelled = true;
      unsubscribe();
      authSub.subscription.unsubscribe();
    };
  }, [userId, pushToast, scheduleRefresh]);

  // Visibility-aware fallback poll in case Realtime is unavailable.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (document.visibilityState === "visible") reload();
      }, FALLBACK_POLL_MS);
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
  }, [reload]);

  const value = useMemo(
    () => ({ items, unreadCount, connected, reload, markOne, markAll }),
    [items, unreadCount, connected, reload, markOne, markAll],
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
