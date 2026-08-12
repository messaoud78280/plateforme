"use client";

import { useEffect, useState } from "react";
import { roundMoney } from "@/lib/commercial/money";

function fmt(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function QuoteRetentionPanel({ quoteId }: { quoteId: string }) {
  const [rate, setRate] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [cap, setCap] = useState(0);
  const [held, setHeld] = useState(0);
  const [released, setReleased] = useState(0);
  const [settled, setSettled] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [marketHt, setMarketHt] = useState(0);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/commercial/quotes/${quoteId}/retention`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur");
    setRate(String(data.ratePercent ?? 0));
    setDueDate(
      data.releaseDueDate ? String(data.releaseDueDate).slice(0, 10) : "",
    );
    setCap(Number(data.retentionCapHt) || 0);
    setHeld(Number(data.retentionHeldHt) || 0);
    setReleased(Number(data.retentionReleasedHt) || 0);
    setSettled(Number(data.retentionSettledHt) || 0);
    setRemaining(Number(data.retentionRemainingHt) || 0);
    setMarketHt(Number(data.marketSellHt) || 0);
    setLocked(Boolean(data.rateLocked));
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
      const res = await fetch(`/api/commercial/quotes/${quoteId}/retention`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          retentionGuaranteePercent: Number(rate) || 0,
          retentionReleaseDueDate: dueDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setCap(Number(data.retentionCapHt) || 0);
      setHeld(Number(data.retentionHeldHt) || 0);
      setReleased(Number(data.retentionReleasedHt) || 0);
      setSettled(Number(data.retentionSettledHt) || 0);
      setRemaining(Number(data.retentionRemainingHt) || 0);
      setMarketHt(Number(data.marketSellHt) || 0);
      setLocked(Boolean(data.rateLocked));
      setMsg("RG enregistrée");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const theoreticalCap = roundMoney(
    marketHt * ((Number(rate) || 0) / 100),
    2,
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <p className="text-sm font-bold text-[#1e3a5f]">Retenue de garantie</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-slate-500">
          Taux %
          <input
            type="number"
            min={0}
            max={100}
            step="0.01"
            disabled={locked || busy}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="mt-1 block w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm tabular-nums disabled:bg-slate-50"
          />
        </label>
        <label className="text-xs text-slate-500">
          Date libération prévue
          <input
            type="date"
            disabled={busy}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          Enregistrer
        </button>
      </div>
      {locked ? (
        <p className="text-[11px] text-amber-800">
          Taux figé : une situation avec RG a déjà été validée.
        </p>
      ) : null}
      <p className="text-xs text-slate-600">
        Montant maximal théorique :{" "}
        <span className="font-bold tabular-nums">{fmt(theoreticalCap)} € HT</span>
      </p>
      <div className="grid gap-2 sm:grid-cols-4 text-xs">
        <div className="rounded-lg bg-slate-50 px-2 py-1.5">
          <p className="text-slate-500">Retenue</p>
          <p className="font-bold tabular-nums">{fmt(held)} €</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-1.5">
          <p className="text-slate-500">Libérée</p>
          <p className="font-bold tabular-nums">{fmt(released)} €</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-1.5">
          <p className="text-slate-500">Encaissée</p>
          <p className="font-bold tabular-nums">{fmt(settled)} €</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-1.5">
          <p className="text-slate-500">Reste potentiel</p>
          <p className="font-bold tabular-nums">{fmt(remaining)} €</p>
        </div>
      </div>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      {msg ? <p className="text-xs text-emerald-700">{msg}</p> : null}
    </div>
  );
}
