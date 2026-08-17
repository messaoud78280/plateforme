"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/cn";

const TONE = {
  navy: { surface: "bw-surface-tinted-navy", bar: "var(--cc-navy)", pill: "bw-icon-pill-navy" },
  accent: { surface: "bw-surface-tinted-accent", bar: "var(--cc-accent)", pill: "bw-icon-pill-accent" },
  cyan: { surface: "bw-surface-tinted-cyan", bar: "var(--cc-cyan)", pill: "bw-icon-pill-cyan" },
  violet: { surface: "bw-surface-tinted-violet", bar: "var(--cc-intel)", pill: "bw-icon-pill-violet" },
  watch: { surface: "bw-surface-tinted-watch", bar: "var(--cc-watch)", pill: "bw-icon-pill-watch" },
  ok: { surface: "bw-surface-tinted-ok", bar: "var(--cc-ok)", pill: "bw-icon-pill-ok" },
} as const;

export function VisitSectionCard({
  tone,
  icon: Icon,
  title,
  hint,
  children,
}: {
  tone: keyof typeof TONE;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  const t = TONE[tone];
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 shadow-[var(--cc-shadow)] sm:p-5",
        t.surface,
      )}
    >
      <span
        className="pointer-events-none absolute bottom-0 left-0 top-0 w-[3px]"
        style={{ background: t.bar }}
        aria-hidden
      />
      <div className="mb-3 flex items-start gap-3">
        <span className={cn("bw-icon-pill", t.pill)}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-bework-navy">{title}</h2>
          {hint ? <p className="mt-0.5 text-[13px] text-bework-muted">{hint}</p> : null}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export const visitFieldClass =
  "mt-1 w-full rounded-xl border border-bework-navy/15 bg-white px-3 py-2.5 text-[14px] text-bework-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:border-bework-accent/40 focus:shadow-[var(--cc-focus-ring)]";

export const visitLabelClass =
  "block text-[12px] font-semibold uppercase tracking-[0.06em] text-bework-navy/70";
