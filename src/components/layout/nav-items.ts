import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  SquareArrowOutUpRight,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  /** Short label for the mobile bottom bar. */
  short: string;
  icon: LucideIcon;
};

export const customerNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/book", label: "Book", short: "Book", icon: CalendarDays },
  { href: "/appointments", label: "My appointments", short: "Bookings", icon: ClipboardList },
  { href: "/settings", label: "Settings", short: "Settings", icon: Settings },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", short: "Overview", icon: LayoutDashboard },
  { href: "/admin/calendar", label: "Calendar", short: "Calendar", icon: CalendarDays },
  { href: "/admin/appointments", label: "Appointments", short: "Inbox", icon: ClipboardList },
];

export const customerViewItem: NavItem = {
  href: "/dashboard",
  label: "Customer view",
  short: "Customer",
  icon: SquareArrowOutUpRight,
};

export { LogOut };

/**
 * Section roots like /admin and /dashboard must match exactly, otherwise every
 * nested admin route would light up the Overview item.
 */
export function isActive(pathname: string, href: string) {
  if (href === "/admin" || href === "/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
