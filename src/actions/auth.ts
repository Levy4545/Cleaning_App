"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  findUserById,
  findUserByEmail,
  createUser,
  updateUser,
  updateUserByEmail,
  updateUserRole,
} from "@/db/queries/users";
import { ensureProfile } from "@/db/queries/profiles";
import { ensureShopMembership } from "@/db/queries/shop-members";
import type { ActionResult, AuthUser } from "@/types";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "@/validators/auth";
import { getDefaultShopId } from "@/lib/tenancy/get-shop";
import { homePathForRole } from "@/lib/auth/home-path";
import { env } from "@/env";

export async function signInWithEmail(
  input: LoginInput,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await syncUserFromAuth();
  const current = await getCurrentUser();
  redirect(homePathForRole(current?.role ?? "USER"));
}

export async function signUpWithEmail(
  input: RegisterInput,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        name: parsed.data.name,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user) {
    await syncUserRecord(data.user.id, parsed.data.email, parsed.data.name);
  }

  const current = await getCurrentUser();
  redirect(homePathForRole(current?.role ?? "USER"));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(
  input: ResetPasswordInput,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/settings`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateProfile(input: {
  name: string;
  phone?: string;
}): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  // Keep auth metadata in step, otherwise syncUserFromAuth overwrites the name later.
  const { error } = await supabase.auth.updateUser({ data: { name: parsed.data.name } });
  if (error) {
    return { success: false, error: error.message };
  }

  await updateUser(user.id, {
    name: parsed.data.name,
    phone: parsed.data.phone,
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
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
}

async function syncUserRecord(userId: string, email: string, name: string) {
  const userById = await findUserById(userId);

  if (userById) {
    await updateUser(userId, {
      email,
      name,
    });
    await ensureProfile(userId);
    await ensureDefaultCustomerMembership(userId);
    await maybeBootstrapAdmin(userId, email);
    return;
  }

  const userByEmail = await findUserByEmail(email);

  if (userByEmail) {
    await updateUserByEmail(email, {
      id: userId,
      name,
    });
    await ensureProfile(userId);
    await ensureDefaultCustomerMembership(userId);
    await maybeBootstrapAdmin(userId, email);
    return;
  }

  await createUser({
    id: userId,
    email,
    name,
  });

  await ensureProfile(userId);
  await ensureDefaultCustomerMembership(userId);
  await maybeBootstrapAdmin(userId, email);
}

async function maybeBootstrapAdmin(userId: string, email: string) {
  const bootstrap = env.ADMIN_BOOTSTRAP_EMAIL?.toLowerCase();
  if (!bootstrap || email.toLowerCase() !== bootstrap) {
    return;
  }

  await updateUserRole(userId, "ADMIN");

  try {
    const shopId = await getDefaultShopId();
    await ensureShopMembership({
      shopId,
      userId,
      role: "OWNER",
    });
  } catch {
    // ignore if shop not seeded
  }
}

async function ensureDefaultCustomerMembership(userId: string) {
  try {
    const shopId = await getDefaultShopId();
    await ensureShopMembership({
      shopId,
      userId,
      role: "CUSTOMER",
    });
  } catch {
    // Shop may not be seeded yet during early setup — safe to ignore.
  }
}


export async function syncUserFromAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const name = (user.user_metadata?.name as string | undefined) ?? null;
  await syncUserRecord(user.id, user.email, name ?? user.email.split("@")[0] ?? "User");
  return user;
}
