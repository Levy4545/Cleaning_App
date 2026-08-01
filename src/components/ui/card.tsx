import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Draws a fading gold hairline along the top edge. */
  glow?: boolean;
};

export function Card({ className, glow = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-line bg-panel p-6",
        glow && "edge-gold",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-5 space-y-1", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("font-display text-xl tracking-tight text-bone", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-ash", className)} {...props} />;
}
