import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const tones = {
  gold: "text-gold",
  amber: "text-amber-400",
  blue: "text-blue-400",
  emerald: "text-emerald-400",
  bone: "text-bone",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "bone",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: keyof typeof tones;
}) {
  return (
    <div className="edge-gold relative overflow-hidden rounded-xl border border-line bg-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-ash">{label}</p>
        {Icon ? <Icon className={cn("h-4 w-4", tones[tone])} /> : null}
      </div>
      <p className={cn("mt-3 font-display text-4xl leading-none tracking-tight", tones[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}
