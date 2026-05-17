"use client";

import { PPSPS_SITE_PROFILES, type PpspsSiteProfile } from "@/lib/skills/ppsps-generation-modes";

type Props = {
  value: PpspsSiteProfile | null;
  onChange: (profile: PpspsSiteProfile | null) => void;
};

export function SkillPpspsSiteProfile({ value, onChange }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-heading text-base font-bold text-slate-900">Profil chantier</h2>
      <p className="mt-1 text-sm text-slate-600">Adapte le ton et les points de vigilance (public, privé, sous-traitance…).</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            !value
              ? "border-[#1e3a5f] bg-[#eff6ff] text-[#1e40af]"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          Non précisé
        </button>
        {PPSPS_SITE_PROFILES.map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.hint}
            onClick={() => onChange(p.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              value === p.id
                ? "border-[#1e3a5f] bg-[#eff6ff] text-[#1e40af]"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </section>
  );
}
