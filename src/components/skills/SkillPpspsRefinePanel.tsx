"use client";

import { Loader2, Wand2 } from "lucide-react";
import { useState } from "react";

type Props = {
  sessionId: string | null;
  disabled?: boolean;
  loading?: boolean;
  onRefine: (instruction: string) => void;
};

const REFINE_SUGGESTIONS = [
  "Développer les modes opératoires étape par étape",
  "Renforcer les mesures de prévention collective",
  "Ajouter les habilitations et contrôles préalables",
  "Préciser les EPI par phase de travail",
  "Lister les points bloquants avant validation CSPS",
] as const;

export function SkillPpspsRefinePanel({ sessionId, disabled, loading, onRefine }: Props) {
  const [instruction, setInstruction] = useState("");

  if (!sessionId) return null;

  return (
    <div className="space-y-3 rounded-xl border border-[#93c5fd]/40 bg-gradient-to-b from-[#f8fafc] to-white p-4">
      <div>
        <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-[#0f172a]">
          <Wand2 className="size-4 text-[#2563eb]" aria-hidden />
          Affiner l&apos;analyse
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Itération sur l&apos;analyse générée (conserve le chantier, les tâches et les documents de la session).
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {REFINE_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled || loading}
            onClick={() => setInstruction(s)}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-[#93c5fd]/60 hover:bg-[#eff6ff] disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="Ex. : Détaille les risques électriques et les consignations…"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#2563eb]/50 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/15"
        disabled={disabled || loading}
      />
      <button
        type="button"
        disabled={disabled || loading || !instruction.trim()}
        onClick={() => {
          onRefine(instruction.trim());
          setInstruction("");
        }}
        className="inline-flex items-center gap-2 rounded-full border border-[#1e3a5f]/30 bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#152a45] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
        Affiner l&apos;analyse PPSPS
      </button>
    </div>
  );
}
