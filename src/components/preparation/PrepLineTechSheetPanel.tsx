"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PrepLineDTO, PrepTechnicalReference, TechRefKind } from "@/lib/preparation/types";
import { TECH_REF_KIND_LABELS } from "@/lib/preparation/types";
import { displayUnit, formatQty } from "@/lib/preparation/units";
import { PROVENANCE_LABELS } from "@/lib/preparation/types";
import { NatureBadge, RoleBadge } from "./prep-ui";

type Draft = {
  designation: string;
  description: string;
  includedServices: string;
  executionNotes: string;
  qualityControls: string;
  technicalReservations: string;
  technicalReferences: PrepTechnicalReference[];
};

function listToText(items: string[]): string {
  return items.join("\n");
}

function textToList(raw: string): string[] {
  return raw
    .split(/\n/)
    .map((x) => x.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 40);
}

function toDraft(line: PrepLineDTO): Draft {
  return {
    designation: line.designation,
    description: line.description ?? "",
    includedServices: listToText(line.includedServices),
    executionNotes: line.executionNotes ?? "",
    qualityControls: listToText(line.qualityControls),
    technicalReservations: listToText(line.technicalReservations),
    technicalReferences: line.technicalReferences.map((r) => ({ ...r })),
  };
}

const KIND_STYLE: Record<TechRefKind, string> = {
  INDICATIVE: "bg-slate-100 text-slate-700 ring-slate-200",
  DOSSIER: "bg-sky-50 text-sky-800 ring-sky-200",
  TO_VERIFY: "bg-amber-50 text-amber-800 ring-amber-200",
};

