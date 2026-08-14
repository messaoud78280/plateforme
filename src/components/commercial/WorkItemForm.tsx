"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  calculateComponentLineCost,
  calculateWorkItemCosting,
  roundMoney,
} from "@/lib/commercial/money";
import { cn } from "@/lib/cn";

type ComponentType = "MATERIAL" | "LABOR" | "EQUIPMENT" | "SUBCONTRACT" | "OTHER";
type PriceMode = "direct" | "calculated";

const UNITS = ["U", "ml", "m²", "m³", "kg", "t", "h", "jour", "forfait"] as const;

const TYPE_LABELS: Record<ComponentType, string> = {
  MATERIAL: "Matériau",
  LABOR: "Main-d’œuvre",
  EQUIPMENT: "Matériel",
  SUBCONTRACT: "Sous-traitance",
  OTHER: "Autre",
};

const PICKER_TABS: { id: ComponentType; label: string }[] = [
  { id: "MATERIAL", label: "Matériau" },
  { id: "LABOR", label: "Main-d’œuvre" },
  { id: "EQUIPMENT", label: "Matériel" },
  { id: "SUBCONTRACT", label: "Sous-traitance" },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#1e3a5f]/40 focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/25";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

export type WorkItemFormRow = {
  id: string;
  name: string;
  reference: string | null;
  family: string | null;
  subFamily: string | null;
  saleUnit: string;
  unitCostHt: number;
  unitSellHt: number;
  marginPercent: number;
  kind: string;
  isActive: boolean;
  isFavorite: boolean;
  needsPriceRecalc: boolean;
  quoteLineCount: number;
  updatedAt: string | Date;
  description?: string | null;
};

type DraftComponent = {
  localId: string;
  id?: string;
  name: string;
  type: ComponentType;
  quantityPerUnit: number;
  unit: string;
  unitCostHt: number;
  lossPercent: number;
  qtyInput?: string;
  costInput?: string;
  materialId?: string | null;
  laborId?: string | null;
  equipmentId?: string | null;
  subcontractorExternalOrgId?: string | null;
};

type LoadedWorkItem = {
  id: string;
  name: string;
  reference: string | null;
  family: string | null;
  subFamily: string | null;
  description: string | null;
  tags: string | null;
  saleUnit: string;
  kind: string;
  sellMode: string;
  marginPercent: number;
  unitSellHt: number;
  feesPercent: number;
  feesAmountHt: number;
  needsPriceRecalc: boolean;
  isFavorite?: boolean;
  isActive?: boolean;
  quoteLineCount?: number;
  unitCostHt?: number;
  components: Array<{
    id: string;
    name: string;
    type: string;
    quantityPerUnit: number;
    unit: string;
    unitCostHt: number;
    lossPercent: number;
    materialId?: string | null;
    laborId?: string | null;
    equipmentId?: string | null;
    subcontractorExternalOrgId?: string | null;
  }>;
};

function fmt(n: number, decimals = 2) {
  return roundMoney(n, decimals).toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function parseNum(s: string): number {
  const n = Number(String(s).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function parseNonNeg(s: string): number {
  return Math.max(0, parseNum(s));
}

function humanError(e: unknown): string {
  const msg = e instanceof Error ? e.message : "Impossible d’enregistrer.";
  if (/failed to fetch|network|load failed/i.test(msg)) {
    return "Connexion interrompue. Réessayez.";
  }
  return msg;
}

function newLocalId() {
  return `tmp-${Math.random().toString(36).slice(2, 10)}`;
}

function toRow(w: LoadedWorkItem, costing: { costPriceHt: number; unitSellHt: number; marquePercent: number }): WorkItemFormRow {
  return {
    id: w.id,
    name: w.name,
    reference: w.reference,
    family: w.family,
    subFamily: w.subFamily,
    saleUnit: w.saleUnit,
    unitCostHt: costing.costPriceHt,
    unitSellHt: costing.unitSellHt,
    marginPercent: costing.marquePercent,
    kind: w.kind,
    isActive: w.isActive !== false,
    isFavorite: Boolean(w.isFavorite),
    needsPriceRecalc: Boolean(w.needsPriceRecalc),
    quoteLineCount: w.quoteLineCount ?? 0,
    updatedAt: new Date().toISOString(),
    description: w.description,
  };
}

export function WorkItemForm({
  mode,
  workItemId,
  families = [],
  layout = "drawer",
  onCreated,
  onSaved,
  onCancel,
}: {
  mode: "create" | "edit";
  workItemId?: string;
  families?: string[];
  layout?: "drawer" | "page";
  onCreated?: (row: WorkItemFormRow) => void;
  onSaved?: (row: WorkItemFormRow) => void;
  onCancel?: () => void;
}) {
  const [loading, setLoading] = useState(mode === "edit");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [needsPriceRecalc, setNeedsPriceRecalc] = useState(false);
  const [activeId, setActiveId] = useState<string | undefined>(workItemId);

  const [name, setName] = useState("");
  const [saleUnit, setSaleUnit] = useState("U");
  const [customUnit, setCustomUnit] = useState("");
  const [priceMode, setPriceMode] = useState<PriceMode>("direct");
  const [unitSellHt, setUnitSellHt] = useState("");
  const [marginPercent, setMarginPercent] = useState("");
  const [sellMode, setSellMode] = useState<"FIXED_SELL" | "MARGIN">("FIXED_SELL");
  const [feesPercent, setFeesPercent] = useState("0");
  const [feesAmountHt, setFeesAmountHt] = useState("0");
  const [family, setFamily] = useState("");
  const [reference, setReference] = useState("");
  const [subFamily, setSubFamily] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [more, setMore] = useState(false);
  const [components, setComponents] = useState<DraftComponent[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const componentsRef = useRef(components);
  componentsRef.current = components;
  const persistTimers = useRef<Record<string, number>>({});

  const costing = useMemo(
    () =>
      calculateWorkItemCosting({
        components:
          priceMode === "direct"
            ? []
            : components.map((c) => ({
                type: c.type,
                quantityPerUnit: c.quantityPerUnit,
                unitCostHt: c.unitCostHt,
                lossPercent: c.lossPercent,
              })),
        feesPercent: priceMode === "direct" ? 0 : parseNum(feesPercent),
        feesAmountHt: priceMode === "direct" ? 0 : parseNum(feesAmountHt),
        sellMode: priceMode === "direct" ? "FIXED_SELL" : sellMode,
        marginPercent: parseNum(marginPercent),
        unitSellHt: parseNum(unitSellHt),
      }),
    [components, feesPercent, feesAmountHt, priceMode, sellMode, marginPercent, unitSellHt],
  );

  const applyLoaded = useCallback((w: LoadedWorkItem) => {
    setActiveId(w.id);
    setName(w.name);
    const unit = w.saleUnit || "U";
    if (UNITS.includes(unit as (typeof UNITS)[number])) {
      setSaleUnit(unit);
      setCustomUnit("");
    } else {
      setSaleUnit("__custom");
      setCustomUnit(unit);
    }
    const calculated = w.kind === "COMPOSITE";
    setPriceMode(calculated ? "calculated" : "direct");
    setSellMode(w.sellMode === "FIXED_SELL" ? "FIXED_SELL" : "MARGIN");
    setUnitSellHt(w.unitSellHt ? String(w.unitSellHt) : "");
    setMarginPercent(w.marginPercent ? String(w.marginPercent) : "");
    setFeesPercent(String(w.feesPercent ?? 0));
    setFeesAmountHt(String(w.feesAmountHt ?? 0));
    setFamily(w.family ?? "");
    setReference(w.reference ?? "");
    setSubFamily(w.subFamily ?? "");
    setDescription(w.description ?? "");
    setTags(w.tags ?? "");
    setNeedsPriceRecalc(Boolean(w.needsPriceRecalc));
    setMore(
      Boolean(
        w.family ||
          w.reference ||
          w.subFamily ||
          w.description ||
          w.tags ||
          w.feesPercent ||
          w.feesAmountHt,
      ),
    );
    setComponents(
      (w.components ?? []).map((c) => ({
        localId: c.id,
        id: c.id,
        name: c.name,
        type: (TYPE_LABELS[c.type as ComponentType] ? c.type : "OTHER") as ComponentType,
        quantityPerUnit: c.quantityPerUnit,
        unit: c.unit,
        unitCostHt: c.unitCostHt,
        lossPercent: c.lossPercent ?? 0,
        qtyInput: String(c.quantityPerUnit).replace(".", ","),
        costInput: String(c.unitCostHt).replace(".", ","),
        materialId: c.materialId ?? null,
        laborId: c.laborId ?? null,
        equipmentId: c.equipmentId ?? null,
        subcontractorExternalOrgId: c.subcontractorExternalOrgId ?? null,
      })),
    );
  }, []);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/library/work-items/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ouvrage introuvable.");
      applyLoaded(data.workItem as LoadedWorkItem);
    } catch (e) {
      setError(humanError(e));
    } finally {
      setLoading(false);
    }
  }, [applyLoaded]);

  useEffect(() => {
    if (mode === "edit" && workItemId) void load(workItemId);
  }, [mode, workItemId, load]);

  useEffect(() => {
    return () => {
      Object.values(persistTimers.current).forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const canSubmit = name.trim().length > 0;
  const isPersisted = Boolean(activeId);
  const resolvedUnit =
    saleUnit === "__custom" ? customUnit.trim() || "U" : saleUnit || "U";

  function switchPriceMode(next: PriceMode) {
    if (next === priceMode) return;
    setPriceMode(next);
    if (next === "direct") {
      setSellMode("FIXED_SELL");
      if (!unitSellHt && costing.costPriceHt > 0 && costing.unitSellHt > 0) {
        setUnitSellHt(String(costing.unitSellHt).replace(".", ","));
      }
    } else {
      setSellMode("MARGIN");
      if (
        !marginPercent &&
        costing.costPriceHt > 0 &&
        costing.marquePercent > 0 &&
        costing.marquePercent < 100
      ) {
        setMarginPercent(String(roundMoney(costing.marquePercent, 2)).replace(".", ","));
      }
    }
  }

  async function persistComponent(draft: DraftComponent, id: string) {
    const res = await fetch(`/api/commercial/library/work-items/${id}/components`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        componentId: draft.id,
        name: draft.name,
        type: draft.type,
        quantityPerUnit: draft.quantityPerUnit,
        unit: draft.unit,
        unitCostHt: draft.unitCostHt,
        lossPercent: draft.lossPercent,
        materialId: draft.materialId ?? null,
        laborId: draft.laborId ?? null,
        equipmentId: draft.equipmentId ?? null,
        subcontractorExternalOrgId: draft.subcontractorExternalOrgId ?? null,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur");
    const saved = data.workItem as LoadedWorkItem | undefined;
    const serverComps = saved?.components ?? [];
    if (!draft.id) {
      const known = new Set(
        componentsRef.current.map((c) => c.id).filter((x): x is string => Boolean(x)),
      );
      const created = serverComps.find((c) => !known.has(c.id));
      if (created) {
        setComponents((prev) =>
          prev.map((c) => (c.localId === draft.localId ? { ...c, id: created.id } : c)),
        );
      }
    }
    return saved;
  }

  function schedulePersist(localId: string) {
    if (!activeId) return;
    window.clearTimeout(persistTimers.current[localId]);
    persistTimers.current[localId] = window.setTimeout(() => {
      const draft = componentsRef.current.find((c) => c.localId === localId);
      if (!draft || !draft.name.trim() || !activeId) return;
      void persistComponent(draft, activeId).catch((e) => {
        setError(humanError(e));
      });
    }, 450);
  }

  function updateComponent(localId: string, patch: Partial<DraftComponent>) {
    setComponents((prev) =>
      prev.map((c) => (c.localId === localId ? { ...c, ...patch } : c)),
    );
    schedulePersist(localId);
  }

  async function addComponent(draft: Omit<DraftComponent, "localId">) {
    const next: DraftComponent = { ...draft, localId: newLocalId() };
    setComponents((prev) => [...prev, next]);
    setPickerOpen(false);
    if (activeId) {
      try {
        await persistComponent(next, activeId);
      } catch (e) {
        setError(humanError(e));
      }
    }
  }

  async function removeComponent(localId: string) {
    const draft = componentsRef.current.find((c) => c.localId === localId);
    setComponents((prev) => prev.filter((c) => c.localId !== localId));
    if (activeId && draft?.id) {
      try {
        const res = await fetch(
          `/api/commercial/library/work-items/${activeId}/components?componentId=${encodeURIComponent(draft.id)}`,
          { method: "DELETE" },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
      } catch (e) {
        setError(humanError(e));
      }
    }
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    setSavedMsg(null);
    Object.values(persistTimers.current).forEach((t) => window.clearTimeout(t));
    try {
      const kind = priceMode === "direct" ? "SIMPLE" : "COMPOSITE";
      const modeSell = priceMode === "direct" ? "FIXED_SELL" : sellMode;
      const payload = {
        name: name.trim(),
        saleUnit: resolvedUnit,
        kind,
        sellMode: modeSell,
        unitSellHt: priceMode === "direct" ? parseNum(unitSellHt) : costing.unitSellHt,
        marginPercent: priceMode === "direct" ? 0 : parseNum(marginPercent),
        feesPercent: parseNum(feesPercent),
        feesAmountHt: parseNum(feesAmountHt),
        family: family.trim() || null,
        reference: reference.trim() || null,
        subFamily: subFamily.trim() || null,
        description: description.trim() || null,
        tags: tags.trim() || null,
      };

      let id = activeId;
      const creating = !id;
      if (!id) {
        const res = await fetch("/api/commercial/library/work-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        id = String(data.workItem.id);
        setActiveId(id);
      } else {
        const res = await fetch(`/api/commercial/library/work-items/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
      }

      for (const c of componentsRef.current) {
        if (priceMode !== "calculated" || !c.name.trim()) continue;
        await persistComponent(c, id);
      }

      const get = await fetch(`/api/commercial/library/work-items/${id}`);
      const got = await get.json();
      if (!get.ok) throw new Error(got.error || "Erreur");
      const saved = got.workItem as LoadedWorkItem;
      applyLoaded(saved);
      const row = toRow(saved, {
        costPriceHt: saved.unitCostHt ?? costing.costPriceHt,
        unitSellHt: saved.unitSellHt ?? costing.unitSellHt,
        marquePercent: saved.marginPercent ?? costing.marquePercent,
      });
      if (creating) {
        setSavedMsg("Ouvrage créé");
        onCreated?.(row);
      } else {
        setSavedMsg("Ouvrage enregistré");
        onSaved?.(row);
      }
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="px-5 py-8 text-sm text-slate-500" role="status">
        Chargement…
      </p>
    );
  }

  const isDrawer = layout === "drawer";
  const submitLabel = mode === "edit" || isPersisted ? "Enregistrer" : "Créer l’ouvrage";

  const body = (
    <form
      id="work-item-form"
      onSubmit={(e) => void submit(e)}
      className={cn("space-y-5", isDrawer ? "px-5 py-5" : "")}
    >
      {needsPriceRecalc ? (
        <p
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          Prix matière / main-d’œuvre mis à jour — vérifiez le chiffrage.
        </p>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="wi-name">
          Nom de l’ouvrage
        </label>
        <input
          id="wi-name"
          autoFocus={mode === "create"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex. Mur en parpaings 20 cm"
          className={inputClass}
          autoComplete="off"
        />
      </div>

      <div>
        <p className={labelClass} id="wi-unit-label">
          Unité
        </p>
        <div
          role="radiogroup"
          aria-labelledby="wi-unit-label"
          className="flex flex-wrap gap-1.5"
        >
          {UNITS.map((u) => (
            <button
              key={u}
              type="button"
              role="radio"
              aria-checked={saleUnit === u}
              onClick={() => {
                setSaleUnit(u);
                setCustomUnit("");
              }}
              className={cn(
                "min-h-10 rounded-full px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/35",
                saleUnit === u
                  ? "bg-[#1e3a5f] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {u}
            </button>
          ))}
          <button
            type="button"
            role="radio"
            aria-checked={saleUnit === "__custom"}
            onClick={() => setSaleUnit("__custom")}
            className={cn(
              "min-h-10 rounded-full px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/35",
              saleUnit === "__custom"
                ? "bg-[#1e3a5f] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            Autre
          </button>
        </div>
        {saleUnit === "__custom" ? (
          <input
            value={customUnit}
            onChange={(e) => setCustomUnit(e.target.value)}
            placeholder="Unité personnalisée"
            className={cn(inputClass, "mt-2")}
            aria-label="Unité personnalisée"
          />
        ) : null}
      </div>

      <div
        role="radiogroup"
        aria-label="Mode de prix"
        className="inline-flex rounded-full bg-slate-100 p-1"
      >
        {(
          [
            ["direct", "Prix direct"],
            ["calculated", "Prix calculé"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={priceMode === id}
            onClick={() => switchPriceMode(id)}
            className={cn(
              "min-h-10 rounded-full px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/35",
              priceMode === id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
            priceMode === "direct" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
        <div className="overflow-hidden">
          <div
            className={priceMode === "direct" ? "pb-1" : "pointer-events-none h-0"}
            aria-hidden={priceMode !== "direct"}
            {...(priceMode !== "direct" ? { inert: true } : {})}
          >
            <label className={labelClass} htmlFor="wi-sell">
              Prix de vente HT
            </label>
            <div className="relative">
              <input
                id="wi-sell"
                value={unitSellHt}
                onChange={(e) => setUnitSellHt(e.target.value)}
                inputMode="decimal"
                placeholder="850,00"
                className={cn(inputClass, "pr-16 tabular-nums")}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
                € / {resolvedUnit}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          priceMode === "calculated" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div
            className={priceMode === "calculated" ? "space-y-5" : "pointer-events-none h-0"}
            aria-hidden={priceMode !== "calculated"}
            {...(priceMode !== "calculated" ? { inert: true } : {})}
          >
            <div>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-900">Composition</h3>
                <button
                  type="button"
                  onClick={() => setPickerOpen((v) => !v)}
                  className="text-sm font-semibold text-[#1e3a5f] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/35"
                >
                  + Ajouter un élément
                </button>
              </div>

              {pickerOpen ? (
                <ResourcePicker
                  onAdd={(c) => void addComponent(c)}
                  onClose={() => setPickerOpen(false)}
                />
              ) : null}

              {components.length === 0 && !pickerOpen ? (
                <p className="text-sm text-slate-500">
                  Ajoutez ce que contient l’ouvrage.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {components.map((c) => (
                    <ComponentLine
                      key={c.localId}
                      row={c}
                      onChange={(patch) => updateComponent(c.localId, patch)}
                      onRemove={() => void removeComponent(c.localId)}
                    />
                  ))}
                </ul>
              )}
            </div>

            {components.length > 0 ? (
              <CostSummary
                costing={costing}
                unit={resolvedUnit}
                marginPercent={marginPercent}
                onMarginChange={(v) => {
                  setSellMode("MARGIN");
                  setMarginPercent(v);
                }}
                sellMode={sellMode}
                unitSellHt={unitSellHt}
                onSellChange={(v) => {
                  setSellMode("FIXED_SELL");
                  setUnitSellHt(v);
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setMore((v) => !v)}
          className="text-sm font-medium text-slate-500 underline-offset-2 hover:text-[#1e3a5f] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/35"
          aria-expanded={more}
        >
          {more ? "Masquer les options" : "Plus d’options"}
        </button>
        {more ? (
          <div className="mt-4 space-y-4">
            <FamilyField value={family} onChange={setFamily} families={families} />
            <div>
              <label className={labelClass} htmlFor="wi-ref">
                Référence interne
              </label>
              <input
                id="wi-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="wi-subfam">
                Sous-famille
              </label>
              <input
                id="wi-subfam"
                value={subFamily}
                onChange={(e) => setSubFamily(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="wi-desc">
                Description
              </label>
              <textarea
                id="wi-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={cn(inputClass, "resize-y")}
                placeholder="Notes de chiffrage, limites de prestation…"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="wi-tags">
                Tags
              </label>
              <input
                id="wi-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className={inputClass}
                placeholder="Séparés par une virgule"
              />
            </div>
            {priceMode === "calculated" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="wi-fees-pct">
                    Frais
                  </label>
                  <div className="relative">
                    <input
                      id="wi-fees-pct"
                      value={feesPercent}
                      onChange={(e) => setFeesPercent(e.target.value)}
                      inputMode="decimal"
                      className={cn(inputClass, "pr-8 tabular-nums")}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
                      %
                    </span>
                  </div>
                </div>
                <div>
                  <label className={labelClass} htmlFor="wi-fees-amt">
                    Frais HT
                  </label>
                  <input
                    id="wi-fees-amt"
                    value={feesAmountHt}
                    onChange={(e) => setFeesAmountHt(e.target.value)}
                    inputMode="decimal"
                    className={cn(inputClass, "tabular-nums")}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {savedMsg && !isDrawer ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {savedMsg}
        </p>
      ) : null}

      {!isDrawer ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={!canSubmit || busy}
            className="rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? (isPersisted ? "Enregistrement…" : "Création…") : submitLabel}
          </button>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
            >
              Fermer
            </button>
          ) : null}
        </div>
      ) : null}
    </form>
  );

  if (!isDrawer) {
    return <div className="max-w-xl">{body}</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
      <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          {priceMode === "calculated" && components.length > 0 ? (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Prix de vente
              </p>
              <p className="truncate text-base font-semibold tabular-nums text-slate-900">
                {fmt(costing.unitSellHt)} € HT / {resolvedUnit}
              </p>
            </div>
          ) : null}
          <button
            type="submit"
            form="work-item-form"
            disabled={!canSubmit || busy}
            className={cn(
              "min-h-11 rounded-xl bg-[#1e3a5f] px-5 text-sm font-bold text-white transition disabled:opacity-50",
              priceMode === "calculated" && components.length > 0 ? "shrink-0" : "w-full",
            )}
          >
            {busy ? (isPersisted ? "Enregistrement…" : "Création…") : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function CostSummary({
  costing,
  unit,
  marginPercent,
  onMarginChange,
  sellMode,
  unitSellHt,
  onSellChange,
}: {
  costing: ReturnType<typeof calculateWorkItemCosting>;
  unit: string;
  marginPercent: string;
  onMarginChange: (v: string) => void;
  sellMode: "FIXED_SELL" | "MARGIN";
  unitSellHt: string;
  onSellChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4 border-t border-slate-100 pt-5">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Coût de revient
        </p>
        <p className="mt-1 text-lg font-medium tabular-nums tracking-tight text-slate-600">
          {fmt(costing.costPriceHt)} € / {unit}
        </p>
      </div>
      <div>
        <label className={labelClass} htmlFor="wi-margin">
          Marge
        </label>
        {sellMode === "FIXED_SELL" ? (
          <p className="text-sm tabular-nums text-slate-700">
            {fmt(costing.marquePercent)} %
          </p>
        ) : (
          <div className="relative max-w-[8.5rem]">
            <input
              id="wi-margin"
              value={marginPercent}
              onChange={(e) => onMarginChange(e.target.value)}
              inputMode="decimal"
              placeholder="25"
              aria-label="Marge"
              className={cn(inputClass, "pr-8 tabular-nums")}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
              %
            </span>
          </div>
        )}
      </div>
      {sellMode === "FIXED_SELL" ? (
        <div>
          <label className={labelClass} htmlFor="wi-sell-calc">
            Prix de vente
          </label>
          <input
            id="wi-sell-calc"
            value={unitSellHt}
            onChange={(e) => onSellChange(e.target.value)}
            inputMode="decimal"
            className={cn(inputClass, "max-w-[12rem] tabular-nums")}
          />
        </div>
      ) : null}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Prix de vente
        </p>
        <p className="mt-1 text-[1.75rem] font-semibold tabular-nums tracking-tight text-slate-900">
          {fmt(costing.unitSellHt)} € HT
          <span className="ml-1 text-base font-medium text-slate-400">/ {unit}</span>
        </p>
      </div>
    </div>
  );
}

function ComponentLine({
  row,
  onChange,
  onRemove,
}: {
  row: DraftComponent;
  onChange: (patch: Partial<DraftComponent>) => void;
  onRemove: () => void;
}) {
  const line = calculateComponentLineCost({
    quantityPerUnit: row.quantityPerUnit,
    unitCostHt: row.unitCostHt,
    lossPercent: row.lossPercent,
  });
  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{row.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
            <input
              aria-label={`Quantité ${row.name}`}
              value={row.qtyInput ?? String(row.quantityPerUnit).replace(".", ",")}
              onChange={(e) =>
                onChange({
                  qtyInput: e.target.value,
                  quantityPerUnit: parseNonNeg(e.target.value),
                })
              }
              inputMode="decimal"
              className="h-10 w-[4.25rem] rounded-lg border border-slate-200 bg-white px-2 text-sm tabular-nums outline-none focus:border-[#1e3a5f]/40 focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/25"
            />
            <input
              aria-label={`Unité ${row.name}`}
              value={row.unit}
              onChange={(e) => onChange({ unit: e.target.value })}
              className="h-10 w-12 rounded-lg border border-slate-200 bg-white px-1.5 text-center text-sm outline-none focus:border-[#1e3a5f]/40 focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/25"
            />
            <span className="px-0.5 text-slate-400">×</span>
            <div className="relative">
              <input
                aria-label={`Coût unitaire ${row.name}`}
                value={row.costInput ?? String(row.unitCostHt).replace(".", ",")}
                onChange={(e) =>
                  onChange({
                    costInput: e.target.value,
                    unitCostHt: parseNonNeg(e.target.value),
                  })
                }
                inputMode="decimal"
                className="h-10 w-[5.25rem] rounded-lg border border-slate-200 bg-white px-2 pr-5 text-sm tabular-nums outline-none focus:border-[#1e3a5f]/40 focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/25"
              />
              <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-xs text-slate-400">
                €
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
          <p className="text-sm font-semibold tabular-nums text-slate-900">
            {fmt(line)} €
          </p>
          <button
            type="button"
            onClick={onRemove}
            className="min-h-8 text-xs font-medium text-slate-400 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/35"
          >
            Retirer
          </button>
        </div>
      </div>
    </li>
  );
}

function FamilyField({
  value,
  onChange,
  families,
}: {
  value: string;
  onChange: (v: string) => void;
  families: string[];
}) {
  const listId = "wi-family-list";
  const options = useMemo(() => {
    const set = new Set(families.map((f) => f.trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [families]);

  return (
    <div>
      <label className={labelClass} htmlFor="wi-family">
        Famille
      </label>
      <input
        id="wi-family"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Maçonnerie, peinture…"
        className={inputClass}
        autoComplete="off"
      />
      <datalist id={listId}>
        {options.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>
    </div>
  );
}

function ResourcePicker({
  onAdd,
  onClose,
}: {
  onAdd: (c: Omit<DraftComponent, "localId">) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<ComponentType>("MATERIAL");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<
    Array<{ id: string; name: string; unit: string; cost: number; meta?: string }>
  >([]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 220);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const kind =
          tab === "MATERIAL"
            ? "materials"
            : tab === "LABOR"
              ? "labor"
              : tab === "EQUIPMENT"
                ? "equipment"
                : "subcontract";
        const url = new URL("/api/commercial/library/resources", window.location.origin);
        url.searchParams.set("kind", kind);
        if (debouncedQ) url.searchParams.set("q", debouncedQ);
        const res = await fetch(url.pathname + url.search);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        if (cancelled) return;
        const qq = debouncedQ.toLowerCase();
        if (tab === "MATERIAL") {
          setResults(
            ((data.materials as Array<{
              id: string;
              name: string;
              unit: string;
              currentPriceHt: number;
              family?: string | null;
            }>) ?? []).map((m) => ({
              id: m.id,
              name: m.name,
              unit: m.unit,
              cost: m.currentPriceHt,
              meta: m.family ?? undefined,
            })),
          );
        } else if (tab === "LABOR") {
          setResults(
            ((data.labor as Array<{
              id: string;
              name: string;
              hourlyCostHt: number;
              loadedCostHt: number | null;
              trade?: string | null;
            }>) ?? [])
              .filter((l) => !qq || l.name.toLowerCase().includes(qq) || (l.trade ?? "").toLowerCase().includes(qq))
              .map((l) => ({
                id: l.id,
                name: l.name,
                unit: "h",
                cost: l.loadedCostHt ?? l.hourlyCostHt,
                meta: l.trade ?? undefined,
              })),
          );
        } else if (tab === "EQUIPMENT") {
          setResults(
            ((data.equipment as Array<{
              id: string;
              name: string;
              unit: string;
              hourlyCostHt: number | null;
              dailyCostHt: number | null;
              category?: string | null;
            }>) ?? [])
              .filter((e) => !qq || e.name.toLowerCase().includes(qq))
              .map((e) => ({
                id: e.id,
                name: e.name,
                unit: e.unit || "h",
                cost:
                  e.unit === "j" && e.dailyCostHt != null
                    ? e.dailyCostHt
                    : (e.hourlyCostHt ?? e.dailyCostHt ?? 0),
                meta: e.category ?? undefined,
              })),
          );
        } else {
          setResults(
            ((data.subcontractors as Array<{
              id: string;
              name: string;
              tradeName: string | null;
            }>) ?? []).map((s) => ({
              id: s.id,
              name: s.tradeName || s.name,
              unit: "forfait",
              cost: 0,
            })),
          );
        }
      } catch (e) {
        if (!cancelled) {
          setError(humanError(e));
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [tab, debouncedQ]);

  function pick(r: { id: string; name: string; unit: string; cost: number }) {
    onAdd({
      name: r.name,
      type: tab,
      quantityPerUnit: 1,
      unit: r.unit,
      unitCostHt: r.cost,
      lossPercent: 0,
      qtyInput: "1",
      costInput: String(r.cost).replace(".", ","),
      materialId: tab === "MATERIAL" ? r.id : null,
      laborId: tab === "LABOR" ? r.id : null,
      equipmentId: tab === "EQUIPMENT" ? r.id : null,
      subcontractorExternalOrgId: tab === "SUBCONTRACT" ? r.id : null,
    });
  }

  function addManual() {
    const label = q.trim() || "Nouvel élément";
    onAdd({
      name: label,
      type: tab,
      quantityPerUnit: 1,
      unit: tab === "LABOR" ? "h" : tab === "SUBCONTRACT" ? "forfait" : "U",
      unitCostHt: 0,
      lossPercent: 0,
      qtyInput: "1",
      costInput: "0",
    });
  }

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Rechercher
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          Fermer
        </button>
      </div>
      <div role="tablist" aria-label="Type d’élément" className="mb-2 flex flex-wrap gap-1">
        {PICKER_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-8 rounded-full px-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/35",
              tab === t.id
                ? "bg-[#1e3a5f] text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (results[0]) pick(results[0]);
          }
        }}
        placeholder="Rechercher…"
        className={inputClass}
        aria-label="Rechercher un élément"
      />
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      <div className="mt-2 max-h-48 overflow-y-auto">
        {loading ? (
          <p className="px-1 py-3 text-sm text-slate-500">Recherche…</p>
        ) : results.length === 0 ? (
          <p className="px-1 py-3 text-sm text-slate-500">Aucun résultat.</p>
        ) : (
          <ul>
            {results.slice(0, 40).map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => pick(r)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/35"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {r.name}
                    </span>
                    {r.meta ? (
                      <span className="text-[11px] text-slate-400">{r.meta}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-slate-500">
                    {fmt(r.cost)} € / {r.unit}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={addManual}
        className="mt-2 text-xs font-semibold text-[#1e3a5f] hover:underline"
      >
        Ajouter une ligne libre
        {q.trim() ? ` « ${q.trim()} »` : ""}
      </button>
    </div>
  );
}
