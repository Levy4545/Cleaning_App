import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

const tones = {
  error: { wrap: "border-red-500/30 bg-red-500/10 text-red-300", icon: AlertCircle },
  success: { wrap: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", icon: CheckCircle2 },
  info: { wrap: "border-amber-500/30 bg-amber-500/10 text-amber-200", icon: Info },
};

export function Alert({
  tone = "error",
  title,
  children,
  className,
}: {
  tone?: keyof typeof tones;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { wrap, icon: Icon } = tones[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-2.5 rounded-lg border p-3 text-sm", wrap, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 space-y-1">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className="text-current/90">{children}</div> : null}
      </div>
    </div>
  );
}
