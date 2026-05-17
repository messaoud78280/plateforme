"use client";

import { PPSPS_NORM_REFERENCE_OPTIONS } from "@/content/ppsps-norm-references";

type Props = {
  selected: string[];
  onChange: (ids: string[]) => void;
};

export function SkillPpspsNormPicker({ selected, onChange }: Props) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <fieldset className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-800">Références prévention / réglementaire</legend>
      <p className="text-xs text-slate-500">
        Familles à croiser avec la documentation officielle — aucun numéro de texte n&apos;est inventé.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {PPSPS_NORM_REFERENCE_OPTIONS.map((opt) => {
          const checked = selected.includes(opt.id);
          return (
            <li key={opt.id}>
              <label
                className={`flex cursor-pointer gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  checked
                    ? "border-[#93c5fd]/80 bg-[#eff6ff] text-[#1e40af]"
                    : "border-slate-200/90 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]/30"
                  checked={checked}
                  onChange={() => toggle(opt.id)}
                />
                <span>
                  <span className="font-medium">{opt.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{opt.hint}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
