"use client";

import { AlertTriangle, ClipboardCheck, GitBranch, ShieldAlert } from "lucide-react";
import type { CctpAssistantInsights, CctpVigilanceLevel } from "@/lib/skills/cctp-assistant-intelligence";
import type { CctpProjectContext } from "@/lib/skills/cctp-redaction-types";
import { computeCctpAssistantInsights } from "@/lib/skills/cctp-assistant-intelligence";
import { SkillCctpDocumentBadges } from "@/components/skills/SkillCctpDocumentBadges";

const VIGILANCE_STYLES: Record<
  CctpVigilanceLevel,
  { label: string; badge: string; border: string; dot: string }
> = {
  faible: {
    label: "Faible",
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  moyen: {
    label: "Moyen",
    badge: "bg-amber-50 text-amber-900 ring-amber-200/80",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
  },
  eleve: {
    label: "Élevé",
    badge: "bg-orange-50 text-orange-900 ring-orange-200/80",
    border: "border-orange-200/80",
    dot: "bg-orange-500",
  },
  critique: {
    label: "Critique",
    badge: "bg-red-50 text-red-900 ring-red-200/80",
    border: "border-red-200/80",
    dot: "bg-red-600",
  },
};

type Props = {
  context: CctpProjectContext;
  checkedDocumentIds?: string[];
  insightsFromResult?: CctpAssistantInsights | null;
  compact?: boolean;
};

export function SkillCctpAssistantPanel({ context, checkedDocumentIds, insightsFromResult, compact }: Props) {
  const insights =
    insightsFromResult ??
    computeCctpAssistantInsights(context, { checkedDocumentIds });

  const v = VIGILANCE_STYLES[insights.globalVigilance];

  return (
    <section
      className="rounded-xl border border-[#1e3a5f]/12 bg-gradient-to-br from-[#f8fafc] via-white to-[#eff6ff]/40 shadow-sm"
      aria-label="Assistant travaux — vigilance et audit"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e3a5f]/8 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-[#1d4ed8]" aria-hidden />
          <h2 className="text-sm font-semibold text-[#0f2744]">Assistant travaux — pilotage CCTP</h2>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${v.badge}`}
        >
          <span className={`size-1.5 rounded-full ${v.dot}`} aria-hidden />
          Vigilance {v.label}
        </span>
      </div>

      {insights.documentClassifications?.length ? (
        <SkillCctpDocumentBadges classifications={insights.documentClassifications} compact={compact} />
      ) : null}

      <div className={`grid gap-4 p-4 ${compact ? "" : "lg:grid-cols-3"}`}>
        <div className={`space-y-2 ${compact ? "" : "lg:col-span-1"}`}>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            <AlertTriangle className="size-3.5" aria-hidden />
            Points de vigilance
          </p>
          {insights.vigilanceAlerts.length === 0 ? (
            <p className="text-sm text-slate-600">Renseignez le lot et le contexte pour affiner les alertes.</p>
          ) : (
            <ul className="space-y-2">
              {insights.vigilanceAlerts.slice(0, compact ? 3 : 6).map((a) => {
                const s = VIGILANCE_STYLES[a.level];
                return (
                  <li
                    key={`${a.title}-${a.message}`}
                    className={`rounded-lg border bg-white/90 p-2.5 text-sm ${s.border}`}
                  >
                    <p className="font-semibold text-slate-900">{a.title}</p>
                    <p className="mt-1 text-slate-700">{a.message}</p>
                    {!compact ? (
                      <p className="mt-1.5 text-xs text-slate-500">
                        <span className="font-medium">Pourquoi :</span> {a.whyItMatters}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            <ClipboardCheck className="size-3.5" aria-hidden />
            Audit documentaire
          </p>
          {insights.documentAudit.length === 0 ? (
            <p className="text-sm text-slate-600">Cochez les pièces ou importez des documents pour l&apos;audit.</p>
          ) : (
            <ul className="space-y-2">
              {insights.documentAudit.slice(0, compact ? 3 : 5).map((f, i) => (
                <li key={`${f.finding}-${i}`} className="rounded-lg border border-slate-200/90 bg-white/90 p-2.5 text-sm">
                  <p className="font-medium text-slate-900">{f.finding}</p>
                  <p className="mt-1 text-xs text-[#1d4ed8]">{f.recommendation}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            <GitBranch className="size-3.5" aria-hidden />
            Interfaces inter-lots
          </p>
          <ul className="space-y-2">
            {insights.interfaceAlerts.slice(0, compact ? 2 : 4).map((i) => (
              <li key={`${i.topic}-${i.message}`} className="rounded-lg border border-slate-200/90 bg-white/90 p-2.5 text-sm">
                <p className="font-semibold text-slate-900">{i.topic}</p>
                <p className="mt-1 text-slate-700">{i.message}</p>
                <p className="mt-1 text-xs text-slate-500">{i.lots.join(" · ")}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
