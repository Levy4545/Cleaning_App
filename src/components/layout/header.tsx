"use client";

import Link from "next/link";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";

export function SiteHeader() {
  const { t } = useI18n();
  const links = [
    { href: "#services", label: t("header.services") },
    { href: "#how-it-works", label: t("header.howItWorks") },
    { href: "#pricing", label: t("header.pricing") },
  ];

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
          <LanguageSwitcher />
          <ButtonLink href="/login" variant="ghost" size="sm">
            {t("common.signIn")}
          </ButtonLink>
          <ButtonLink href="/register" size="sm">
            {t("header.bookNow")}
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
