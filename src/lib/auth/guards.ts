import { redirect } from "next/navigation";

import { getCurrentUser } from "@/actions/auth";

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return user;
}

export async function requireCleaner() {
  const user = await requireUser();

  if (user.role !== "CLEANER" && user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return user;
}
