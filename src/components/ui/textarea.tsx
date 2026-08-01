import { type TextareaHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";
import { inputClasses } from "@/components/ui/input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(inputClasses, "h-auto min-h-20 resize-y leading-relaxed", className)}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
