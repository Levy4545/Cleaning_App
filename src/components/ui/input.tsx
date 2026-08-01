import { type InputHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

export const inputClasses =
  "flex h-10 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-bone transition-colors placeholder:text-faint focus-visible:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/25 disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => {
    return <input ref={ref} type={type} className={cn(inputClasses, className)} {...props} />;
  },
);

Input.displayName = "Input";
