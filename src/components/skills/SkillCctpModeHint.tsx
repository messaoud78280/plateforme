"use client";

import { Lightbulb } from "lucide-react";
import { getCctpModeUiHint, type CctpGenerationMode } from "@/lib/skills/cctp-generation-modes";

type Props = {
  mode: CctpGenerationMode;
};

export function SkillCctpModeHint({ mode }: Props) {
  return (
    <p className="flex gap-2 rounded-lg border border-[#1e3a5f]/10 bg-[#f8fafc] px-3 py-2.5 text-xs leading-relaxed text-slate-600">
      <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-[#1d4ed8]" aria-hidden />
      <span>{getCctpModeUiHint(mode)}</span>
    </p>
  );
}
