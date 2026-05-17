"use client";

import { PPSPS_GENERATION_MODES, type PpspsGenerationMode } from "@/lib/skills/ppsps-generation-modes";

type Props = {
  value: PpspsGenerationMode;
  onChange: (mode: PpspsGenerationMode) => void;
};

export function SkillPpspsModeSelector({ value, onChange }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-heading text-base font-bold text-slate-900">Mode de génération</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {PPSPS_GENERATION_MODES.map((mode) => (
          <label
            key={mode.id}
            className={`flex cursor-pointer flex-col rounded-xl border px-4 py-3 transition ${
              value === mode.id
                ? "border-[#1e3a5f] bg-[#eff6ff] ring-1 ring-[#93c5fd]/50"
                : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
            }`}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="ppspsMode"
                checked={value === mode.id}
                onChange={() => onChange(mode.id)}
                className="h-4 w-4 border-slate-300 text-[#1e3a5f]"
              />
              <span className="text-sm font-bold text-slate-900">{mode.label}</span>
            </span>
            <span className="mt-1 pl-6 text-xs text-slate-600">{mode.description}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