export function PrepLineTechSheetPanel({
  line,
  quantity,
  characteristics,
  busy,
  onClose,
  onSave,
}: {
  line: PrepLineDTO;
  quantity: number | null;
  characteristics: { label: string; value: string }[];
  busy: boolean;
  onClose: () => void;
  onSave: (texts: {
    designation: string;
    description: string | null;
    includedServices: string[];
    technicalReferences: PrepTechnicalReference[];
    executionNotes: string | null;
    qualityControls: string[];
    technicalReservations: string[];
  }) => Promise<void>;
}) {
  const [draft, setDraft] = useState(() => toDraft(line));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(toDraft(line));
  }, [line]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dirty =
    draft.designation !== line.designation ||
    draft.description !== (line.description ?? "") ||
    draft.includedServices !== listToText(line.includedServices) ||
    draft.executionNotes !== (line.executionNotes ?? "") ||
    draft.qualityControls !== listToText(line.qualityControls) ||
    draft.technicalReservations !== listToText(line.technicalReservations) ||
    JSON.stringify(draft.technicalReferences) !== JSON.stringify(line.technicalReferences);

  async function save() {
    if (!draft.designation.trim()) return;
    setSaving(true);
    try {
      await onSave({
        designation: draft.designation.trim(),
        description: draft.description.trim() || null,
        includedServices: textToList(draft.includedServices),
        technicalReferences: draft.technicalReferences.filter((r) => r.label.trim()),
        executionNotes: draft.executionNotes.trim() || null,
        qualityControls: textToList(draft.qualityControls),
        technicalReservations: textToList(draft.technicalReservations),
      });
    } finally {
      setSaving(false);
    }
  }

  function updateRef(i: number, patch: Partial<PrepTechnicalReference>) {
    setDraft((d) => ({
      ...d,
      technicalReferences: d.technicalReferences.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-[1px]" role="dialog" aria-modal="true">
      <button type="button" className="flex-1 cursor-default" aria-label="Fermer" onClick={onClose} />
      <aside className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl ring-1 ring-slate-200">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="font-mono text-[12px] font-semibold tracking-wide text-[#1e3a5f]">{line.code}</p>
            <h2 className="mt-0.5 text-[16px] font-semibold text-slate-900">Fiche technique</h2>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <RoleBadge role={line.role} />
              <NatureBadge nature={line.nature} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-[13px] text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            Fermer
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 text-[13px]">
          <Field label="Désignation">
            <textarea
              value={draft.designation}
              onChange={(e) => setDraft((d) => ({ ...d, designation: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13.5px] text-slate-900 outline-none focus:border-[#1e3a5f]/40 focus:ring-2 focus:ring-[#1e3a5f]/15"
            />
          </Field>

          <Field label="Description technique">
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              rows={6}
              placeholder="Objet des travaux, limites de prestation, méthode…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] leading-relaxed text-slate-800 outline-none focus:border-[#1e3a5f]/40 focus:ring-2 focus:ring-[#1e3a5f]/15"
            />
          </Field>

          <Field label="Prestations comprises" hint="Une ligne par prestation">
            <textarea
              value={draft.includedServices}
              onChange={(e) => setDraft((d) => ({ ...d, includedServices: e.target.value }))}
              rows={5}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal text-[13px] text-slate-800 outline-none focus:border-[#1e3a5f]/40 focus:ring-2 focus:ring-[#1e3a5f]/15"
            />
          </Field>

          {characteristics.length ? (
            <section>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Caractéristiques</p>
              <ul className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                {characteristics.map((c) => (
                  <li key={c.label} className="flex justify-between gap-3 border-b border-slate-100 py-1 last:border-0">
                    <span className="text-slate-500">{c.label}</span>
                    <span className="tabular-nums text-slate-900">{c.value}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-xl border border-slate-200 bg-[#1e3a5f]/[0.03] px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Quantité</p>
            <p className="mt-0.5 text-[18px] font-semibold tabular-nums text-[#1e3a5f]">
              {formatQty(quantity)} <span className="text-[13px] font-medium text-slate-500">{displayUnit(line.unit)}</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              La modification de la fiche technique ne change jamais la quantité.
            </p>
          </section>

          <Field label="Références techniques">
            <div className="space-y-2">
              {draft.technicalReferences.map((ref, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-2.5">
                  <div className="flex gap-2">
                    <input
                      value={ref.label}
                      onChange={(e) => updateRef(i, { label: e.target.value })}
                      placeholder="Ex. NF DTU 13.1"
                      className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[13px] outline-none focus:border-[#1e3a5f]/40"
                    />
                    <select
                      value={ref.kind}
                      onChange={(e) => updateRef(i, { kind: e.target.value as TechRefKind })}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[12px] outline-none"
                    >
                      {(Object.keys(TECH_REF_KIND_LABELS) as TechRefKind[]).map((k) => (
                        <option key={k} value={k}>
                          {TECH_REF_KIND_LABELS[k]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          technicalReferences: d.technicalReferences.filter((_, idx) => idx !== i),
                        }))
                      }
                      className="rounded-lg px-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                  <span className={cn("mt-1.5 inline-flex rounded-md px-1.5 py-0.5 text-[10px] ring-1", KIND_STYLE[ref.kind])}>
                    {TECH_REF_KIND_LABELS[ref.kind]}
                  </span>
                  <input
                    value={ref.note ?? ""}
                    onChange={(e) => updateRef(i, { note: e.target.value || null })}
                    placeholder="Précision (indicatif, à confirmer…)"
                    className="mt-1.5 w-full rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-[12px] text-slate-600 outline-none"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    technicalReferences: [...d.technicalReferences, { label: "", kind: "INDICATIVE", note: null }],
                  }))
                }
                className="rounded-lg px-2 py-1 text-[12px] font-medium text-[#1e3a5f] hover:bg-slate-100"
              >
                + Ajouter une référence
              </button>
            </div>
          </Field>

          <Field label="Notes d'exécution">
            <textarea
              value={draft.executionNotes}
              onChange={(e) => setDraft((d) => ({ ...d, executionNotes: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-[#1e3a5f]/40 focus:ring-2 focus:ring-[#1e3a5f]/15"
            />
          </Field>

          <Field label="Contrôles qualité" hint="Une ligne par contrôle">
            <textarea
              value={draft.qualityControls}
              onChange={(e) => setDraft((d) => ({ ...d, qualityControls: e.target.value }))}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-[#1e3a5f]/40 focus:ring-2 focus:ring-[#1e3a5f]/15"
            />
          </Field>

          <Field label="Réserves / points à confirmer" hint="Une ligne par réserve">
            <textarea
              value={draft.technicalReservations}
              onChange={(e) => setDraft((d) => ({ ...d, technicalReservations: e.target.value }))}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-[#1e3a5f]/40 focus:ring-2 focus:ring-[#1e3a5f]/15"
            />
          </Field>

          <section className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-[12px] text-slate-500">
            <p className="font-medium text-slate-700">Provenance</p>
            <p className="mt-0.5">
              {line.provenance ? PROVENANCE_LABELS[line.provenance] : line.formula ? "Calculé" : "Non renseignée"}
              {line.textsUserEdited ? " · Fiche retouchée manuellement" : null}
            </p>
          </section>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-100">
            Annuler
          </button>
          <button
            type="button"
            disabled={!dirty || saving || busy || !draft.designation.trim()}
            onClick={() => void save()}
            className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40"
          >
            {saving ? "Enregistrement…" : "Enregistrer la fiche"}
          </button>
        </footer>
      </aside>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        {hint ? <span className="text-[11px] font-normal normal-case tracking-normal text-slate-400">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}
