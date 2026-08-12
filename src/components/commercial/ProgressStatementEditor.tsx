"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { roundMoney } from "@/lib/commercial/money";
import {
  percentFromQuantity,
  quantityFromPercent,
  PROGRESS_STATEMENT_STATUS_LABELS,
} from "@/lib/commercial/progress-calc";

type Line = {
  id: string;
  designation: string;
  description: string | null;
  reference: string | null;
  unit: string;
  contractQuantity: number;
  unitSellHt: number;
  contractSellHt: number;
  vatRate: number;
  previousPercent: number;
  previousQuantity: number;
  previousSellHt: number;
  periodPercent: number;
  periodQuantity: number;
  periodSellHt: number;
  cumulativePercent: number;
  cumulativeQuantity: number;
  cumulativeSellHt: number;
  remainingSellHt: number;
};

type Statement = {
  id: string;
  label: string;
  number: number;
  status: string;
  periodStart: string | null;
  periodEnd: string | null;
  marketSellHt: number;
  marketVat: number;
  marketTtc: number;
  previousSellHt: number;
  previousVat: number;
  previousTtc: number;
  periodSellHt: number;
  periodVat: number;
  periodTtc: number;
  cumulativeSellHt: number;
  cumulativeVat: number;
  cumulativeTtc: number;
  remainingSellHt: number;
  remainingVat: number;
  remainingTtc: number;
  retentionRateSnapshot: number;
  retentionCapHt: number;
  retentionPreviousHt: number;
  retentionPeriodHt: number;
  retentionCumulativeHt: number;
  netPeriodSellHt: number;
  netPeriodVat: number;
  netPeriodTtc: number;
  prorataEnabledSnapshot: boolean;
  prorataRateSnapshot: number;
  prorataPreviousHt: number;
  prorataPeriodHt: number;
  prorataCumulativeHt: number;
  prorataLabelSnapshot: string | null;
  postProrataPeriodSellHt: number;
  depositDeductedHt: number;
  payablePeriodSellHt: number;
  payablePeriodVat: number;
  payablePeriodTtc: number;
  quote: { id: string; number: string; subject: string };
  project: { id: string; title: string } | null;
  invoice: { id: string; number: string } | null;
  lines: Line[];
};

