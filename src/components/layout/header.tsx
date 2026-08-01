import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";

const links = [
  { href: "#services", label: "Services" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

/** Marketing navbar. Signed-in visitors never reach `/`, so there is no user state here. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo href="/" />

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-ash transition-colors hover:text-bone"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Sign in
          </ButtonLink>
          <ButtonLink href="/register" size="sm">
            Book now
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
