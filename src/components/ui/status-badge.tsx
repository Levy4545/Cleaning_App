import { cn } from "@/lib/utils";

type StatusTheme = {
  /** Pill background, border and text. */
  pill: string;
  /** Solid colour for dots and card accent stripes. */
  accent: string;
  label: string;
};

export const statusThemes: Record<string, StatusTheme> = {
  PENDING: {
    pill: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    accent: "bg-amber-400",
    label: "Pending",
  },
  APPROVED: {
    pill: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    accent: "bg-blue-400",
    label: "Approved",
  },
  ASSIGNED: {
    pill: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
    accent: "bg-indigo-400",
    label: "Assigned",
  },
  IN_PROGRESS: {
    pill: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    accent: "bg-sky-400",
    label: "In progress",
  },
  COMPLETED: {
    pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    accent: "bg-emerald-400",
    label: "Completed",
  },
  CANCELLED_BY_USER: {
    pill: "border-line-strong bg-elevated text-ash",
    accent: "bg-slate-500",
    label: "Cancelled",
  },
  CANCELLED_BY_ADMIN: {
    pill: "border-line-strong bg-elevated text-ash",
    accent: "bg-slate-500",
    label: "Cancelled by shop",
  },
  REJECTED: {
    pill: "border-red-500/30 bg-red-500/10 text-red-300",
    accent: "bg-red-400",
    label: "Rejected",
  },
};

const fallback: StatusTheme = {
  pill: "border-line-strong bg-elevated text-ash",
  accent: "bg-slate-500",
  label: "Unknown",
};

export function statusTheme(status: string): StatusTheme {
  return statusThemes[status] ?? { ...fallback, label: status.replaceAll("_", " ") };
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const theme = statusTheme(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        theme.pill,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", theme.accent)} />
      {theme.label}
    </span>
  );
}
