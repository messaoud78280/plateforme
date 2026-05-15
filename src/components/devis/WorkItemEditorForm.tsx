import type { WorkItem } from "@prisma/client";
import { createWorkItem, updateWorkItem } from "@/app/dashboard/devis/actions";
import {
  QUALITY_LEVEL_LABELS,
  WORK_ITEM_STATUS_LABELS,
  WORK_ITEM_UNITS,
} from "@/lib/be-work-devis-labels";

type Props = {
  mode: "create" | "edit";
  item?: WorkItem;
};

export function WorkItemEditorForm({ mode, item }: Props) {
  const action = mode === "create" ? createWorkItem : updateWorkItem;

  return (
    <form action={action} className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {mode === "edit" && item ? <input type="hidden" name="id" value={item.id} /> : null}

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-slate-800">Code BeWork *</label>
          <input
            name="code"
            required
            defaultValue={item?.code ?? ""}
            placeholder="BW-CAR-001"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-800">Lot *</label>
          <input
            name="lot"
            required
            defaultValue={item?.lot ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-800">Sous-lot</label>
          <input
            name="subLot"
            defaultValue={item?.subLot ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-800">Famille</label>
          <input
            name="family"
            defaultValue={item?.family ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-800">Unité *</label>
          <select
            name="unit"
            required
            defaultValue={item?.unit ?? "m²"}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          >
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
            defaultValue={item?.qualityLevel ?? "standard"}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          >
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
            defaultValue={item?.status ?? "brouillon"}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          >
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
            defaultValue={item?.title ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-800">Désignation courte</label>
          <textarea
            name="shortDescription"
            rows={3}
            defaultValue={item?.shortDescription ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-800">Désignation complète *</label>
          <textarea
            name="fullDescription"
            required
            rows={6}
            defaultValue={item?.fullDescription ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-800">Référence technique indicative</label>
          <input
            name="technicalReference"
            defaultValue={item?.technicalReference ?? ""}
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
            defaultValue={item?.includedItems ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-slate-800">Points exclus</label>
          <textarea
            name="excludedItems"
            rows={4}
            defaultValue={item?.excludedItems ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-slate-800">Points de vigilance</label>
          <textarea
            name="vigilancePoints"
            rows={4}
            defaultValue={item?.vigilancePoints ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-800">Questions client</label>
          <textarea
            name="clientQuestions"
            rows={4}
            defaultValue={item?.clientQuestions ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-800">Questions entreprise</label>
          <textarea
            name="companyQuestions"
            rows={4}
            defaultValue={item?.companyQuestions ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-slate-800">Notes internes</label>
          <textarea
            name="internalNotes"
            rows={4}
            defaultValue={item?.internalNotes ?? ""}
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
  );
}
