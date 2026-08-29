import { type ReactNode } from "react";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo, LogoMark } from "@/components/layout/logo";

export function AuthLayout({
  quote,
  attribution,
  children,
}: {
  quote: string;
  attribution: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[55fr_45fr]">
      <section className="relative hidden overflow-hidden bg-ink p-10 lg:flex lg:flex-col">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-32 h-[480px] w-[480px] rounded-full bg-gold/20 blur-[120px]"
        />
        <LogoMark className="pointer-events-none absolute -right-16 top-1/4 h-[420px] w-[420px] opacity-[0.06]" />

        <Logo href="/" className="relative" />

        <blockquote className="relative m-auto max-w-md text-balance">
          <p className="font-display text-3xl leading-snug text-bone">{quote}</p>
          <footer className="mt-6 text-xs uppercase tracking-[0.22em] text-faint">
            {attribution}
          </footer>
        </blockquote>
      </section>

      <section className="flex items-center justify-center bg-surface px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between gap-3 lg:justify-end">
            <Logo href="/" className="lg:hidden" />
            <LanguageSwitcher />
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}
