"use client";

import { useState } from "react";
import type { DpgfAnalysisModeOperatoireDetaille } from "@/lib/dpgf-analysis/types";

type Props = {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
};

export function DpgfAnalysisEditableStringList({ label, items, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState("");

  const update = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    onChange([...items, value]);
    setDraft("");
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <p className="text-xs font-bold text-[#1e3a5f]">{label}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={`${label}-${i}`} className="flex flex-wrap items-start gap-2">
            <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f]/10 text-[10px] font-bold text-[#1e3a5f]">
              {i + 1}
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <div className="flex shrink-0 gap-1">
              <IconButton label="Monter" onClick={() => move(i, -1)} disabled={i === 0}>
                ↑
              </IconButton>
              <IconButton label="Descendre" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                ↓
              </IconButton>
              <IconButton label="Supprimer" onClick={() => remove(i)} tone="danger">
                ×
              </IconButton>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder ?? "Ajouter une ligne…"}
          className="min-w-[12rem] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg border border-[#1e3a5f]/20 bg-white px-3 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-[#1e3a5f]/5"
        >
          + Ajouter
        </button>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  tone,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold disabled:opacity-30 ${
        tone === "danger"
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-slate-200 text-slate-600 hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

type DetailleProps = {
  value: DpgfAnalysisModeOperatoireDetaille;
  onChange: (value: DpgfAnalysisModeOperatoireDetaille) => void;
  hiddenInputName: string;
};

export function DpgfAnalysisModeOperatoireDetailleFields({ value, onChange, hiddenInputName }: DetailleProps) {
  const patch = (partial: Partial<DpgfAnalysisModeOperatoireDetaille>) => onChange({ ...value, ...partial });

  return (
    <div className="space-y-4">
      <input type="hidden" name={hiddenInputName} value={JSON.stringify(value)} readOnly />
      <div>
        <label htmlFor="modObjectif" className="text-xs font-semibold text-slate-700">
          Objectif du mode opératoire
        </label>
        <textarea
          id="modObjectif"
          rows={3}
          value={value.objectif}
          onChange={(e) => patch({ objectif: e.target.value })}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Comprendre les étapes concrètes de réalisation de l'ouvrage…"
        />
      </div>
      <DpgfAnalysisEditableStringList
        label="Préparation avant démarrage"
        items={value.preparationAvantDemarrage}
        onChange={(preparationAvantDemarrage) => patch({ preparationAvantDemarrage })}
        placeholder="Ex. Lire le CCTP"
      />
      <DpgfAnalysisEditableStringList
        label="Matériel et moyens"
        items={value.materielEtMoyens}
        onChange={(materielEtMoyens) => patch({ materielEtMoyens })}
        placeholder="Ex. Outillage adapté"
      />
      <DpgfAnalysisEditableStringList
        label="Étapes d'exécution"
        items={value.etapesExecution}
        onChange={(etapesExecution) => patch({ etapesExecution })}
        placeholder="Ex. Implanter l'ouvrage"
      />
      <DpgfAnalysisEditableStringList
        label="Contrôles en cours"
        items={value.controlesEnCours}
        onChange={(controlesEnCours) => patch({ controlesEnCours })}
        placeholder="Ex. Contrôler les niveaux"
      />
      <DpgfAnalysisEditableStringList
        label="Contrôles finaux"
        items={value.controlesFinaux}
        onChange={(controlesFinaux) => patch({ controlesFinaux })}
        placeholder="Ex. Vérifier l'aspect final"
      />
      <DpgfAnalysisEditableStringList
        label="Livrables ou preuves"
        items={value.livrablesOuPreuves}
        onChange={(livrablesOuPreuves) => patch({ livrablesOuPreuves })}
        placeholder="Ex. Photos avant/après"
      />
    </div>
  );
}
