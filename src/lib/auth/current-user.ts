import { cache } from "react";

import { findUserById } from "@/db/queries/users";
import { createClient } from "@/lib/supabase/server";
import type { AuthUser } from "@/types";

/**
 * One Auth + users-row lookup per request. Layout, guards, and pages share this.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  try {
    const record = await findUserById(user.id);

    return {
      id: user.id,
      email: user.email ?? record?.email ?? "",
      name: record?.name ?? (user.user_metadata?.name as string | undefined) ?? null,
      phone: record?.phone ?? null,
      role: record?.role ?? "USER",
    };
  } catch {
    return {
      id: user.id,
      email: user.email ?? "",
      name: (user.user_metadata?.name as string | undefined) ?? null,
      phone: null,
      role: "USER",
    };
  }
});
