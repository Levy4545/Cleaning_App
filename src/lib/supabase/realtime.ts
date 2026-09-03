import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

/**
 * Row shapes as they arrive over Postgres change events (snake_case columns).
 * Only the fields the UI needs are typed.
 */
export type RealtimeNotificationRow = {
  id: string;
  user_id: string;
  type: string;
  channel: string;
  subject: string | null;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
  appointment_id: string | null;
};

export type RealtimeAppointmentRow = {
  id: string;
  customer_id: string;
  status: string;
};

let browserClient: SupabaseClient | null = null;

/** Single browser Supabase client reused across subscriptions (one socket per tab). */
export function getRealtimeClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}

/**
 * Keep the Realtime socket authenticated so RLS lets the user receive their own rows.
 * Safe to call repeatedly (on mount and on auth-state changes).
 */
export async function authorizeRealtime(client: SupabaseClient): Promise<void> {
  const {
    data: { session },
  } = await client.auth.getSession();
  if (session?.access_token) {
    client.realtime.setAuth(session.access_token);
  }
}

type UserEventHandlers = {
  onNotificationInsert?: (row: RealtimeNotificationRow) => void;
  onAppointmentUpdate?: (row: RealtimeAppointmentRow) => void;
  onStatusChange?: (status: string) => void;
};

/**
 * Subscribe a signed-in user to their own in-app notifications and appointment
 * status changes. RLS scopes delivery to rows the user may read. Returns an
 * unsubscribe function.
 */
export function subscribeToUserEvents(
  client: SupabaseClient,
  userId: string,
  handlers: UserEventHandlers,
): () => void {
  const channel: RealtimeChannel = client
    .channel(`user-events:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        handlers.onNotificationInsert?.(payload.new as RealtimeNotificationRow);
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "appointments",
        filter: `customer_id=eq.${userId}`,
      },
      (payload) => {
        handlers.onAppointmentUpdate?.(payload.new as RealtimeAppointmentRow);
      },
    )
    .subscribe((status) => {
      handlers.onStatusChange?.(status);
    });

  return () => {
    void client.removeChannel(channel);
  };
}
