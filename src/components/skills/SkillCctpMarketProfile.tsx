"use client";

import { CCTP_MARKET_PROFILES, type CctpMarketProfile } from "@/lib/skills/cctp-generation-modes";

type Props = {
  value: CctpMarketProfile | null;
  onChange: (profile: CctpMarketProfile | null) => void;
};

export function SkillCctpMarketProfile({ value, onChange }: Props) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-slate-800">Profil marché (optionnel)</legend>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            value === null
              ? "border-[#2563eb]/60 bg-[#eff6ff] text-[#1d4ed8]"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          Non précisé
        </button>
        {CCTP_MARKET_PROFILES.map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.hint}
            onClick={() => onChange(p.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              value === p.id
                ? "border-[#2563eb]/60 bg-[#eff6ff] text-[#1d4ed8]"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
