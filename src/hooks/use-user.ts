"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { AuthUser } from "@/types";

export function useUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email ?? "",
          name: (authUser.user_metadata?.name as string | undefined) ?? null,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user;
      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email ?? "",
          name: (authUser.user_metadata?.name as string | undefined) ?? null,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
