"use client";

import { CCTP_GENERATION_MODES, type CctpGenerationMode } from "@/lib/skills/cctp-generation-modes";

type Props = {
  value: CctpGenerationMode;
  onChange: (mode: CctpGenerationMode) => void;
};

export function SkillCctpModeSelector({ value, onChange }: Props) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-slate-800">Mode de mission</legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {CCTP_GENERATION_MODES.map((mode) => {
          const active = value === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChange(mode.id)}
              className={`rounded-xl border px-3 py-2.5 text-left transition ${
                active
                  ? "border-[#2563eb]/60 bg-[#eff6ff] ring-1 ring-[#2563eb]/20"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className={`block text-sm font-semibold ${active ? "text-[#1d4ed8]" : "text-slate-800"}`}>
                {mode.label}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">{mode.description}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
