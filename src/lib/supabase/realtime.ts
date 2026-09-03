import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

let browserClient: SupabaseClient | null = null;

/** Single browser Supabase client reused across subscriptions (one socket per tab). */
export function getRealtimeClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}

/**
 * Keep the Realtime socket authenticated so RLS lets the user receive their own
 * rows. Safe to call repeatedly (on mount and on auth-state changes).
 */
export async function authorizeRealtime(client: SupabaseClient): Promise<void> {
  const {
    data: { session },
  } = await client.auth.getSession();
  if (session?.access_token) {
    await client.realtime.setAuth(session.access_token);
  }
}

type UserEventHandlers = {
  onNotification?: () => void;
  onAppointmentChange?: () => void;
  onStatusChange?: (status: string) => void;
};

/**
 * Subscribe a signed-in user to their own notifications + appointment changes.
 *
 * Rows are scoped by RLS to the authenticated user (see supabase/rls.sql), so we
 * intentionally do NOT use server-side column filters — they are brittle and the
 * change payload columns are not guaranteed. Each event is treated as a "your
 * data changed" signal; the caller re-fetches authoritative data. Returns an
 * unsubscribe function.
 */
export function subscribeToUserEvents(
  client: SupabaseClient,
  userId: string,
  handlers: UserEventHandlers,
): () => void {
  const channel: RealtimeChannel = client
    .channel(`user-events-${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications" },
      () => handlers.onNotification?.(),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "appointments" },
      () => handlers.onAppointmentChange?.(),
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "appointments" },
      () => handlers.onAppointmentChange?.(),
    )
    .subscribe((status) => {
      handlers.onStatusChange?.(status);
    });

  return () => {
    void client.removeChannel(channel);
  };
}
