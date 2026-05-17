"use client";

import { Layers } from "lucide-react";
import { PPSPS_TRADE_TEMPLATES, type PpspsTradeTemplate } from "@/content/ppsps-trade-templates";

type Props = {
  onApply: (template: PpspsTradeTemplate) => void;
};

export function SkillPpspsTradeTemplates({ onApply }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 font-heading text-base font-bold text-slate-900">
        <Layers className="size-4 text-[#2563eb]" aria-hidden />
        Modèles par corps d&apos;état
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Préremplit le chantier, les tâches à risques et les contraintes — à adapter avant génération.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {PPSPS_TRADE_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onApply(tpl)}
            className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left transition hover:border-[#1e3a5f]/30 hover:bg-white hover:shadow-sm"
          >
            <span className="text-sm font-bold text-slate-900">{tpl.label}</span>
            <span className="mt-1 block line-clamp-2 text-xs text-slate-500">{tpl.constraints}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
