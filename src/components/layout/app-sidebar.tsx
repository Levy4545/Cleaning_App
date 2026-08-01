"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { signOut } from "@/actions/auth";
import { Logo } from "@/components/layout/logo";
import { adminNav, customerNav, customerViewItem, isActive } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export type ShellUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export function AppSidebar({
  variant = "customer",
  user,
}: {
  variant?: "customer" | "admin";
  user?: ShellUser;
}) {
  const pathname = usePathname();
  const admin = variant === "admin";
  const links = admin ? adminNav : customerNav;

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface md:flex">
      <div className="px-6 py-6">
        <Logo href={admin ? "/admin" : "/dashboard"} badge={admin ? "Admin" : undefined} />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-gold/10 font-medium text-gold"
                  : "text-ash hover:bg-elevated hover:text-bone",
              )}
            >
              {active ? (
                <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-gold" />
              ) : null}
              <Icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}

        {admin ? (
          <>
            <div className="my-3 h-px bg-line" />
            <Link
              href={customerViewItem.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-faint transition-colors hover:bg-elevated hover:text-ash"
            >
              <customerViewItem.icon className="h-4 w-4 shrink-0" />
              {customerViewItem.label}
            </Link>
          </>
        ) : null}
      </nav>

      {user ? (
        <div className="m-3 flex items-center gap-3 rounded-xl border border-line bg-panel p-3">
          <Avatar name={user.name} email={user.email} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-bone">{user.name ?? "Account"}</p>
            <p className="truncate text-xs text-faint">{user.email}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className="rounded-md p-1.5 text-faint transition-colors hover:bg-elevated hover:text-bone"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}
    </aside>
  );
}

export function Avatar({
  name,
  email,
  className,
}: {
  name?: string | null;
  email?: string | null;
  className?: string;
}) {
  const source = name?.trim() || email?.trim() || "?";
  const initials = source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-xs font-semibold text-gold",
        className,
      )}
    >
      {initials || "?"}
    </span>
  );
}
