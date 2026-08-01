import Link from "next/link";

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("h-6 w-6", className)}>
      <defs>
        <linearGradient id="master-gold-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-gold-soft)" />
          <stop offset="55%" stopColor="var(--color-gold)" />
          <stop offset="100%" stopColor="var(--color-gold-deep)" />
        </linearGradient>
      </defs>
      <path
        d="M12 1c.5 5.2 5.8 10.5 11 11-5.2.5-10.5 5.8-11 11-.5-5.2-5.8-10.5-11-11C6.2 11.5 11.5 6.2 12 1Z"
        fill="url(#master-gold-mark)"
      />
    </svg>
  );
}

export function Logo({
  href = "/",
  badge,
  className,
}: {
  href?: string;
  badge?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group inline-flex flex-col gap-1.5", className)}>
      {/* Stacked lockup so the full name stays legible at sidebar width. */}
      <span className="inline-flex items-center gap-2.5">
        <LogoMark className="h-6 w-6 shrink-0 transition-transform duration-300 group-hover:rotate-12" />
        <span className="flex flex-col leading-none">
          <span className="font-display text-base tracking-[0.16em] text-bone">MASTER-GOLD</span>
          <span className="mt-1 text-[9px] tracking-[0.42em] text-faint">CLEANING</span>
        </span>
      </span>
      {badge ? (
        <span className="w-fit rounded-full border border-gold/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
