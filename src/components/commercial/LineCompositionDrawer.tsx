"use client";

import { useMemo, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { roundMoney } from "@/lib/commercial/money";

function fmt(n: number, decimals = 2) {
  return roundMoney(n, decimals).toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

type SnapshotComponent = {
  name: string;
  type: string;
  quantityPerUnit: number;
  unit: string;
  unitCostHt: number;
  lossPercent: number;
  lineCostHt?: number;
  comment?: string | null;
};

type Snapshot = {
  feesPercent?: number;
  feesAmountHt?: number;
  sellMode?: string;
  marginPercent?: number;
  unitSellHt?: number;
  components?: SnapshotComponent[];
  breakdown?: {
    materialsHt: number;
    laborHt: number;
    equipmentHt: number;
    subcontractHt: number;
    otherHt: number;
    dryCostHt: number;
    feesHt: number;
    costPriceHt: number;
    marquePercent: number;
    markupPercent: number;
    sellCoefficient?: number;
  };
};

const TYPE_LABELS: Record<string, string> = {
  MATERIAL: "Matériau",
  LABOR: "Main-d'œuvre",
  EQUIPMENT: "Matériel",
  SUBCONTRACT: "Sous-traitance",
  OTHER: "Autre",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-[#1e3a5f] focus:outline-none";

function parseSnapshot(json: unknown): Snapshot {
  if (json && typeof json === "object") return json as Snapshot;
  return {};
}

export function LineCompositionDrawer({
  quoteId,
  line,
  canEdit,
  onClose,
  onSaved,
}: {
  quoteId: string;
  line: {
    id: string;
    designation: string;
    compositionSnapshotJson: unknown;
    unitSellHt: number;
    unitCostHt: number;
  };
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = useMemo(
    () => parseSnapshot(line.compositionSnapshotJson),
    [line.compositionSnapshotJson],
  );

  const [components, setComponents] = useState<SnapshotComponent[]>(() =>
    (initial.components ?? []).map((c) => ({
      ...c,
      lossPercent: c.lossPercent ?? 0,
    })),
  );
  const [feesPercent, setFeesPercent] = useState(String(initial.feesPercent ?? 0));
  const [feesAmountHt, setFeesAmountHt] = useState(String(initial.feesAmountHt ?? 0));
  const [sellMode, setSellMode] = useState(initial.sellMode ?? "MARGIN");
  const [marginPercent, setMarginPercent] = useState(
    String(initial.marginPercent ?? 0),
  );
  const [unitSellHt, setUnitSellHt] = useState(
    String(initial.unitSellHt ?? line.unitSellHt),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const breakdown = initial.breakdown;

  function updateComp(index: number, patch: Partial<SnapshotComponent>) {
    setComponents((rows) =>
      rows.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  async function save(pushToLibrary: boolean) {
    if (!canEdit) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/commercial/quotes/${quoteId}/lines/${line.id}/composition`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            components: components.map((c) => ({
              name: c.name,
              type: c.type,
              quantityPerUnit: Number(c.quantityPerUnit) || 0,
              unit: c.unit,
              unitCostHt: Number(c.unitCostHt) || 0,
              lossPercent: Number(c.lossPercent) || 0,
              comment: c.comment ?? null,
            })),
            feesPercent: Number(feesPercent) || 0,
            feesAmountHt: Number(feesAmountHt) || 0,
            sellMode: sellMode === "FIXED_SELL" ? "FIXED_SELL" : "MARGIN",
            marginPercent: Number(marginPercent) || 0,
            unitSellHt: Number(unitSellHt) || 0,
            pushToLibrary,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function pushLibrary() {
    if (
      !window.confirm(
        "Modifier ce devis et la bibliothèque ?\n\nCette modification mettra à jour l’ouvrage de la bibliothèque et la ligne de ce devis.\n\nLes autres devis existants ne seront pas modifiés.",
      )
    ) {
      return;
    }
    void save(true);
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={line.designation}
      description="Sous-détail figé sur cette ligne de devis"
      widthClass="w-full max-w-lg sm:max-w-lg"
      footer={
        canEdit ? (
          <div className="flex flex-col gap-2">
            {error ? <p className="text-xs text-red-700">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void save(false)}
                className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                Modifier uniquement ce devis
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={pushLibrary}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Modifier ce devis et la bibliothèque
              </button>
            </div>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-slate-500">Coût HT</p>
            <p className="tabular-nums font-semibold">{fmt(line.unitCostHt)} €</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-slate-500">Vente HT</p>
            <p className="tabular-nums font-semibold">{fmt(line.unitSellHt)} €</p>
          </div>
        </div>

        {breakdown ? (
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase text-[#1e3a5f]">
              Décomposition
            </h3>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                ["Matériaux", breakdown.materialsHt],
                ["Main-d'œuvre", breakdown.laborHt],
                ["Matériel", breakdown.equipmentHt],
                ["Sous-traitance", breakdown.subcontractHt],
                ["Autre", breakdown.otherHt],
                ["Déboursé sec", breakdown.dryCostHt],
                ["Frais", breakdown.feesHt],
                ["Prix de revient", breakdown.costPriceHt],
                ["Taux de marque", breakdown.marquePercent],
                ["Taux de marge", breakdown.markupPercent],
                ["Coefficient", breakdown.sellCoefficient ?? 0],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between rounded bg-slate-50 px-2 py-1">
                  <span className="text-slate-500">{label}</span>
                  <span className="tabular-nums font-semibold">
                    {String(label).includes("Taux")
                      ? `${fmt(val as number)} %`
                      : String(label) === "Coefficient"
                        ? fmt(val as number, 4)
                        : `${fmt(val as number)} €`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {canEdit ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] font-bold uppercase text-slate-500">
                Frais %
              </label>
              <input
                className={inputClass}
                type="number"
                step="0.01"
                value={feesPercent}
                onChange={(e) => setFeesPercent(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-bold uppercase text-slate-500">
                Frais €
              </label>
              <input
                className={inputClass}
                type="number"
                step="0.01"
                value={feesAmountHt}
                onChange={(e) => setFeesAmountHt(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-bold uppercase text-slate-500">
                Mode
              </label>
              <select
                className={inputClass}
                value={sellMode}
                onChange={(e) => setSellMode(e.target.value)}
              >
                <option value="MARGIN">Taux de marque</option>
                <option value="FIXED_SELL">PV fixe</option>
              </select>
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-bold uppercase text-slate-500">
                {sellMode === "FIXED_SELL" ? "PV HT" : "Taux de marque %"}
              </label>
              {sellMode === "FIXED_SELL" ? (
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  value={unitSellHt}
                  onChange={(e) => setUnitSellHt(e.target.value)}
                />
              ) : (
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(e.target.value)}
                />
              )}
            </div>
          </div>
        ) : null}

        <div>
          <h3 className="mb-2 text-xs font-bold uppercase text-[#1e3a5f]">Composants</h3>
          {components.length === 0 ? (
            <p className="text-xs text-slate-500">Aucun composant dans le snapshot.</p>
          ) : (
            <ul className="space-y-2">
              {components.map((c, i) => (
                <li
                  key={`${c.name}-${i}`}
                  className="rounded-lg border border-slate-100 p-2.5"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                      {TYPE_LABELS[c.type] ?? c.type}
                    </span>
                    {canEdit ? (
                      <input
                        className={inputClass}
                        value={c.name}
                        onChange={(e) => updateComp(i, { name: e.target.value })}
                      />
                    ) : (
                      <span className="text-xs font-semibold">{c.name}</span>
                    )}
                  </div>
                  {canEdit ? (
                    <div className="grid grid-cols-4 gap-1.5">
                      <input
                        type="number"
                        step="0.0001"
                        className={inputClass}
                        value={c.quantityPerUnit}
                        onChange={(e) =>
                          updateComp(i, { quantityPerUnit: Number(e.target.value) || 0 })
                        }
                        title="Qté / unité"
                      />
                      <input
                        className={inputClass}
                        value={c.unit}
                        onChange={(e) => updateComp(i, { unit: e.target.value })}
                        title="Unité"
                      />
                      <input
                        type="number"
                        step="0.01"
                        className={inputClass}
                        value={c.unitCostHt}
                        onChange={(e) =>
                          updateComp(i, { unitCostHt: Number(e.target.value) || 0 })
                        }
                        title="Coût unit."
                      />
                      <input
                        type="number"
                        step="0.01"
                        className={inputClass}
                        value={c.lossPercent}
                        onChange={(e) =>
                          updateComp(i, { lossPercent: Number(e.target.value) || 0 })
                        }
                        title="Perte %"
                      />
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      {fmt(c.quantityPerUnit, 4)} {c.unit} × {fmt(c.unitCostHt, 4)} €
                      {c.lossPercent > 0 ? ` · perte ${fmt(c.lossPercent)} %` : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Drawer>
  );
}
