"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { adminNav, customerNav, isActive } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

/** Bottom bar for viewports below `md`, where the sidebar is hidden. */
export function MobileNav({ variant = "customer" }: { variant?: "customer" | "admin" }) {
  const pathname = usePathname();
  const admin = variant === "admin";
  // Booking gets the floating action button instead of a tab, so drop it here.
  const links = admin ? adminNav : customerNav.filter((link) => link.href !== "/book");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] transition-colors",
                active ? "text-gold" : "text-faint hover:text-ash",
              )}
            >
              <Icon className="h-5 w-5" />
              {link.short}
              <span
                className={cn("h-1 w-1 rounded-full", active ? "bg-gold" : "bg-transparent")}
              />
            </Link>
          );
        })}
      </div>

      {admin ? null : (
        <Link
          href="/book"
          aria-label="Book a cleaning"
          className="bg-gold-gradient absolute -top-6 right-5 flex h-12 w-12 items-center justify-center rounded-full text-ink shadow-lg shadow-gold/20 transition-transform hover:scale-105"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </Link>
      )}
    </nav>
  );
}
