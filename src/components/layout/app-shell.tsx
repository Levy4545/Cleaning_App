import { type ReactNode } from "react";

import { AppSidebar, Avatar, type ShellUser } from "@/components/layout/app-sidebar";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function AppShell({
  variant = "customer",
  user,
  title,
  description,
  actions,
  children,
}: {
  variant?: "customer" | "admin";
  user?: ShellUser;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ink">
      <AppSidebar variant={variant} user={user} />
      <MobileNav variant={variant} />

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur">
          <div className="flex items-center gap-4 px-4 py-4 sm:px-8">
            <Logo
              href={variant === "admin" ? "/admin" : "/dashboard"}
              className="md:hidden"
            />

            <div className="hidden min-w-0 flex-1 md:block">
              <h1 className="font-display text-2xl tracking-tight text-bone">{title}</h1>
              {description ? (
                <p className="mt-0.5 truncate text-sm text-ash">{description}</p>
              ) : null}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <LanguageSwitcher />
              {user ? <NotificationBell /> : null}
              {actions}
              {user ? <Avatar name={user.name} email={user.email} className="md:hidden" /> : null}
            </div>
          </div>

          <div className="px-4 pb-4 md:hidden">
            <h1 className="font-display text-2xl tracking-tight text-bone">{title}</h1>
            {description ? <p className="mt-0.5 text-sm text-ash">{description}</p> : null}
          </div>
        </header>

        <main className="px-4 pb-28 pt-6 sm:px-8 md:pb-12">{children}</main>
      </div>
    </div>
  );
}
