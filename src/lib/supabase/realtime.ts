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
 * rows. Retries briefly so the first paint after login still ends up authorized.
 * Returns true when a JWT was applied.
 */
export async function authorizeRealtime(client: SupabaseClient): Promise<boolean> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const {
      data: { session },
    } = await client.auth.getSession();
    if (session?.access_token) {
      await client.realtime.setAuth(session.access_token);
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

type UserEventHandlers = {
  onNotification?: () => void;
  onAppointmentChange?: () => void;
  onMessage?: () => void;
  onStatusChange?: (status: string) => void;
};

/**
 * Subscribe a signed-in user to notifications, appointment changes, and messages.
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
      { event: "UPDATE", schema: "public", table: "notifications" },
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
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      () => handlers.onMessage?.(),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages" },
      () => handlers.onMessage?.(),
    )
    .subscribe((status) => {
      handlers.onStatusChange?.(status);
    });

  return () => {
    void client.removeChannel(channel);
  };
}
