"use client";

import { Star } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  name,
  size = 20,
}: {
  value: number;
  onChange: (value: number) => void;
  name?: string;
  size?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          className="rounded transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          <Star
            width={size}
            height={size}
            className={cn(
              "transition-colors",
              star <= shown ? "fill-gold text-gold" : "fill-transparent text-line-strong",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          width={size}
          height={size}
          className={cn(
            star <= rating ? "fill-gold text-gold" : "fill-transparent text-line-strong",
          )}
        />
      ))}
    </span>
  );
}
