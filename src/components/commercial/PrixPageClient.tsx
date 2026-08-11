"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { roundMoney } from "@/lib/commercial/money";
import { cn } from "@/lib/cn";

type Material = {
  id: string;
  name: string;
  unit: string;
  currentPriceHt: number;
  prices: Array<{ priceHt: number }>;
  _count: { components: number };
};

type Labor = {
  id: string;
  name: string;
  trade: string | null;
  hourlyCostHt: number;
  loadedCostHt: number | null;
};

type Equipment = {
  id: string;
  name: string;
  hourlyCostHt: number | null;
  dailyCostHt: number | null;
  unit: string;
};

type Tab = "materials" | "labor" | "equipment";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none";

function fmt(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function PrixPageClient({
  materials,
  labor,
  equipment,
}: {
  materials: Material[];
  labor: Labor[];
  equipment: Equipment[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("materials");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matForm, setMatForm] = useState({ name: "", unit: "U", price: "" });
  const [laborForm, setLaborForm] = useState({ name: "", trade: "", hourlyCostHt: "" });
  const [eqForm, setEqForm] = useState({ name: "", hourlyCostHt: "", dailyCostHt: "" });
  const [inlinePrice, setInlinePrice] = useState<Record<string, string>>({});

  async function createMaterial() {
    if (!matForm.name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/library/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "material",
          name: matForm.name.trim(),
          unit: matForm.unit.trim() || "U",
          currentPriceHt: Number(matForm.price) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setMatForm({ name: "", unit: "U", price: "" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function createLabor() {
    if (!laborForm.name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/library/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "labor",
          name: laborForm.name.trim(),
          trade: laborForm.trade.trim() || null,
          hourlyCostHt: Number(laborForm.hourlyCostHt) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setLaborForm({ name: "", trade: "", hourlyCostHt: "" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function createEquipment() {
    if (!eqForm.name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/library/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "equipment",
          name: eqForm.name.trim(),
          hourlyCostHt: eqForm.hourlyCostHt ? Number(eqForm.hourlyCostHt) : null,
          dailyCostHt: eqForm.dailyCostHt ? Number(eqForm.dailyCostHt) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setEqForm({ name: "", hourlyCostHt: "", dailyCostHt: "" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function updateMaterialPrice(id: string) {
    const raw = inlinePrice[id];
    if (raw == null || raw === "") return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/library/materials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPriceHt: Number(raw) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setInlinePrice((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "materials", label: "Matériaux" },
    { id: "labor", label: "Main-d'œuvre" },
    { id: "equipment", label: "Matériel" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm",
              tab === t.id
                ? "bg-[#1e3a5f] text-white"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      ) : null}

      {tab === "materials" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-bold text-[#1e3a5f]">Nouveau matériau</h2>
            <div className="grid gap-2 sm:grid-cols-4">
              <input
                className={inputClass}
                placeholder="Nom"
                value={matForm.name}
                onChange={(e) => setMatForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Unité"
                value={matForm.unit}
                onChange={(e) => setMatForm((f) => ({ ...f, unit: e.target.value }))}
              />
              <input
                type="number"
                step="0.01"
                className={inputClass}
                placeholder="Prix HT"
                value={matForm.price}
                onChange={(e) => setMatForm((f) => ({ ...f, price: e.target.value }))}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void createMaterial()}
                className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white"
              >
                Créer
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {materials.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">Aucun matériau.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Nom</th>
                    <th className="px-4 py-2">Unité</th>
                    <th className="px-4 py-2">Prix actuel</th>
                    <th className="px-4 py-2">Précédent</th>
                    <th className="px-4 py-2">Utilisé par</th>
                    <th className="px-4 py-2">Maj. rapide</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials.map((m) => {
                    const previous =
                      m.prices.length > 1 ? m.prices[1].priceHt : null;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/dashboard/devis-facturation/prix/materiaux/${m.id}`}
                            className="font-semibold text-[#1e3a5f] hover:underline"
                          >
                            {m.name}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{m.unit}</td>
                        <td className="px-4 py-2.5 tabular-nums font-semibold">
                          {fmt(m.currentPriceHt)} €
                        </td>
                        <td className="px-4 py-2.5 tabular-nums text-slate-500">
                          {previous != null ? `${fmt(previous)} €` : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {m._count.components} ouvr.
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1">
                            <input
                              type="number"
                              step="0.01"
                              className="w-24 rounded border border-slate-200 px-2 py-1 text-xs"
                              placeholder="Nouveau"
                              value={inlinePrice[m.id] ?? ""}
                              onChange={(e) =>
                                setInlinePrice((p) => ({ ...p, [m.id]: e.target.value }))
                              }
                            />
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void updateMaterialPrice(m.id)}
                              className="rounded bg-[#1e3a5f] px-2 py-1 text-[10px] font-bold text-white"
                            >
                              OK
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}

      {tab === "labor" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-1 text-sm font-bold text-[#1e3a5f]">Nouvelle main-d&apos;œuvre</h2>
            <p className="mb-2 text-[11px] text-slate-500">
              Coût horaire = coût chargé si renseigné, sinon coût interne
            </p>
            <div className="grid gap-2 sm:grid-cols-4">
              <input
                className={inputClass}
                placeholder="Nom"
                value={laborForm.name}
                onChange={(e) => setLaborForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Métier"
                value={laborForm.trade}
                onChange={(e) => setLaborForm((f) => ({ ...f, trade: e.target.value }))}
              />
              <input
                type="number"
                step="0.01"
                className={inputClass}
                placeholder="Coût horaire HT"
                value={laborForm.hourlyCostHt}
                onChange={(e) =>
                  setLaborForm((f) => ({ ...f, hourlyCostHt: e.target.value }))
                }
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void createLabor()}
                className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white"
              >
                Créer
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {labor.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">Aucune ressource.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Nom</th>
                    <th className="px-4 py-2">Métier</th>
                    <th className="px-4 py-2">Coût horaire</th>
                    <th className="px-4 py-2">Chargé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {labor.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-2.5 font-semibold">{l.name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{l.trade || "—"}</td>
                      <td className="px-4 py-2.5 tabular-nums">{fmt(l.hourlyCostHt)} €/h</td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-500">
                        {l.loadedCostHt != null ? `${fmt(l.loadedCostHt)} €/h` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}

      {tab === "equipment" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-bold text-[#1e3a5f]">Nouveau matériel</h2>
            <div className="grid gap-2 sm:grid-cols-4">
              <input
                className={inputClass}
                placeholder="Nom"
                value={eqForm.name}
                onChange={(e) => setEqForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                type="number"
                step="0.01"
                className={inputClass}
                placeholder="Coût horaire"
                value={eqForm.hourlyCostHt}
                onChange={(e) => setEqForm((f) => ({ ...f, hourlyCostHt: e.target.value }))}
              />
              <input
                type="number"
                step="0.01"
                className={inputClass}
                placeholder="Coût journalier"
                value={eqForm.dailyCostHt}
                onChange={(e) => setEqForm((f) => ({ ...f, dailyCostHt: e.target.value }))}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void createEquipment()}
                className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white"
              >
                Créer
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {equipment.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">Aucun matériel.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Nom</th>
                    <th className="px-4 py-2">Horaire</th>
                    <th className="px-4 py-2">Journalier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {equipment.map((e) => (
                    <tr key={e.id}>
                      <td className="px-4 py-2.5 font-semibold">{e.name}</td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {e.hourlyCostHt != null ? `${fmt(e.hourlyCostHt)} €/h` : "—"}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {e.dailyCostHt != null ? `${fmt(e.dailyCostHt)} €/j` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
