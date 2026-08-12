"use client";

import { useEffect, useState } from "react";
import { roundMoney } from "@/lib/commercial/money";
import { PRORATA_BASE_MODE_LABELS } from "@/lib/commercial/prorata-calc";

function fmt(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function QuoteProrataPanel({ quoteId }: { quoteId: string }) {
  const [enabled, setEnabled] = useState(false);
  const [rate, setRate] = useState("0");
  const [label, setLabel] = useState("Compte prorata");
  const [provisioned, setProvisioned] = useState(0);
  const [marketHt, setMarketHt] = useState(0);
  const [rateLocked, setRateLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/commercial/quotes/${quoteId}/prorata`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur");
    setEnabled(Boolean(data.enabled));
    setRate(String(data.ratePercent ?? 0));
    setLabel(data.label || "Compte prorata");
    setProvisioned(Number(data.provisionedHt) || 0);
    setMarketHt(Number(data.marketSellHt) || 0);
    setRateLocked(Boolean(data.rateLocked));
  }

  useEffect(() => {
    void load().catch((e) =>
      setError(e instanceof Error ? e.message : "Erreur"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  async function save() {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/commercial/quotes/${quoteId}/prorata`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prorataEnabled: enabled,
          prorataPercent: Number(rate) || 0,
          prorataBaseMode: "PERIOD_WORK_HT",
          prorataLabel: label.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setEnabled(Boolean(data.enabled));
      setRate(String(data.ratePercent ?? 0));
      setLabel(data.label || "Compte prorata");
      setProvisioned(Number(data.provisionedHt) || 0);
      setRateLocked(Boolean(data.rateLocked));
      setMsg(
        rateLocked
          ? "Enregistré — effet sur les situations futures uniquement"
          : "Compte prorata enregistré",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const preview = enabled
    ? roundMoney(marketHt * ((Number(rate) || 0) / 100), 2)
    : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div>
        <p className="text-sm font-bold text-[#1e3a5f]">Compte prorata</p>
        <p className="mt-1 text-xs text-slate-500">
          Provision / retenue sur situations — pas une remise commerciale. Base :{" "}
          {PRORATA_BASE_MODE_LABELS.PERIOD_WORK_HT}.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={enabled}
          disabled={busy}
          onChange={(e) => setEnabled(e.target.checked)}
          className="rounded border-slate-300"
        />
        Compte prorata applicable
      </label>

      {!enabled ? (
        <p className="text-xs text-slate-500">Compte prorata : Non applicable</p>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-slate-500">
            Taux %
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              disabled={busy}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="mt-1 block w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm tabular-nums"
            />
          </label>
          <label className="text-xs text-slate-500">
            Libellé
            <input
              type="text"
              disabled={busy}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1 block w-48 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
        </div>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
      >
        Enregistrer
      </button>

      {enabled ? (
        <div className="grid gap-2 sm:grid-cols-3 text-xs">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-slate-500">Provision théorique marché</p>
            <p className="font-bold tabular-nums">{fmt(preview)} € HT</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-slate-500">Déjà provisionné</p>
            <p className="font-bold tabular-nums">{fmt(provisioned)} € HT</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-slate-500">Traçabilité</p>
            <p className="font-semibold text-slate-700">
              {rateLocked
                ? "Situations passées figées"
                : "Modifiable librement"}
            </p>
          </div>
        </div>
      ) : null}

      {rateLocked && enabled ? (
        <p className="text-[11px] text-amber-800">
          Une situation a déjà provisionné du prorata. Un changement de taux
          s’applique uniquement aux situations futures (historique conservé).
        </p>
      ) : null}

      {msg ? <p className="text-xs text-emerald-700">{msg}</p> : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
