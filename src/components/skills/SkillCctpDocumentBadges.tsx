"use client";

import { FileSearch } from "lucide-react";
import type { CctpVigilanceLevel } from "@/lib/skills/cctp-assistant-intelligence";
import type {
  CctpDocumentClassification,
  CctpMetierDocumentType,
} from "@/lib/skills/cctp-document-classifier";

const DOC_TYPE_STYLE: Record<CctpMetierDocumentType, string> = {
  ccap: "bg-violet-50 text-violet-900 ring-violet-200/90",
  ae: "bg-indigo-50 text-indigo-900 ring-indigo-200/90",
  cctp: "bg-sky-50 text-sky-900 ring-sky-200/90",
  dpgf: "bg-teal-50 text-teal-900 ring-teal-200/90",
  devis: "bg-cyan-50 text-cyan-900 ring-cyan-200/90",
  doe: "bg-slate-100 text-slate-800 ring-slate-200/90",
  fiche_technique: "bg-amber-50 text-amber-950 ring-amber-200/90",
  notice_pose: "bg-orange-50 text-orange-950 ring-orange-200/90",
  plan: "bg-stone-100 text-stone-800 ring-stone-200/90",
  inconnu: "bg-slate-50 text-slate-600 ring-slate-200/80",
};

const VIGILANCE_DOT: Record<CctpVigilanceLevel, string> = {
  faible: "bg-emerald-500",
  moyen: "bg-amber-500",
  eleve: "bg-orange-500",
  critique: "bg-red-600",
};

const VIGILANCE_LABEL: Record<CctpVigilanceLevel, string> = {
  faible: "Faible",
  moyen: "Moyen",
  eleve: "Élevé",
  critique: "Critique",
};

type Props = {
  classifications: CctpDocumentClassification[];
  compact?: boolean;
};

export function SkillCctpDocumentBadges({ classifications, compact }: Props) {
  if (!classifications.length) return null;

  return (
    <div className="border-b border-[#1e3a5f]/8 px-4 py-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
        <FileSearch className="size-3.5" aria-hidden />
        Pièces détectées
      </p>
      <ul className="flex flex-col gap-2">
        {classifications.map((c) => (
          <li
            key={c.fileName}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200/80 bg-white/90 px-2.5 py-2 text-sm"
          >
            <span className="min-w-0 flex-1 truncate font-medium text-slate-800" title={c.fileName}>
              {c.fileName}
            </span>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${DOC_TYPE_STYLE[c.documentType]}`}
            >
              {c.badge}
            </span>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80"
              title={`Vigilance ${VIGILANCE_LABEL[c.vigilance]}`}
            >
              <span className={`size-1.5 rounded-full ${VIGILANCE_DOT[c.vigilance]}`} aria-hidden />
              {VIGILANCE_LABEL[c.vigilance]}
            </span>
            {!compact ? (
              <span className="w-full text-xs text-slate-500 sm:w-auto sm:flex-1 sm:text-right">
                {c.analysisLabel}
                {c.confidence !== "haute" ? ` · confiance ${c.confidence}` : ""}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
