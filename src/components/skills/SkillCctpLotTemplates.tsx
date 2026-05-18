"use client";

import { CCTP_LOT_TEMPLATES } from "@/content/cctp-lot-templates";
import type { CctpProjectContext } from "@/lib/skills/cctp-redaction-types";
import type { CctpGenerationMode } from "@/lib/skills/cctp-generation-modes";

type Props = {
  onApply: (data: {
    context: Partial<CctpProjectContext>;
    normReferences: string[];
    request: string;
    generationMode?: CctpGenerationMode;
  }) => void;
};

export function SkillCctpLotTemplates({ onApply }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-800">Modèles par lot</p>
      <p className="text-xs text-slate-500">Préremplit le contexte et une demande type en un clic.</p>
      <div className="flex flex-wrap gap-2">
        {CCTP_LOT_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() =>
              onApply({
                context: {
                  projectType: t.projectType,
                  lot: t.lot,
                  constraints: t.constraints,
                  detailLevel: "standard",
                },
                normReferences: t.suggestedNorms,
                request: t.sampleRequest,
                generationMode: t.generationMode,
              })
            }
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#93c5fd]/70 hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
