import Link, { type LinkProps } from "next/link";
import { type AnchorHTMLAttributes, type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "success"
  | "danger"
  | "danger-outline";

type Size = "sm" | "md" | "lg" | "icon";

/*
 * Gold is reserved for the single primary action in a view. Confirming and
 * destructive actions keep their own colours so they stay legible as state.
 */
const variants: Record<Variant, string> = {
  primary:
    "bg-gold-gradient text-ink font-semibold shadow-[0_1px_0_rgba(255,255,255,0.25)_inset] hover:brightness-110",
  secondary: "bg-elevated text-bone border border-line hover:bg-line hover:border-line-strong",
  outline: "border border-gold/40 text-gold hover:bg-gold/10 hover:border-gold/70",
  ghost: "text-ash hover:bg-elevated hover:text-bone",
  success: "bg-emerald-600 text-white hover:bg-emerald-500",
  danger: "bg-red-600 text-white hover:bg-red-500",
  "danger-outline":
    "border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/70",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-7 text-base",
  icon: "h-10 w-10",
};

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:pointer-events-none disabled:opacity-40";

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return <button ref={ref} className={buttonClasses(variant, size, className)} {...props} />;
  },
);

Button.displayName = "Button";

type ButtonLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    variant?: Variant;
    size?: Size;
  };

/** Renders a single anchor, avoiding the invalid `<a><button></a>` nesting. */
export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
