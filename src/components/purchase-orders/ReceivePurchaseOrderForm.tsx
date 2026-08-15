"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type LineState = {
  orderLineId: string;
  designation: string;
  unit: string;
  ordered: number;
  receivedConforming: number;
  remaining: number;
};

type LineDraft = {
  orderLineId: string;
  receivedQty: string;
  damagedQty: string;
  refusedQty: string;
  refuseReason: string;
};

export function ReceivePurchaseOrderForm({
  orderId,
  number,
  supplierName,
  projectTitle,
  lines,
}: {
  orderId: string;
  number: string;
  supplierName: string;
  projectTitle: string | null;
  lines: LineState[];
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<LineDraft[]>(
    lines.map((l) => ({
      orderLineId: l.orderLineId,
      receivedQty: String(l.remaining > 0 ? l.remaining : 0),
      damagedQty: "0",
      refusedQty: "0",
      refuseReason: "",
    })),
  );
  const [blNumber, setBlNumber] = useState("");
  const [commentShared, setCommentShared] = useState("");
  const [commentInternal, setCommentInternal] = useState("");
  const [blFile, setBlFile] = useState<File | null>(null);
  const [showIssues, setShowIssues] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingTotal = useMemo(
    () => lines.reduce((s, l) => s + l.remaining, 0),
    [lines],
  );

  function setAllReceived() {
    setDrafts(
      lines.map((l) => ({
        orderLineId: l.orderLineId,
        receivedQty: String(l.remaining),
        damagedQty: "0",
        refusedQty: "0",
        refuseReason: "",
      })),
    );
    setShowIssues(false);
  }

  function updateDraft(lineId: string, patch: Partial<LineDraft>) {
    setDrafts((prev) =>
      prev.map((d) => (d.orderLineId === lineId ? { ...d, ...patch } : d)),
    );
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set(
        "lines",
        JSON.stringify(
          drafts.map((d) => ({
            orderLineId: d.orderLineId,
            receivedQty: Number(d.receivedQty || 0),
            damagedQty: Number(d.damagedQty || 0),
            refusedQty: Number(d.refusedQty || 0),
            refuseReason: d.refuseReason || null,
          })),
        ),
      );
      if (blNumber.trim()) form.set("deliveryNoteNumber", blNumber.trim());
      if (commentShared.trim()) form.set("commentShared", commentShared.trim());
      if (commentInternal.trim()) form.set("commentInternal", commentInternal.trim());
      if (blFile) form.set("blFile", blFile);

      const res = await fetch(`/api/purchase-orders/${orderId}/receipts`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push(`/dashboard/commandes/${orderId}?focus=invoice`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-1 pb-24">
      <header className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{number}</p>
        <h1 className="mt-1 text-xl font-extrabold text-slate-900">Réceptionner</h1>
        <p className="mt-1 text-sm text-slate-600">
          {supplierName}
          {projectTitle ? ` · ${projectTitle}` : ""}
        </p>
        <p className="mt-2 text-xs font-semibold text-slate-500">
          Restant attendu : {remainingTotal}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={setAllReceived}
          className="min-h-11 flex-1 rounded-xl bg-[#1e3a5f] px-3 py-2.5 text-sm font-bold text-white"
        >
          ✓ Tout reçu
        </button>
        <button
          type="button"
          onClick={() => setShowIssues((v) => !v)}
          className="min-h-11 flex-1 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-950"
        >
          Signaler un problème
        </button>
      </div>

      <ul className="space-y-3">
        {lines.map((l) => {
          const d = drafts.find((x) => x.orderLineId === l.orderLineId)!;
          return (
            <li key={l.orderLineId} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="font-semibold text-slate-900">{l.designation}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Commandé : {l.ordered} {l.unit}
                {" · "}
                Déjà reçu : {l.receivedConforming}
                {" · "}
                Restant : {l.remaining}
              </p>
              <label className="mt-3 block text-xs font-bold uppercase text-slate-500">
                Reçu
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={d.receivedQty}
                  onChange={(e) => updateDraft(l.orderLineId, { receivedQty: e.target.value })}
                  className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 px-3 text-lg font-semibold"
                />
              </label>
              {showIssues ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="block text-xs font-bold uppercase text-slate-500">
                    Endommagés
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={d.damagedQty}
                      onChange={(e) => updateDraft(l.orderLineId, { damagedQty: e.target.value })}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
                    />
                  </label>
                  <label className="block text-xs font-bold uppercase text-slate-500">
                    Refusés
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={d.refusedQty}
                      onChange={(e) => updateDraft(l.orderLineId, { refusedQty: e.target.value })}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
                    />
                  </label>
                  {Number(d.refusedQty) > 0 || Number(d.damagedQty) > 0 ? (
                    <label className="col-span-2 block text-xs font-bold uppercase text-slate-500">
                      Motif
                      <select
                        value={d.refuseReason}
                        onChange={(e) =>
                          updateDraft(l.orderLineId, { refuseReason: e.target.value })
                        }
                        className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      >
                        <option value="">—</option>
                        <option value="ENDOMMAGE">Endommagé</option>
                        <option value="MAUVAISE_REF">Mauvaise référence</option>
                        <option value="NON_CONFORME">Non conforme</option>
                        <option value="AUTRE">Autre</option>
                      </select>
                    </label>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="block text-xs font-bold uppercase text-slate-500">
          N° BL (optionnel)
          <input
            value={blNumber}
            onChange={(e) => setBlNumber(e.target.value)}
            placeholder="PP-845721"
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
          />
        </label>
        <label className="block text-xs font-bold uppercase text-slate-500">
          Photo / fichier BL
          <input
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            onChange={(e) => setBlFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm"
          />
        </label>
        <label className="block text-xs font-bold uppercase text-slate-500">
          Commentaire partagé fournisseur
          <textarea
            value={commentShared}
            onChange={(e) => setCommentShared(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-bold uppercase text-slate-500">
          Note interne (non partagée)
          <textarea
            value={commentInternal}
            onChange={(e) => setCommentInternal(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </section>

      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="min-h-12 w-full rounded-xl bg-[#1e3a5f] text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? "Enregistrement…" : "Confirmer la réception"}
        </button>
      </div>
    </div>
  );
}
