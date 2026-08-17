"use client";

import { CheckCircle2, FolderOpen, Inbox, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type Kpi = {
  id: string;
  value: number;
  label: string;
  tone: "navy" | "accent" | "watch" | "ok" | "amber";
  onClick: () => void;
  active?: boolean;
};

const TONE: Record<
  Kpi["tone"],
  { value: string; bar: string; bg: string; icon: string }
> = {
  navy: {
    value: "text-bework-navy",
    bar: "bg-bework-navy",
    bg: "bg-bework-soft-navy/80",
    icon: "text-bework-navy/70",
  },
  accent: {
    value: "text-bework-accent",
    bar: "bg-bework-accent",
    bg: "bg-bework-soft-accent/70",
    icon: "text-bework-accent",
  },
  watch: {
    value: "text-[#b45309]",
    bar: "bg-bework-watch",
    bg: "bg-amber-50",
    icon: "text-bework-watch",
  },
  ok: {
    value: "text-bework-ok",
    bar: "bg-bework-ok",
    bg: "bg-bework-soft-ok/80",
    icon: "text-bework-ok",
  },
  amber: {
    value: "text-amber-800",
    bar: "bg-amber-500",
    bg: "bg-amber-50/80",
    icon: "text-amber-600",
  },
};

const ICONS: Record<string, typeof FolderOpen> = {
  all: FolderOpen,
  week: CheckCircle2,
  missing: TriangleAlert,
  classify: Inbox,
};

export function DocumentCenterKpis({ items }: { items: Kpi[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((k) => {
        const t = TONE[k.tone];
        const Icon = ICONS[k.id] ?? FolderOpen;
        return (
          <button
            key={k.id}
            type="button"
            onClick={k.onClick}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-bework-navy/10 px-3 py-2.5 text-left shadow-[var(--cc-shadow)] transition hover:-translate-y-px hover:border-bework-navy/18",
              t.bg,
              k.active && "ring-2 ring-bework-accent/25",
            )}
          >
            <span className={cn("absolute inset-y-0 left-0 w-0.5", t.bar)} aria-hidden />
            <div className="flex items-start justify-between gap-2">
              <p className={cn("text-[1.45rem] font-semibold tabular-nums leading-none", t.value)}>
                {k.value}
              </p>
              <Icon className={cn("mt-0.5 h-3.5 w-3.5 opacity-70", t.icon)} strokeWidth={1.75} />
            </div>
            <p className="mt-1.5 text-[12px] font-medium leading-tight text-slate-600">{k.label}</p>
          </button>
        );
      })}
    </div>
  );
}
