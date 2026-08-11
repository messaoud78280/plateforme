"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { roundMoney } from "@/lib/commercial/money";

function fmt(n: number, decimals = 2) {
  return roundMoney(n, decimals).toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

type ComponentRow = {
  id: string;
  name: string;
  type: string;
  quantityPerUnit: number;
  unit: string;
  unitCostHt: number;
  lossPercent: number;
  lineCostHt: number;
};

type Costing = {
  materialsHt: number;
  laborHt: number;
  equipmentHt: number;
  subcontractHt: number;
  otherHt: number;
  dryCostHt: number;
  feesHt: number;
  costPriceHt: number;
  unitSellHt: number;
  marquePercent: number;
  markupPercent: number;
  sellCoefficient: number;
};

type WorkItem = {
  id: string;
  name: string;
  reference: string | null;
  family: string | null;
  saleUnit: string;
  kind: string;
  sellMode: string;
  marginPercent: number;
  unitSellHt: number;
  unitCostHt: number;
  feesPercent: number;
  feesAmountHt: number;
  needsPriceRecalc: boolean;
  components: ComponentRow[];
  costing: Costing;
};

const TYPE_LABELS: Record<string, string> = {
  MATERIAL: "Matériau",
  LABOR: "Main-d'œuvre",
  EQUIPMENT: "Matériel",
  SUBCONTRACT: "Sous-traitance",
  OTHER: "Autre",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]";
const labelClass = "mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500";

export function WorkItemEditor({ workItemId }: { workItemId: string }) {
  const router = useRouter();
  const [item, setItem] = useState<WorkItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    reference: "",
    family: "",
    saleUnit: "U",
    kind: "SIMPLE",
    sellMode: "MARGIN",
    marginPercent: "0",
    unitSellHt: "0",
    feesPercent: "0",
    feesAmountHt: "0",
  });
  const [comp, setComp] = useState({
    type: "MATERIAL",
    name: "",
    quantityPerUnit: "1",
    unit: "U",
    unitCostHt: "0",
    lossPercent: "0",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/library/work-items/${workItemId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      const w = data.workItem as WorkItem;
      setItem(w);
      setForm({
        name: w.name,
        reference: w.reference ?? "",
        family: w.family ?? "",
        saleUnit: w.saleUnit,
        kind: w.kind,
        sellMode: w.sellMode,
        marginPercent: String(w.marginPercent),
        unitSellHt: String(w.unitSellHt),
        feesPercent: String(w.feesPercent),
        feesAmountHt: String(w.feesAmountHt),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [workItemId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveMeta() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/library/work-items/${workItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          reference: form.reference.trim() || null,
          family: form.family.trim() || null,
          saleUnit: form.saleUnit.trim() || "U",
          kind: form.kind,
          sellMode: form.sellMode,
          marginPercent: Number(form.marginPercent) || 0,
          unitSellHt: Number(form.unitSellHt) || 0,
          feesPercent: Number(form.feesPercent) || 0,
          feesAmountHt: Number(form.feesAmountHt) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      await load();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function addComponent() {
    if (!comp.name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/commercial/library/work-items/${workItemId}/components`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: comp.type,
            name: comp.name.trim(),
            quantityPerUnit: Number(comp.quantityPerUnit) || 1,
            unit: comp.unit.trim() || "U",
            unitCostHt: Number(comp.unitCostHt) || 0,
            lossPercent: Number(comp.lossPercent) || 0,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setComp({
        type: "MATERIAL",
        name: "",
        quantityPerUnit: "1",
        unit: "U",
        unitCostHt: "0",
        lossPercent: "0",
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function removeComponent(componentId: string) {
    if (!window.confirm("Supprimer ce composant ?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/commercial/library/work-items/${workItemId}/components?componentId=${encodeURIComponent(componentId)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function duplicate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/library/work-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate", sourceId: workItemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push(`/dashboard/devis-facturation/bibliotheque/${data.workItem.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Chargement…
      </div>
    );
  }

  if (!item) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error || "Ouvrage introuvable"}
      </div>
    );
  }

  const c = item.costing;

  return (
    <div className="space-y-4">
      {item.needsPriceRecalc ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          Prix matière / main-d&apos;œuvre mis à jour — vérifiez le chiffrage de cet ouvrage.
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[#1e3a5f]">Fiche ouvrage</h2>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void duplicate()}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Dupliquer
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveMeta()}
              className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white"
            >
              Enregistrer
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Nom</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Référence</label>
            <input
              className={inputClass}
              value={form.reference}
              onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Famille</label>
            <input
              className={inputClass}
              value={form.family}
              onChange={(e) => setForm((f) => ({ ...f, family: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Unité</label>
            <input
              className={inputClass}
              value={form.saleUnit}
              onChange={(e) => setForm((f) => ({ ...f, saleUnit: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select
              className={inputClass}
              value={form.kind}
              onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
            >
              <option value="SIMPLE">SIMPLE</option>
              <option value="COMPOSITE">COMPOSITE</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Mode de vente</label>
            <select
              className={inputClass}
              value={form.sellMode}
              onChange={(e) => setForm((f) => ({ ...f, sellMode: e.target.value }))}
            >
              <option value="MARGIN">Taux de marque cible</option>
              <option value="FIXED_SELL">Prix de vente fixe</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Taux de marque %</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={form.marginPercent}
              onChange={(e) => setForm((f) => ({ ...f, marginPercent: e.target.value }))}
              disabled={form.sellMode === "FIXED_SELL"}
            />
          </div>
          <div>
            <label className={labelClass}>Prix de vente HT</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={form.unitSellHt}
              onChange={(e) => setForm((f) => ({ ...f, unitSellHt: e.target.value }))}
              disabled={form.sellMode === "MARGIN"}
            />
          </div>
          <div>
            <label className={labelClass}>Frais %</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={form.feesPercent}
              onChange={(e) => setForm((f) => ({ ...f, feesPercent: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Frais montant HT</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={form.feesAmountHt}
              onChange={(e) => setForm((f) => ({ ...f, feesAmountHt: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-bold text-[#1e3a5f]">Décomposition coût</h2>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 lg:grid-cols-5">
          {[
            ["Matériaux", c.materialsHt],
            ["Main-d'œuvre", c.laborHt],
            ["Matériel", c.equipmentHt],
            ["Sous-traitance", c.subcontractHt],
            ["Autre", c.otherHt],
            ["Déboursé sec", c.dryCostHt],
            ["Frais", c.feesHt],
            ["Prix de revient", c.costPriceHt],
            ["Vente HT", c.unitSellHt],
            ["Taux de marque", c.marquePercent],
            ["Taux de marge", c.markupPercent],
            ["Coefficient", c.sellCoefficient],
          ].map(([label, val]) => (
            <div key={String(label)} className="rounded-lg bg-slate-50 px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase text-slate-500">{label}</p>
              <p className="mt-0.5 tabular-nums font-semibold text-slate-900">
                {typeof val === "number" &&
                (String(label).includes("taux") || String(label).includes("Taux"))
                  ? `${fmt(val)} %`
                  : String(label) === "Coefficient"
                    ? fmt(val as number, 4)
                    : `${fmt(val as number)} €`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {form.kind === "COMPOSITE" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-[#1e3a5f]">Composants</h2>
          {item.components.length === 0 ? (
            <p className="mb-3 text-xs text-slate-500">Aucun composant.</p>
          ) : (
            <ul className="mb-4 divide-y divide-slate-100 rounded-lg border border-slate-100">
              {item.components.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs"
                >
                  <div>
                    <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">
                      {TYPE_LABELS[row.type] ?? row.type}
                    </span>
                    <span className="font-semibold text-slate-900">{row.name}</span>
                    <p className="mt-0.5 text-slate-500">
                      {fmt(row.quantityPerUnit, 4)} {row.unit} × {fmt(row.unitCostHt, 4)} €
                      {row.lossPercent > 0 ? ` · perte ${fmt(row.lossPercent)} %` : ""}
                      {" → "}
                      {fmt(row.lineCostHt, 4)} €
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void removeComponent(row.id)}
                    className="rounded-lg border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <div>
              <label className={labelClass}>Type</label>
              <select
                className={inputClass}
                value={comp.type}
                onChange={(e) => setComp((x) => ({ ...x, type: e.target.value }))}
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className={labelClass}>Nom</label>
              <input
                className={inputClass}
                value={comp.name}
                onChange={(e) => setComp((x) => ({ ...x, name: e.target.value }))}
                placeholder="Désignation"
              />
            </div>
            <div>
              <label className={labelClass}>Qté / unité</label>
              <input
                type="number"
                step="0.0001"
                className={inputClass}
                value={comp.quantityPerUnit}
                onChange={(e) => setComp((x) => ({ ...x, quantityPerUnit: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Unité</label>
              <input
                className={inputClass}
                value={comp.unit}
                onChange={(e) => setComp((x) => ({ ...x, unit: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Coût unit. HT</label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={comp.unitCostHt}
                onChange={(e) => setComp((x) => ({ ...x, unitCostHt: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Perte %</label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={comp.lossPercent}
                onChange={(e) => setComp((x) => ({ ...x, lossPercent: e.target.value }))}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={busy || !comp.name.trim()}
            onClick={() => void addComponent()}
            className="mt-3 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            + Ajouter composant
          </button>
        </div>
      ) : null}
    </div>
  );
}