function fmt(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function TotalsBlock({
  title,
  ht,
  vat,
  ttc,
  emphasize,
}: {
  title: string;
  ht: number;
  vat: number;
  ttc: number;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${
        emphasize
          ? "border-[#1e3a5f]/30 bg-[#1e3a5f]/5"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="mt-1 text-sm font-bold tabular-nums text-slate-900">
        {fmt(ht)} € HT
      </p>
      <p className="text-[11px] tabular-nums text-slate-500">
        TVA {fmt(vat)} · TTC {fmt(ttc)}
      </p>
    </div>
  );
}

export function ProgressStatementEditor({
  initial,
}: {
  initial: Statement;
}) {
  const router = useRouter();
  const [statement, setStatement] = useState(initial);
  const [lines, setLines] = useState(initial.lines);
  const [periodStart, setPeriodStart] = useState(
    initial.periodStart ? String(initial.periodStart).slice(0, 10) : "",
  );
  const [periodEnd, setPeriodEnd] = useState(
    initial.periodEnd ? String(initial.periodEnd).slice(0, 10) : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const canEdit = statement.status === "DRAFT";

  const previewTotals = useMemo(() => {
    // Affichage local approximatif ; serveur reste source de vérité après save
    return {
      period: lines.reduce((s, l) => s + (Number(l.periodSellHt) || 0), 0),
      cumul: lines.reduce((s, l) => s + (Number(l.cumulativeSellHt) || 0), 0),
    };
  }, [lines]);

  function patchLine(
    id: string,
    mode: "percent" | "quantity",
    value: number,
  ) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const periodPercent =
          mode === "percent"
            ? value
            : percentFromQuantity(l.contractQuantity, value);
        const periodQuantity =
          mode === "quantity"
            ? value
            : quantityFromPercent(l.contractQuantity, value);
        const cumulPct = roundMoney(l.previousPercent + periodPercent, 4);
        const over = cumulPct > 100 + 1e-6;
        const periodSellHt = over
          ? 0
          : roundMoney(l.contractSellHt * (periodPercent / 100), 2);
        const cumulativeSellHt = over
          ? l.previousSellHt
          : roundMoney(l.previousSellHt + periodSellHt, 2);
        return {
          ...l,
          periodPercent,
          periodQuantity,
          periodSellHt: over ? l.periodSellHt : periodSellHt,
          cumulativePercent: over ? l.cumulativePercent : Math.min(100, cumulPct),
          cumulativeSellHt: over ? l.cumulativeSellHt : cumulativeSellHt,
          remainingSellHt: over
            ? l.remainingSellHt
            : roundMoney(Math.max(0, l.contractSellHt - cumulativeSellHt), 2),
        };
      }),
    );
  }

  async function save(): Promise<boolean> {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/commercial/progress-statements/${statement.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            periodStart: periodStart || null,
            periodEnd: periodEnd || null,
            lines: lines.map((l) => ({
              id: l.id,
              periodPercent: l.periodPercent,
              inputMode: "percent",
            })),
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setStatement(data.statement);
      setLines(data.statement.lines);
      setMsg("Enregistré");
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function validate() {
    if (!confirm("Valider cette situation ? Les montants seront figés.")) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await save();
      if (!ok) return;
      setBusy(true);
      const res = await fetch(
        `/api/commercial/progress-statements/${statement.id}/validate`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setStatement(data.statement);
      setLines(data.statement.lines);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function invoice() {
    if (!confirm("Générer la facture (montant de la période uniquement) ?"))
      return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/commercial/progress-statements/${statement.id}/invoice`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.push(`/dashboard/devis-facturation/factures/${data.invoice.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-24">
      <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/95 px-1 py-3 backdrop-blur">
        <div>
          <Link
            href={`/dashboard/devis-facturation/devis/${statement.quote.id}`}
            className="text-xs font-semibold text-slate-600"
          >
            ← Devis {statement.quote.number}
          </Link>
          <h1 className="text-lg font-bold text-[#1e3a5f]">{statement.label}</h1>
          <p className="text-xs text-slate-500">
            {statement.quote.subject}
            {statement.project ? ` · ${statement.project.title}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-700">
            {PROGRESS_STATEMENT_STATUS_LABELS[statement.status] ??
              statement.status}
          </span>
          {canEdit ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
              >
                Enregistrer
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void validate()}
                className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
              >
                Valider la situation
              </button>
            </>
          ) : null}
          {statement.status === "VALIDATED" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void invoice()}
              className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
            >
              Générer la facture
            </button>
          ) : null}
          {statement.invoice ? (
            <Link
              href={`/dashboard/devis-facturation/factures/${statement.invoice.id}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
            >
              Facture {statement.invoice.number}
            </Link>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {msg ? <p className="text-xs text-emerald-700">{msg}</p> : null}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <TotalsBlock
          title="Marché initial"
          ht={statement.marketSellHt}
          vat={statement.marketVat}
          ttc={statement.marketTtc}
        />
        <TotalsBlock
          title="Déjà réalisé"
          ht={statement.previousSellHt}
          vat={statement.previousVat}
          ttc={statement.previousTtc}
        />
        <TotalsBlock
          title="Cette situation (brut)"
          ht={canEdit ? previewTotals.period : statement.periodSellHt}
          vat={statement.periodVat}
          ttc={statement.periodTtc}
          emphasize
        />
        <TotalsBlock
          title="Cumul"
          ht={canEdit ? previewTotals.cumul : statement.cumulativeSellHt}
          vat={statement.cumulativeVat}
          ttc={statement.cumulativeTtc}
        />
        <TotalsBlock
          title="Reste à facturer"
          ht={statement.remainingSellHt}
          vat={statement.remainingVat}
          ttc={statement.remainingTtc}
        />
      </div>

      {statement.retentionRateSnapshot > 0 || statement.retentionPeriodHt > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="text-sm font-bold text-amber-950">Retenue de garantie</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5 text-xs">
            <div>
              <p className="text-slate-500">Taux</p>
              <p className="font-bold">{fmt(statement.retentionRateSnapshot)} %</p>
            </div>
            <div>
              <p className="text-slate-500">Précédent</p>
              <p className="font-bold tabular-nums">
                {fmt(statement.retentionPreviousHt)} €
              </p>
            </div>
            <div>
              <p className="text-slate-500">Cette période</p>
              <p className="font-bold tabular-nums">
                {fmt(statement.retentionPeriodHt)} €
              </p>
            </div>
            <div>
              <p className="text-slate-500">Cumul RG</p>
              <p className="font-bold tabular-nums">
                {fmt(statement.retentionCumulativeHt)} € / {fmt(statement.retentionCapHt)} €
              </p>
            </div>
            <div>
              <p className="text-slate-500">Net après RG</p>
              <p className="font-bold tabular-nums text-[#1e3a5f]">
                {fmt(statement.netPeriodSellHt)} € HT · {fmt(statement.netPeriodTtc)} € TTC
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {statement.prorataEnabledSnapshot && statement.prorataPeriodHt > 0.004 ? (
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
          <p className="text-sm font-bold text-violet-950">
            {statement.prorataLabelSnapshot?.trim() || "Compte prorata"}
          </p>
          <p className="mt-0.5 text-[11px] text-violet-800/80">
            Provision / retenue — marché {fmt(statement.prorataRateSnapshot)} %
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div>
              <p className="text-slate-500">Précédent</p>
              <p className="font-bold tabular-nums">
                {fmt(statement.prorataPreviousHt)} €
              </p>
            </div>
            <div>
              <p className="text-slate-500">Période</p>
              <p className="font-bold tabular-nums">
                − {fmt(statement.prorataPeriodHt)} € HT
              </p>
            </div>
            <div>
              <p className="text-slate-500">Cumul</p>
              <p className="font-bold tabular-nums">
                {fmt(statement.prorataCumulativeHt)} €
              </p>
            </div>
            <div>
              <p className="text-slate-500">Net après prorata</p>
              <p className="font-bold tabular-nums text-[#1e3a5f]">
                {fmt(statement.postProrataPeriodSellHt)} € HT
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {statement.depositDeductedHt > 0.004 ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4">
          <p className="text-sm font-bold text-sky-950">Déduction d’acompte</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3 text-xs">
            <div>
              <p className="text-slate-500">Acompte déduit</p>
              <p className="font-bold tabular-nums">
                − {fmt(statement.depositDeductedHt)} € HT
              </p>
            </div>
            <div>
              <p className="text-slate-500">Net exigible période</p>
              <p className="font-bold tabular-nums text-[#1e3a5f]">
                {fmt(statement.payablePeriodSellHt)} € HT
              </p>
            </div>
            <div>
              <p className="text-slate-500">TTC exigible</p>
              <p className="font-bold tabular-nums">
                {fmt(statement.payablePeriodTtc)} €
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {canEdit ? (
        <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <label className="text-xs text-slate-500">
            Début période
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-slate-500">
            Fin période
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
        </div>
      ) : null}

      <div className="space-y-3">
        {lines.map((l) => {
          const done = l.cumulativePercent >= 100 - 1e-6;
          const bar = Math.min(100, Math.max(0, l.cumulativePercent));
          return (
            <div
              key={l.id}
              className={`rounded-xl border bg-white p-4 ${
                done ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    {l.reference ? `${l.reference} · ` : ""}
                    {l.designation}
                    {done ? (
                      <span className="ml-2 text-[10px] font-bold uppercase text-emerald-700">
                        Terminée
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Marché : {l.contractQuantity} {l.unit} × {fmt(l.unitSellHt)} €
                    = {fmt(l.contractSellHt)} € HT
                  </p>
                </div>
                <p className="text-sm font-bold tabular-nums text-[#1e3a5f]">
                  {fmt(l.periodSellHt)} € HT période
                </p>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#1e3a5f]"
                  style={{ width: `${bar}%` }}
                />
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Précédent
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    {roundMoney(l.previousPercent, 2)} %
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {fmt(l.previousSellHt)} € HT
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Cette période
                  </p>
                  {canEdit && !done ? (
                    <div className="mt-1 flex flex-wrap gap-2">
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="number"
                          min={0}
                          max={100 - l.previousPercent}
                          step="0.01"
                          value={l.periodPercent}
                          onChange={(e) =>
                            patchLine(l.id, "percent", Number(e.target.value) || 0)
                          }
                          className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 tabular-nums"
                        />
                        %
                      </label>
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={l.periodQuantity}
                          onChange={(e) =>
                            patchLine(
                              l.id,
                              "quantity",
                              Number(e.target.value) || 0,
                            )
                          }
                          className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 tabular-nums"
                        />
                        {l.unit}
                      </label>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold tabular-nums">
                      {roundMoney(l.periodPercent, 2)} % · {l.periodQuantity}{" "}
                      {l.unit}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Cumul
                  </p>
                  <p className="text-sm font-bold tabular-nums text-slate-900">
                    {roundMoney(l.cumulativePercent, 2)} %
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Reste
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    {roundMoney(100 - l.cumulativePercent, 2)} % ·{" "}
                    {fmt(l.remainingSellHt)} €
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
