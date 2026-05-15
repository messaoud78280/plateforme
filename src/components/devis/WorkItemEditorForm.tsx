"use client";

import type { WorkItem } from "@prisma/client";
import { useCallback, useState } from "react";
import { createWorkItem, updateWorkItem } from "@/app/dashboard/devis/actions";
import type {
  StructuredPasteFieldKey,
  StructuredPasteFormValues,
} from "@/lib/be-work-devis-structured-paste";
import {
  QUALITY_LEVEL_LABELS,
  WORK_ITEM_STATUS_LABELS,
  WORK_ITEM_UNITS,
} from "@/lib/be-work-devis-labels";
import { WorkItemStructuredPastePanel } from "@/components/devis/WorkItemStructuredPastePanel";

type Props = {
  mode: "create" | "edit";
  item?: WorkItem;
  /** Ajout rapide JSON — réservé à la page création. */
  enableStructuredPaste?: boolean;
};

export function WorkItemEditorForm({ mode, item, enableStructuredPaste = false }: Props) {
  const action = mode === "create" ? createWorkItem : updateWorkItem;

  const [pasteTick, setPasteTick] = useState(0);
  const [createDraft, setCreateDraft] = useState<StructuredPasteFormValues | null>(null);

  const applyPaste = useCallback((values: StructuredPasteFormValues) => {
    setCreateDraft(values);
    setPasteTick((t) => t + 1);
  }, []);

  const clearPaste = useCallback(() => {
    setCreateDraft(null);
    setPasteTick((t) => t + 1);
  }, []);

  const fieldVal = useCallback(
    (field: StructuredPasteFieldKey): string => {
      if (mode === "edit" && item) {
        const v = item[field as keyof WorkItem];
        if (v === null || v === undefined) return "";
        return String(v);
      }
      if (createDraft) return createDraft[field] ?? "";
      if (field === "unit") return "m²";
      if (field === "qualityLevel") return "standard";
      if (field === "status") return "brouillon";
      return "";
    },
    [mode, item, createDraft],
  );

  const showEnumPlaceholder = Boolean(enableStructuredPaste && mode === "create");

  return (
    <div className="space-y-8">
      {enableStructuredPaste && mode === "create" ? (
        <WorkItemStructuredPastePanel onApplyValues={applyPaste} onClearForm={clearPaste} />
      ) : null}

      <form
        key={mode === "edit" && item ? `edit-${item.id}` : `create-${pasteTick}`}
        action={action}
        className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        {mode === "edit" && item ? <input type="hidden" name="id" value={item.id} /> : null}

        <section className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-800">Code BeWork *</label>
            <input
              name="code"
              required
              defaultValue={fieldVal("code")}
              placeholder="BW-CAR-001"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800">Lot *</label>
            <input
              name="lot"
              required
              defaultValue={fieldVal("lot")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800">Sous-lot</label>
            <input
              name="subLot"
              defaultValue={fieldVal("subLot")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800">Famille</label>
            <input
              name="family"
              defaultValue={fieldVal("family")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800">Unité *</label>
            <select
              name="unit"
              required
              defaultValue={fieldVal("unit")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            >
              {showEnumPlaceholder ? (
                <option value="">— Choisir une unité —</option>
              ) : null}
              {WORK_ITEM_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800">Gamme *</label>
            <select
              name="qualityLevel"
              required
              defaultValue={fieldVal("qualityLevel")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            >
              {showEnumPlaceholder ? <option value="">— Choisir une gamme —</option> : null}
              {Object.entries(QUALITY_LEVEL_LABELS).map(([k, lab]) => (
                <option key={k} value={k}>
                  {lab}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800">Statut *</label>
            <select
              name="status"
              required
              defaultValue={fieldVal("status")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            >
              {showEnumPlaceholder ? <option value="">— Choisir un statut —</option> : null}
              {Object.entries(WORK_ITEM_STATUS_LABELS).map(([k, lab]) => (
                <option key={k} value={k}>
                  {lab}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800">Titre court *</label>
            <input
              name="title"
              required
              defaultValue={fieldVal("title")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800">Désignation courte</label>
            <textarea
              name="shortDescription"
              rows={3}
              defaultValue={fieldVal("shortDescription")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800">Désignation complète *</label>
            <textarea
              name="fullDescription"
              required
              rows={6}
              defaultValue={fieldVal("fullDescription")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800">Référence technique indicative</label>
            <input
              name="technicalReference"
              defaultValue={fieldVal("technicalReference")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-800">Points inclus</label>
            <textarea
              name="includedItems"
              rows={4}
              defaultValue={fieldVal("includedItems")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-800">Points exclus</label>
            <textarea
              name="excludedItems"
              rows={4}
              defaultValue={fieldVal("excludedItems")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-800">Points de vigilance</label>
            <textarea
              name="vigilancePoints"
              rows={4}
              defaultValue={fieldVal("vigilancePoints")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800">Questions client</label>
            <textarea
              name="clientQuestions"
              rows={4}
              defaultValue={fieldVal("clientQuestions")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800">Questions entreprise</label>
            <textarea
              name="companyQuestions"
              rows={4}
              defaultValue={fieldVal("companyQuestions")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-800">Notes internes</label>
            <textarea
              name="internalNotes"
              rows={4}
              defaultValue={fieldVal("internalNotes")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
        </section>

        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
          <button
            type="submit"
            className="inline-flex items-center rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45]"
          >
            {mode === "create" ? "Créer l’ouvrage" : "Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </div>
  );
}
