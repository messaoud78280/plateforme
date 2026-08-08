"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { POSTIT_COLORS, URGENCY_STYLES } from "@/lib/follow-up/types";

export type FollowUpCardData = {
  id: string;
  title: string;
  osNumber?: string | null;
  orderNumber?: string | null;
  workObject?: string | null;
  nextAction?: string | null;
  nextActionAtLabel?: string;
  nextActionDone?: boolean;
  statusLabel: string;
  colorKey: string;
  urgency: string;
  urgencyLabel: string;
  assignee?: { name: string } | null;
  delayLabel?: string | null;
  postponeCount?: number;
};

export function FollowUpPostItCard({ sheet }: { sheet: FollowUpCardData }) {
  const color = POSTIT_COLORS[sheet.colorKey] ?? POSTIT_COLORS.jaune;
  const urgency = URGENCY_STYLES[sheet.urgency as keyof typeof URGENCY_STYLES] ?? URGENCY_STYLES.NORMAL;

  return (
    <Link
      href={`/dashboard/fiches-suivi/${sheet.id}`}
      className={cn(
        "block rounded-xl border-2 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        color.bg,
        color.border,
        color.text,
        urgency.bar,
        "border-l-4",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-extrabold uppercase tracking-wide leading-snug">{sheet.title}</h3>
        <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold", urgency.badge)}>
          {sheet.urgencyLabel}
        </span>
      </div>
      {(sheet.osNumber || sheet.orderNumber) && (
        <p className="mt-1 text-xs font-semibold opacity-80">
          {sheet.osNumber ? `OS n°${sheet.osNumber}` : `Cde ${sheet.orderNumber}`}
        </p>
      )}
      {sheet.workObject && <p className="mt-2 text-xs leading-relaxed opacity-90">{sheet.workObject}</p>}
      <div className="mt-3 space-y-1 text-xs">
        {sheet.nextActionAtLabel && sheet.nextActionAtLabel !== "—" && (
          <p>
            <span className="opacity-60">Échéance · </span>
            <span className="font-semibold">{sheet.nextActionAtLabel}</span>
            {sheet.delayLabel ? (
              <span className="ml-1 font-bold text-red-700">(+{sheet.delayLabel})</span>
            ) : null}
          </p>
        )}
        {sheet.assignee?.name && (
          <p>
            <span className="opacity-60">Responsable · </span>
            <span className="font-semibold">{sheet.assignee.name}</span>
          </p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
          {sheet.statusLabel}
        </span>
        {(sheet.postponeCount ?? 0) >= 3 ? (
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
            {sheet.postponeCount} reports
          </span>
        ) : null}
      </div>
      {sheet.nextAction && !sheet.nextActionDone && (
        <p className="mt-3 border-t border-black/10 pt-2 text-xs">
          <span className="opacity-60">Prochaine action · </span>
          <span className="font-bold">{sheet.nextAction}</span>
        </p>
      )}
    </Link>
  );
}
