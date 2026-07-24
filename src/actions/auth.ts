"use server";

import { and } from "drizzle-orm";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { findUserById, findUserByEmail, createUser, updateUser, updateUserByEmail, } from "@/db/queries/users";
import { ensureProfile } from "@/db/queries/profiles";
import type { ActionResult } from "@/types";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "@/validators/auth";

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

  redirect("/dashboard");
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

  redirect("/dashboard");
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

export async function getCurrentUser() {
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
      role: record?.role ?? "USER",
    };
  } catch {
    return {
      id: user.id,
      email: user.email ?? "",
      name: (user.user_metadata?.name as string | undefined) ?? null,
      role: "USER",
    };
  }
}

async function syncUserRecord(userId: string, email: string, name: string) {
  // 1. Look for an existing user by Supabase ID
  const userById = await findUserById(userId);

  if (userById) {
    await updateUser(userId, {
      email,
      name,
    });

    await ensureProfile(userId);
    return;
  }

  // 2. Look for an existing user by email
  const userByEmail = await findUserByEmail(email);

  if (userByEmail) {
    await updateUserByEmail(email, {
      id: userId,
      name,
    });

    await ensureProfile(userId);
    return;
  }

// 3. First login → create everything
  await createUser({
    id: userId,
    email,
    name,
  });

  await ensureProfile(userId);
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
