"use client";

import { cn } from "@/lib/cn";

type Kpi = {
  id: string;
  value: number;
  label: string;
  tone: "navy" | "accent" | "watch" | "ok";
  onClick: () => void;
  active?: boolean;
};

const TONE: Record<Kpi["tone"], { value: string; bar: string; bg: string }> = {
  navy: {
    value: "text-bework-navy",
    bar: "bg-bework-navy",
    bg: "bg-bework-soft-navy/80",
  },
  accent: {
    value: "text-bework-accent",
    bar: "bg-bework-accent",
    bg: "bg-bework-soft-accent/70",
  },
  watch: {
    value: "text-[#b45309]",
    bar: "bg-bework-watch",
    bg: "bg-amber-50",
  },
  ok: {
    value: "text-bework-ok",
    bar: "bg-bework-ok",
    bg: "bg-bework-soft-ok/80",
  },
};

export function DocumentCenterKpis({ items }: { items: Kpi[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((k) => {
        const t = TONE[k.tone];
        return (
          <button
            key={k.id}
            type="button"
            onClick={k.onClick}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-bework-navy/10 px-3.5 py-3 text-left shadow-[var(--cc-shadow)] transition hover:-translate-y-px",
              t.bg,
              k.active && "ring-2 ring-bework-accent/25",
            )}
          >
            <span className={cn("absolute inset-y-0 left-0 w-0.5", t.bar)} aria-hidden />
            <p className={cn("text-[1.35rem] font-semibold tabular-nums leading-none", t.value)}>
              {k.value}
            </p>
            <p className="mt-1.5 text-[12px] font-medium text-slate-600">{k.label}</p>
          </button>
        );
      })}
    </div>
  );
}
