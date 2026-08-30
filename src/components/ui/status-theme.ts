export type StatusTheme = {
  /** Pill background, border and text. */
  pill: string;
  /** Solid colour for dots and card accent stripes. */
  accent: string;
};

export const statusThemes: Record<string, StatusTheme> = {
  PENDING: {
    pill: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    accent: "bg-amber-400",
  },
  APPROVED: {
    pill: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    accent: "bg-blue-400",
  },
  ASSIGNED: {
    pill: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
    accent: "bg-indigo-400",
  },
  IN_PROGRESS: {
    pill: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    accent: "bg-sky-400",
  },
  COMPLETED: {
    pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    accent: "bg-emerald-400",
  },
  CANCELLED_BY_USER: {
    pill: "border-line-strong bg-elevated text-ash",
    accent: "bg-slate-500",
  },
  CANCELLED_BY_ADMIN: {
    pill: "border-line-strong bg-elevated text-ash",
    accent: "bg-slate-500",
  },
  REJECTED: {
    pill: "border-red-500/30 bg-red-500/10 text-red-300",
    accent: "bg-red-400",
  },
};

const fallback: StatusTheme = {
  pill: "border-line-strong bg-elevated text-ash",
  accent: "bg-slate-500",
};

export function statusTheme(status: string): StatusTheme {
  return statusThemes[status] ?? fallback;
}
