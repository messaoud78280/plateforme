"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MaterialRequirementRow } from "@/lib/materiaux/load-for-project";
import { formatQty } from "@/lib/materiaux/progress";
import { withReturnTo } from "@/lib/navigation/safe-return-to";

function formatDay(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function ProjectMateriauxSection({
  projectId,
  projectTitle,
  initialRows,
  canWrite,
}: {
  projectId: string;
  projectTitle: string;
  initialRows: MaterialRequirementRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [similar, setSimilar] = useState<Array<{ id: string; label: string }> | null>(null);

  const [label, setLabel] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("U");
  const [neededAt, setNeededAt] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [lossFactor, setLossFactor] = useState("");

  const activeRows = useMemo(
    () => rows.filter((r) => r.status !== "CANCELLED"),
    [rows],
  );
  const detail = rows.find((r) => r.id === detailId) ?? null;

  async function reload() {
    const res = await fetch(`/api/projets/${projectId}/materiaux`);
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.rows)) setRows(data.rows);
    router.refresh();
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function prepareOrder() {
    const ids = [...selected].filter((id) => {
      const r = rows.find((x) => x.id === id);
      return r && r.progress.remainingToOrder > 0 && r.status !== "CANCELLED";
    });
    if (ids.length === 0) return;
    const returnTo = `/dashboard/projets/${projectId}#tab-materiaux`;
    const href = withReturnTo(
      `/dashboard/commandes/nouvelle?projectId=${encodeURIComponent(projectId)}&req=${ids.join(",")}`,
      returnTo,
    );
    router.push(href);
  }

  async function submitAdd(force = false) {
    setError(null);
    setBusy(true);
    setSimilar(null);
    try {
      const res = await fetch(`/api/projets/${projectId}/materiaux`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          quantityRequired: Number(qty),
          unit,
          neededAt: neededAt || null,
          lossFactor: lossFactor === "" ? null : Number(lossFactor),
          force,
        }),
      });
      const data = await res.json();
      if (res.status === 409 && Array.isArray(data.similar)) {
        setSimilar(data.similar.map((s: { id: string; label: string }) => s));
        return;
      }
      if (!res.ok) throw new Error(data.error || "Erreur");
      setAddOpen(false);
      setLabel("");
      setQty("");
      setUnit("U");
      setNeededAt("");
      setLossFactor("");
      setShowOptions(false);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function cancelRequirement(id: string) {
    if (!confirm("Annuler ce besoin matériau ?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/projets/${projectId}/materiaux/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancel: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setDetailId(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
            Matériaux
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">{projectTitle}</p>
        </div>
        {canWrite ? (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white hover:bg-[#152a45]"
          >
            + Ajouter un besoin
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {activeRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center">
          <p className="text-sm text-slate-600">Aucun besoin matériau renseigné.</p>
          {canWrite ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="mt-3 text-sm font-semibold text-[#1d4ed8]"
            >
              + Ajouter un besoin
            </button>
          ) : null}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  {canWrite ? <th className="w-10 px-3 py-2" /> : null}
                  <th className="px-3 py-2">Matériau</th>
                  <th className="px-3 py-2">Besoin</th>
                  <th className="px-3 py-2">Commandé</th>
                  <th className="px-3 py-2">Reçu</th>
                  <th className="px-3 py-2">Reste</th>
                  <th className="px-3 py-2">Besoin pour</th>
                  <th className="px-3 py-2">État</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    {canWrite ? (
                      <td className="px-3 py-2.5">
                        {r.progress.remainingToOrder > 0 ? (
                          <input
                            type="checkbox"
                            checked={selected.has(r.id)}
                            onChange={() => toggle(r.id)}
                            aria-label={`Sélectionner ${r.label}`}
                          />
                        ) : null}
                      </td>
                    ) : null}
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setDetailId(r.id)}
                        className="font-semibold text-slate-900 hover:underline"
                      >
                        {r.label}
                      </button>
                      {r.overOrdered ? (
                        <p className="text-[11px] text-amber-700">
                          {formatQty(r.progress.ordered)} commandés pour{" "}
                          {formatQty(r.progress.need)} nécessaires
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-700">
                      {formatQty(r.progress.need)} {r.unit}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">{formatQty(r.progress.ordered)}</td>
                    <td className="px-3 py-2.5 tabular-nums">{formatQty(r.progress.received)}</td>
                    <td className="px-3 py-2.5 text-slate-800">{r.progress.resteLabel}</td>
                    <td className="px-3 py-2.5 text-slate-600">{formatDay(r.neededAt)}</td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {r.coverageLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-2 md:hidden">
            {activeRows.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex items-start gap-2">
                  {canWrite && r.progress.remainingToOrder > 0 ? (
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                    />
                  ) : null}
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setDetailId(r.id)}
                  >
                    <p className="font-semibold text-slate-900">{r.label}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Besoin {formatQty(r.progress.need)} {r.unit}
                    </p>
                    <p className="text-xs text-slate-600">
                      Commandé {formatQty(r.progress.ordered)} · Reçu{" "}
                      {formatQty(r.progress.received)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#1e3a5f]">
                      {r.progress.resteLabel}
                    </p>
                    {r.neededAt && r.progress.remainingToOrder > 0 ? (
                      <p className="mt-1 text-[11px] text-amber-800">
                        À commander avant le {formatDay(r.neededAt)}
                      </p>
                    ) : null}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {canWrite && selected.size > 0 ? (
            <div className="sticky bottom-3 z-10 flex justify-end">
              <button
                type="button"
                onClick={prepareOrder}
                className="rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#152a45]"
              >
                Préparer une commande ({selected.size})
              </button>
            </div>
          ) : null}
        </>
      )}

      {addOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Ajouter un besoin</h3>
            <div className="mt-4 space-y-3">
              <label className="block space-y-1 text-sm">
                <span className="text-xs font-bold uppercase text-slate-500">Matériau *</span>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex. EPDM"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-bold uppercase text-slate-500">Quantité *</span>
                  <input
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    inputMode="decimal"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-bold uppercase text-slate-500">Unité *</span>
                  <input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
              </div>
              <label className="block space-y-1 text-sm">
                <span className="text-xs font-bold uppercase text-slate-500">Besoin pour</span>
                <input
                  type="date"
                  value={neededAt}
                  onChange={(e) => setNeededAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <button
                type="button"
                onClick={() => setShowOptions((v) => !v)}
                className="text-xs font-semibold text-slate-500"
              >
                {showOptions ? "Masquer options" : "Options"}
              </button>
              {showOptions ? (
                <label className="block space-y-1 text-sm">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    Marge (loss factor)
                  </span>
                  <input
                    value={lossFactor}
                    onChange={(e) => setLossFactor(e.target.value)}
                    placeholder="Ex. 0.05 pour 5 % — laisser vide si aucune"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                  <span className="text-[11px] text-slate-400">
                    Jamais inventée : vide = aucune marge.
                  </span>
                </label>
              ) : null}
              {similar ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                  <p className="font-semibold">Un besoin similaire existe déjà.</p>
                  <ul className="mt-1 text-xs">
                    {similar.map((s) => (
                      <li key={s.id}>{s.label}</li>
                    ))}
                  </ul>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailId(similar[0]?.id ?? null)}
                      className="text-xs font-semibold text-[#1d4ed8]"
                    >
                      Voir
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void submitAdd(true)}
                      className="text-xs font-semibold text-slate-800"
                    >
                      Ajouter quand même
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setAddOpen(false);
                  setSimilar(null);
                }}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={busy || !label.trim() || !qty}
                onClick={() => void submitAdd(false)}
                className="flex-1 rounded-lg bg-[#1e3a5f] py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? "…" : "Ajouter le besoin"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {detail ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-3 sm:items-center">
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">{detail.label}</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[10px] font-bold uppercase text-slate-400">Besoin</dt>
                <dd className="font-semibold">
                  {formatQty(detail.progress.need)} {detail.unit}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-slate-400">Commandé</dt>
                <dd className="font-semibold">{formatQty(detail.progress.ordered)}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-slate-400">Reçu</dt>
                <dd className="font-semibold">{formatQty(detail.progress.received)}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-slate-400">
                  Reste à recevoir
                </dt>
                <dd className="font-semibold">
                  {formatQty(detail.progress.remainingToReceive)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-slate-400">
                  Reste à commander
                </dt>
                <dd className="font-semibold">
                  {formatQty(detail.progress.remainingToOrder)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-slate-400">Besoin pour</dt>
                <dd className="font-semibold">{formatDay(detail.neededAt)}</dd>
              </div>
            </dl>
            {detail.lossFactor != null ? (
              <p className="mt-3 text-xs text-slate-600">
                Marge saisie : {(detail.lossFactor * 100).toFixed(1)} %
              </p>
            ) : null}
            {detail.progress.unitMismatch ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                Unité différente — correspondance à confirmer. Pas de conversion automatique.
              </p>
            ) : null}
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Source</p>
              <p className="text-sm text-slate-800">
                {detail.sourceLabel || "Saisie manuelle"}
                {" · "}
                {detail.createdByName}
                {" · "}
                {formatDay(detail.createdAt)}
              </p>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Commandes liées
              </p>
              {detail.linkedOrders.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">Aucune</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {detail.linkedOrders.map((o) => (
                    <li key={o.lineId}>
                      <Link
                        href={`/dashboard/commandes/${o.orderId}`}
                        className="text-sm font-semibold text-[#1d4ed8] hover:underline"
                      >
                        {o.orderNumber} · {o.supplierName}
                      </Link>
                      <span className="text-xs text-slate-500">
                        {" "}
                        {formatQty(o.allocated)} / {formatQty(detail.progress.need)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDetailId(null)}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold"
              >
                Fermer
              </button>
              {canWrite && detail.status !== "CANCELLED" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void cancelRequirement(detail.id)}
                  className="rounded-lg border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-700"
                >
                  Annuler le besoin
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
