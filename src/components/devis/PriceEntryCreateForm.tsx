import type { PriceSource } from "@prisma/client";
import { createPriceEntry } from "@/app/dashboard/devis/actions";
import { SOURCE_TYPE_LABELS } from "@/lib/be-work-devis-labels";

export function PriceEntryCreateForm({
  workItemId,
  sources,
}: {
  workItemId: string;
  sources: PriceSource[];
}) {
  return (
    <form
      action={createPriceEntry}
      className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-5"
    >
      <input type="hidden" name="workItemId" value={workItemId} />
      <h3 className="text-sm font-bold uppercase tracking-wide text-[#1e3a5f]">Ajouter un prix observé</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-xs font-semibold text-slate-700">Nom de la source *</label>
          <input
            name="sourceName"
            required
            placeholder="Ex. Devis Dupont — Lot GO — févr. 2026"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">Type source *</label>
          <select name="sourceType" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {Object.entries(SOURCE_TYPE_LABELS).map(([k, lab]) => (
              <option key={k} value={k}>
                {lab}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">Lier à une source répertoriée</label>
          <select name="priceSourceId" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">— Aucune —</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">Prix unitaire HT * (€)</label>
          <input
            name="unitPriceHT"
            required
            inputMode="decimal"
            placeholder="120,50"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">TVA (%)</label>
          <input
            name="vatRate"
            defaultValue="20"
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">Quantité</label>
          <input name="quantity" inputMode="decimal" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">Département</label>
          <input name="department" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">Région</label>
          <input name="region" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">Type de projet</label>
          <input name="projectType" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">Gamme (observation)</label>
          <input name="qualityLevel" placeholder="ex. premium" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">Date observée</label>
          <input type="date" name="dateObserved" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">Fiabilité (1–5)</label>
          <select name="reliabilityScore" defaultValue="3" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-xs font-semibold text-slate-700">Notes</label>
          <textarea name="notes" rows={2} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <button
        type="submit"
        className="inline-flex rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af]"
      >
        Enregistrer le prix
      </button>
    </form>
  );
}
