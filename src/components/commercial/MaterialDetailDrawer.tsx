"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { roundMoney } from "@/lib/commercial/money";
import { cn } from "@/lib/cn";

function fmt(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type SupplierQuote = {
  key: string;
  supplierExternalOrgId: string | null;
  supplierName: string;
  priceHt: number;
  priceId: string;
  notedAt: string | Date;
  source: string | null;
  supplierReference: string | null;
};

type WorkItemImpactRow = {
  id: string;
  name: string;
  unitCostHt: number;
  marginPercent: number;
  saleUnit: string;
};

type MaterialDetail = {
  id: string;
  name: string;
  family: string | null;
  unit: string;
  currentPriceHt: number;
  preferredSupplierExternalOrgId: string | null;
  preferredSupplierName: string | null;
  referencePriceUpdatedAt: string | Date | null;
  referenceSourceLabel: string | null;
  evolution3mPercent: number | null;
  supplierQuotes: SupplierQuote[];
  prices: Array<{
    id: string;
    priceHt: number;
    supplierName: string | null;
    notedAt: string | Date;
    source: string | null;
    supplier?: { tradeName: string | null; name: string } | null;
  }>;
  usedByWorkItemCount: number;
  usedByWorkItems: WorkItemImpactRow[];
  needsPriceReview: boolean;
};

type ImpactPreview = {
  oldPriceHt: number;
  newPriceHt: number;
  diffPercent: number | null;
  workItemCount: number;
  marginsDropOver2Points: number;
  belowLowMarginCount: number;
  lowMarginThreshold: number;
};

type SupplierOpt = {
  id: string;
  name: string;
  tradeName: string | null;
  city: string | null;
};

export function MaterialDetailDrawer({
  materialId,
  open,
  onClose,
  onChanged,
}: {
  materialId: string | null;
  open: boolean;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [section, setSection] = useState<
    "none" | "suppliers" | "history" | "works" | "addPrice"
  >("none");
  const [busy, setBusy] = useState(false);

  // add price form
  const [supplierQ, setSupplierQ] = useState("");
  const [supplierOpts, setSupplierOpts] = useState<SupplierOpt[]>([]);
  const [pickedSupplier, setPickedSupplier] = useState<SupplierOpt | null>(null);
  const [priceHt, setPriceHt] = useState("");
  const [supplierRef, setSupplierRef] = useState("");
  const [pendingApply, setPendingApply] = useState<{
    priceHt: number;
    fromPriceId?: string;
    supplierName?: string;
    supplierExternalOrgId?: string | null;
    diffPercent: number | null;
  } | null>(null);
  const [impact, setImpact] = useState<ImpactPreview | null>(null);

  const load = useCallback(async () => {
    if (!materialId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/library/materials/${materialId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setMaterial(data.material);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setMaterial(null);
    } finally {
      setLoading(false);
    }
  }, [materialId]);

  useEffect(() => {
    if (open && materialId) {
      setSection("none");
      setPendingApply(null);
      setImpact(null);
      void load();
    }
  }, [open, materialId, load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (section !== "addPrice") return;
    const q = supplierQ.trim();
    const t = setTimeout(() => {
      void (async () => {
        try {
          const url = q
            ? `/api/commercial/library/suppliers?q=${encodeURIComponent(q)}`
            : "/api/commercial/library/suppliers";
          const res = await fetch(url);
          const data = await res.json();
          if (!res.ok) return;
          setSupplierOpts((data.suppliers ?? []).slice(0, 8));
        } catch {
          /* ignore */
        }
      })();
    }, 200);
    return () => clearTimeout(t);
  }, [supplierQ, section]);

  async function saveSupplierPrice() {
    if (!materialId || !pickedSupplier || !priceHt.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/library/materials/${materialId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceHt: Number(priceHt),
          supplierExternalOrgId: pickedSupplier.id,
          supplierReference: supplierRef.trim() || null,
          source: "MANUAL",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setToast("Prix fournisseur enregistré");
      setSection("suppliers");
      setPriceHt("");
      setSupplierRef("");
      setPickedSupplier(null);
      setSupplierQ("");
      await load();
      if (data.suggestApply) {
        setPendingApply({
          priceHt: Number(data.price.priceHt),
          fromPriceId: data.price.id,
          supplierName:
            pickedSupplier.tradeName || pickedSupplier.name,
          supplierExternalOrgId: pickedSupplier.id,
          diffPercent: data.diffPercent,
        });
      }
      onChanged?.();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function setPreferred(supplierExternalOrgId: string) {
    if (!materialId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/commercial/library/materials/${materialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setPreferredSupplier",
          supplierExternalOrgId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setMaterial(data.material);
      setToast("Fournisseur préféré enregistré");
      onChanged?.();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function prepareApply(opts: {
    priceHt: number;
    fromPriceId?: string;
    supplierName?: string;
    supplierExternalOrgId?: string | null;
  }) {
    if (!materialId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/commercial/library/materials/${materialId}?previewPrice=${encodeURIComponent(String(opts.priceHt))}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setImpact(data.impact);
      setPendingApply({
        ...opts,
        diffPercent: data.impact.diffPercent,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function confirmApply() {
    if (!materialId || !pendingApply) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/library/materials/${materialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "applyReferencePrice",
          priceHt: pendingApply.priceHt,
          fromPriceId: pendingApply.fromPriceId ?? null,
          supplierExternalOrgId: pendingApply.supplierExternalOrgId ?? null,
          supplierName: pendingApply.supplierName ?? null,
          source: "MANUAL",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setMaterial(data.material);
      setPendingApply(null);
      setImpact(null);
      setToast(
        data.unchanged
          ? "Prix déjà à jour"
          : `Prix retenu mis à jour · ${data.refresh?.workItemIds?.length ?? 0} ouvrage(s)`,
      );
      onChanged?.();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function archiveMaterial() {
    if (!materialId || !material) return;
    if (!confirm(`Archiver « ${material.name} » ?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/commercial/library/materials/${materialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false, refreshWorkItems: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setToast("Matériau archivé");
      onChanged?.();
      onClose();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={material?.name ?? "Matériau"}
      description={
        material
          ? [material.family, material.unit].filter(Boolean).join(" · ")
          : undefined
      }
      widthClass="max-w-lg"
    >
      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : error && !material ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : material ? (
        <div className="space-y-5">
          {toast ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {toast}
            </p>
          ) : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Prix retenu (chiffrage)
              </p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums text-[#1e3a5f]">
                {fmt(material.currentPriceHt)} €/{material.unit}
              </p>
              {material.referenceSourceLabel ? (
                <p className="mt-1 text-xs text-slate-500">
                  Source : {material.referenceSourceLabel}
                </p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Fournisseur préféré
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-800">
                  {material.preferredSupplierName
                    ? `⭐ ${material.preferredSupplierName}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Dernière maj
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {material.referencePriceUpdatedAt
                    ? new Date(material.referencePriceUpdatedAt).toLocaleDateString(
                        "fr-FR",
                      )
                    : "—"}
                </p>
              </div>
            </div>
            {material.evolution3mPercent != null ? (
              <p className="text-sm text-slate-600">
                Évolution{" "}
                <strong
                  className={
                    material.evolution3mPercent > 0
                      ? "text-amber-700"
                      : "text-emerald-700"
                  }
                >
                  {material.evolution3mPercent > 0 ? "+" : ""}
                  {fmt(material.evolution3mPercent)} %
                </strong>{" "}
                sur 3 mois
              </p>
            ) : null}
          </div>

          {pendingApply && impact ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-950">
                Mettre à jour ce prix ?
              </p>
              <p className="text-sm tabular-nums text-amber-900">
                {fmt(impact.oldPriceHt)} € → {fmt(impact.newPriceHt)} €
                {impact.diffPercent != null ? (
                  <span className="ml-2 font-semibold">
                    ({impact.diffPercent > 0 ? "+" : ""}
                    {fmt(impact.diffPercent)} %)
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-amber-900/80">
                Utilisé dans <strong>{impact.workItemCount}</strong> ouvrage(s).
                {impact.marginsDropOver2Points > 0
                  ? ` ${impact.marginsDropOver2Points} marge(s) baissent de plus de 2 pts.`
                  : ""}
                {impact.belowLowMarginCount > 0
                  ? ` ${impact.belowLowMarginCount} sous le seuil ${impact.lowMarginThreshold} %.`
                  : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void confirmApply()}
                  className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  Mettre à jour
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPendingApply(null);
                    setImpact(null);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : pendingApply && !impact ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-900">
                Nouveau prix enregistré
              </p>
              <p className="text-sm tabular-nums">
                Ancien prix utilisé : <strong>{fmt(material.currentPriceHt)} €</strong>
                <br />
                Nouveau : <strong>{fmt(pendingApply.priceHt)} €</strong>
                {pendingApply.diffPercent != null ? (
                  <span className="text-amber-700">
                    {" "}
                    ({pendingApply.diffPercent > 0 ? "+" : ""}
                    {fmt(pendingApply.diffPercent)} %)
                  </span>
                ) : null}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void prepareApply({
                      priceHt: pendingApply.priceHt,
                      fromPriceId: pendingApply.fromPriceId,
                      supplierName: pendingApply.supplierName,
                      supplierExternalOrgId: pendingApply.supplierExternalOrgId,
                    })
                  }
                  className="rounded-xl bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
                >
                  Utiliser ce prix
                </button>
                <button
                  type="button"
                  onClick={() => setPendingApply(null)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
                >
                  Conserver {fmt(material.currentPriceHt)} €
                </button>
              </div>
            </div>
          ) : null}

          <SectionToggle
            open={section === "suppliers"}
            label="Prix fournisseurs"
            onClick={() =>
              setSection((s) => (s === "suppliers" ? "none" : "suppliers"))
            }
          >
            <ul className="space-y-2">
              {material.supplierQuotes.length === 0 ? (
                <p className="text-xs text-slate-500">Aucun prix fournisseur.</p>
              ) : (
                material.supplierQuotes.map((q) => {
                  const isPref =
                    q.supplierExternalOrgId &&
                    q.supplierExternalOrgId ===
                      material.preferredSupplierExternalOrgId;
                  const isRef =
                    roundMoney(q.priceHt, 4) ===
                    roundMoney(material.currentPriceHt, 4);
                  return (
                    <li
                      key={q.key}
                      className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {q.supplierName}
                            {isPref ? " ⭐" : ""}
                            {isRef ? (
                              <span className="ml-2 text-[10px] font-bold uppercase text-[#1e3a5f]">
                                Retenu
                              </span>
                            ) : null}
                          </p>
                          <p className="tabular-nums text-sm font-medium text-slate-800">
                            {fmt(q.priceHt)} €/{material.unit}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(q.notedAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {!isRef ? (
                            <button
                              type="button"
                              disabled={busy}
                              className="text-[11px] font-semibold text-[#1d4ed8]"
                              onClick={() =>
                                void prepareApply({
                                  priceHt: q.priceHt,
                                  fromPriceId: q.priceId,
                                  supplierName: q.supplierName,
                                  supplierExternalOrgId: q.supplierExternalOrgId,
                                })
                              }
                            >
                              Utiliser
                            </button>
                          ) : null}
                          {q.supplierExternalOrgId && !isPref ? (
                            <button
                              type="button"
                              disabled={busy}
                              className="text-[11px] font-semibold text-slate-500"
                              onClick={() =>
                                void setPreferred(q.supplierExternalOrgId!)
                              }
                            >
                              Préférer
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
            <button
              type="button"
              className="mt-3 text-xs font-semibold text-[#1d4ed8]"
              onClick={() => setSection("addPrice")}
            >
              + Ajouter un prix
            </button>
          </SectionToggle>

          {section === "addPrice" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-900">Nouveau prix</p>
              <label className="block text-xs font-semibold text-slate-500">
                Fournisseur
                <input
                  value={
                    pickedSupplier
                      ? pickedSupplier.tradeName || pickedSupplier.name
                      : supplierQ
                  }
                  onChange={(e) => {
                    setPickedSupplier(null);
                    setSupplierQ(e.target.value);
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Point.P…"
                />
              </label>
              {!pickedSupplier && supplierOpts.length > 0 ? (
                <ul className="max-h-36 overflow-auto rounded-xl border border-slate-100">
                  {supplierOpts.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                        onClick={() => {
                          setPickedSupplier(s);
                          setSupplierQ("");
                        }}
                      >
                        {s.tradeName || s.name}
                        {s.city ? (
                          <span className="text-slate-400"> · {s.city}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="text-[11px] text-slate-400">
                Absent ?{" "}
                <Link
                  href="/dashboard/fournisseurs"
                  className="font-semibold text-[#1d4ed8]"
                >
                  + Créer un fournisseur
                </Link>
              </p>
              <label className="block text-xs font-semibold text-slate-500">
                Prix HT (€ / {material.unit})
                <input
                  value={priceHt}
                  onChange={(e) => setPriceHt(e.target.value)}
                  inputMode="decimal"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-500">
                Réf. fournisseur (facultatif)
                <input
                  value={supplierRef}
                  onChange={(e) => setSupplierRef(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy || !pickedSupplier || !priceHt.trim()}
                  onClick={() => void saveSupplierPrice()}
                  className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setSection("suppliers")}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : null}

          <SectionToggle
            open={section === "history"}
            label="Historique"
            onClick={() =>
              setSection((s) => (s === "history" ? "none" : "history"))
            }
          >
            <ul className="space-y-2">
              {material.prices.map((p) => (
                <li
                  key={p.id}
                  className="flex items-baseline justify-between gap-2 text-sm"
                >
                  <span className="text-slate-500">
                    {new Date(p.notedAt).toLocaleDateString("fr-FR")}
                  </span>
                  <span className="tabular-nums font-semibold">
                    {fmt(p.priceHt)} €
                  </span>
                  <span className="truncate text-xs text-slate-500">
                    {p.supplier?.tradeName ||
                      p.supplier?.name ||
                      p.supplierName ||
                      "—"}
                  </span>
                </li>
              ))}
            </ul>
          </SectionToggle>

          <SectionToggle
            open={section === "works"}
            label={`Ouvrages utilisant ce matériau (${material.usedByWorkItemCount})`}
            onClick={() =>
              setSection((s) => (s === "works" ? "none" : "works"))
            }
          >
            {material.usedByWorkItems.length === 0 ? (
              <p className="text-xs text-slate-500">Aucun ouvrage lié.</p>
            ) : (
              <ul className="space-y-2">
                {material.usedByWorkItems.map((w) => (
                  <li
                    key={w.id}
                    className="rounded-xl border border-slate-100 px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-slate-900">{w.name}</p>
                    <p className="text-xs text-slate-500">
                      Coût {fmt(w.unitCostHt)} €/{w.saleUnit} · Marge{" "}
                      <span
                        className={cn(
                          w.marginPercent > 0 && w.marginPercent < 15
                            ? "font-semibold text-amber-700"
                            : "text-slate-700",
                        )}
                      >
                        {fmt(w.marginPercent)} %
                        {w.marginPercent > 0 && w.marginPercent < 15
                          ? " ⚠"
                          : ""}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionToggle>

          <button
            type="button"
            disabled={busy}
            onClick={() => void archiveMaterial()}
            className="text-xs font-semibold text-red-600 hover:underline"
          >
            Archiver le matériau
          </button>
        </div>
      ) : null}
    </Drawer>
  );
}

function SectionToggle({
  open,
  label,
  onClick,
  children,
}: {
  open: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-slate-100 pt-3">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-800"
      >
        {label}
        <span className="text-slate-400">{open ? "▾" : "›"}</span>
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
