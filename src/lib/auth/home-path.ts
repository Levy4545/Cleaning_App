import type { UserRole } from "@/types";

/** Post-login landing by role. */
export function homePathForRole(role: UserRole): string {
  if (role === "ADMIN") {
    return "/admin";
  }
  if (role === "CLEANER") {
    return "/dashboard";
  }
  return "/dashboard";
}
