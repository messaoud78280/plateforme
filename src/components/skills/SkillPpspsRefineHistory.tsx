"use client";

import { MessageSquare } from "lucide-react";
import type { PpspsRefineEntry } from "@/lib/skills/ppsps-types";

type Props = {
  refines: PpspsRefineEntry[];
};

export function SkillPpspsRefineHistory({ refines }: Props) {
  if (!refines.length) return null;

  return (
    <aside className="rounded-xl border border-violet-200/80 bg-violet-50/50 px-4 py-3">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-900">
        <MessageSquare className="size-3.5" aria-hidden />
        Affinages ({refines.length})
      </h3>
      <ol className="mt-2 max-h-40 space-y-2 overflow-y-auto text-xs text-violet-950">
        {refines.map((r, i) => (
          <li key={`${r.at}-${i}`} className="rounded-lg border border-violet-100 bg-white/80 px-2.5 py-2">
            <span className="text-violet-600">
              {new Date(r.at).toLocaleString("fr-FR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <p className="mt-0.5 leading-relaxed">{r.instruction}</p>
          </li>
        ))}
      </ol>
    </aside>
  );
}
