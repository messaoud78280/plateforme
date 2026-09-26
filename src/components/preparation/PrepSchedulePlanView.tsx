"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { formatQty } from "@/lib/preparation/units";
import type { SchedulePlanViewPayload } from "@/lib/preparation/schedule/transfer";
import { PrepScheduleGantt } from "./PrepScheduleGantt";
import { PrepScheduleTaskPanel } from "./PrepScheduleTaskPanel";

function asIso(d: string | null): string {
  if (!d) return "—";
  return d.slice(0, 10);
}

function euro(n: number | null): string {
  if (n == null) return "—";
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export function PrepSchedulePlanView({
  studyId,
  planId,
}: {
  studyId: string;
  planId: string;
}) {
  const [plan, setPlan] = useState<SchedulePlanViewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quoteModal, setQuoteModal] = useState(false);
  const [quoteChoice, setQuoteChoice] = useState<string>("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/prep-studies/${studyId}/schedule/${planId}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? "Chargement impossible");
    setPlan(data.plan);
  }, [studyId, planId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const selected = useMemo(
    () => plan?.tasks.find((t) => t.id === selectedId) ?? null,
    [plan, selectedId],
  );

  const nextBlockedStepCode = useMemo(() => {
    if (!plan || !selected?.holdPoint) return null;
    const dep = plan.dependencies.find((d) => d.predecessorStepCode === selected.stepCode);
    return dep?.successorStepCode ?? null;
  }, [plan, selected]);

  async function patchQuote(quoteId: string | null) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/prep-studies/${studyId}/schedule/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Liaison impossible");
      setPlan(data.plan);
      setQuoteModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function patchHold(status: "A_CONTROLER" | "VALIDE" | "RESERVES") {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/prep-studies/${studyId}/schedule/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: selected.id, holdPointStatus: status }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Mise à jour impossible");
      setPlan(data.plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (error && !plan) {
    return <p className="p-6 text-[13px] text-red-700">{error}</p>;
  }
  if (!plan) {
    return <p className="p-6 text-[13px] text-slate-500">Chargement du planning…</p>;
  }

  const ind = plan.indicators;

  return (
    <div className="relative mx-auto max-w-[1600px] space-y-4 px-4 pb-16 pt-6 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] text-slate-500">
            <Link href={`/dashboard/visites-metres/etudes/${studyId}`} className="hover:underline">
              {plan.study.title}
            </Link>
            {" · "}
            {plan.project.title}
          </p>
          <h1 className="mt-0.5 text-[1.5rem] font-semibold text-[#1e3a5f]">{plan.title}</h1>
          <p className="mt-1 text-[12px] text-slate-500">
            {plan.revisionKind} · {plan.status}
            {plan.quote ? ` · Devis ${plan.quote.number}` : " · Sans devis"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {plan.quote ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setQuoteChoice(plan.quote!.id);
                  setQuoteModal(true);
                }}
                className="rounded-full border border-[#1e3a5f]/30 bg-white px-4 py-2 text-[13px] font-medium text-[#1e3a5f] disabled:opacity-50"
              >
                Changer le devis
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => patchQuote(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-[13px] text-slate-700 disabled:opacity-50"
              >
                Retirer le devis
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setQuoteChoice(plan.quoteOptions[0]?.id ?? "");
                setQuoteModal(true);
              }}
              className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
            >
              Lier un devis
            </button>
          )}
          <Link
            href={`/dashboard/visites-metres/etudes/${studyId}`}
            className="rounded-full border border-slate-200 px-4 py-2 text-[13px] text-slate-700"
          >
            Retour à l&apos;étude
          </Link>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-[13px] text-red-800">
          {error}
        </div>
      ) : null}

      {plan.isDemonstration || plan.watermark ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-950">
          <span className="font-semibold">{plan.watermark ?? "DÉMONSTRATION — NON CONTRACTUEL"}</span>
          {" — "}planning prévisionnel, hors indicateurs commerciaux réels.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 xl:grid-cols-6">
        <Kpi label="Démarrage" value={asIso(plan.startDate)} />
        <Kpi label="Fin de base" value={asIso(plan.endDateBase)} />
        <Kpi
          label="A · Charge de travail cumulée"
          value={`${ind.workloadDays} j`}
          hint="Somme des durées travaux / contrôles du chemin de base"
        />
        <Kpi
          label="B · Durée ouvrée du planning"
          value={ind.workingSpanDays != null ? `${ind.workingSpanDays} j ouvrés` : "—"}
          hint="Étendue ouvrée entre démarrage et fin de base (≠ somme des tâches)"
        />
        <Kpi
          label="C · Délai calendaire"
          value={ind.calendarSpanDays != null ? `${ind.calendarSpanDays} j cal.` : "—"}
          hint="Jours civils inclusifs démarrage → fin de base"
        />
        <Kpi
          label="D · Attentes techniques"
          value={`${ind.waitDays} j cal.`}
          hint="Somme des tâches d'attente (ex. cure)"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#1e3a5f]/10 bg-white px-4 py-3 text-[13px]">
        <span className="text-slate-500">Devis rattaché</span>
        <span className="font-medium text-[#1e3a5f]">
          {plan.quote ? plan.quote.number : "Aucun"}
        </span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-500">Total HT rattaché</span>
        <span className="font-semibold tabular-nums text-[#1e3a5f]">
          {euro(plan.linkedSellHtTotal)}
        </span>
        {plan.linkedCostHtTotal != null ? (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">Déboursé</span>
            <span className="tabular-nums text-slate-700">{euro(plan.linkedCostHtTotal)}</span>
          </>
        ) : null}
      </div>

      <PrepScheduleGantt
        tasks={plan.tasks}
        dependencies={plan.dependencies}
        selectedTaskId={selectedId}
        onSelectTask={setSelectedId}
      />

      <section className="overflow-x-auto rounded-2xl border border-[#1e3a5f]/10 bg-white">
        <table className="w-full min-w-[1040px] text-[12.5px]">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Réf.</th>
              <th className="px-3 py-2">Intervention</th>
              <th className="px-3 py-2">Durée</th>
              <th className="px-3 py-2">Début</th>
              <th className="px-3 py-2">Fin</th>
              <th className="px-3 py-2">Créneau</th>
              <th className="px-3 py-2">Quantité / rendement</th>
              <th className="px-3 py-2">Moyens</th>
              <th className="px-3 py-2 text-right">Vente HT</th>
            </tr>
          </thead>
          <tbody>
            {plan.tasks.map((t) => (
              <tr
                key={t.stepCode}
                className={cn(
                  "cursor-pointer border-t border-slate-100 align-top hover:bg-slate-50/80",
                  selectedId === t.id && "bg-[#1e3a5f]/[0.04]",
                  t.conditional && "opacity-80",
                )}
                onClick={() => setSelectedId(t.id)}
              >
                <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{t.stepCode}</td>
                <td className="px-3 py-2">
                  <p className="font-medium text-slate-900">{t.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {t.kind}
                    {t.holdPoint ? " · Point d'arrêt" : ""}
                    {t.conditional ? " · Conditionnel · Hors base" : ""}
                  </p>
                  {t.holdPoint && t.holdPointBlocksNext ? (
                    <p className="text-[11px] font-medium text-amber-800">
                      POINT D&apos;ARRÊT — non levé
                      {nextBlockedFor(plan, t.stepCode)
                        ? ` · Levée requise avant ${nextBlockedFor(plan, t.stepCode)}`
                        : ""}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {t.durationDays} j{" "}
                  {t.durationCalendar === "calendar" ? "cal." : "ouv."}
                </td>
                <td className="px-3 py-2 tabular-nums">{asIso(t.startDate)}</td>
                <td className="px-3 py-2 tabular-nums">{asIso(t.endDate)}</td>
                <td className="px-3 py-2 text-[11px] text-slate-600">
                  {t.startHalf === 0 ? "Matin" : "Après-midi"}
                  {t.startHalf === t.endHalf && t.durationDays <= 0.5
                    ? ""
                    : ` → ${t.endHalf === 0 ? "matin" : "soir"}`}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {t.quantitySnapshot != null
                    ? `${formatQty(t.quantitySnapshot)} ${t.quantityUnit ?? ""}`
                    : "—"}
                  {t.rateValue != null ? (
                    <span className="block text-[11px]">
                      {t.rateValue} {t.rateUnit}
                      {t.ratePer ? ` / ${t.ratePer}` : ""}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-[11px] text-slate-600">
                  {t.crew.length
                    ? t.crew.map((c) => `${c.count}× ${c.label}`).join(", ")
                    : "—"}
                  {t.equipment.length ? (
                    <span className="block">
                      {t.equipment.map((e) => `${e.count}× ${e.label}`).join(", ")}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {t.sellHtSnapshot != null ? euro(t.sellHtSnapshot) : "—"}
                  {t.costHtSnapshot != null ? (
                    <span className="block text-[11px] text-slate-500">
                      Déboursé {euro(t.costHtSnapshot)}
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selected ? (
        <div className="fixed inset-y-0 right-0 z-40 flex">
          <button
            type="button"
            aria-label="Fermer le panneau"
            className="flex-1 bg-slate-900/20 backdrop-blur-[1px]"
            onClick={() => setSelectedId(null)}
          />
          <PrepScheduleTaskPanel
            task={selected}
            nextBlockedStepCode={nextBlockedStepCode}
            busy={busy}
            onClose={() => setSelectedId(null)}
            onHoldStatusChange={patchHold}
          />
        </div>
      ) : null}

      {quoteModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-[16px] font-semibold text-[#1e3a5f]">Lier un devis</h3>
            <p className="mt-1 text-[13px] text-slate-600">
              Sélectionnez un devis de la même étude ou du même projet. Les dates et durées du
              planning ne sont pas recalculées.
            </p>
            {plan.quoteOptions.length === 0 ? (
              <p className="mt-4 text-[13px] text-amber-800">
                Aucun devis rattaché à cette étude / ce projet.
              </p>
            ) : (
              <select
                className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px]"
                value={quoteChoice}
                onChange={(e) => setQuoteChoice(e.target.value)}
              >
                {plan.quoteOptions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.number}
                    {q.isDemonstration ? " (démo)" : ""} — {euro(q.totalSellHt)}
                  </option>
                ))}
              </select>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuoteModal(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-[13px]"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={busy || !quoteChoice}
                onClick={() => patchQuote(quoteChoice || null)}
                className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
              >
                Lier
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function nextBlockedFor(plan: SchedulePlanViewPayload, stepCode: string): string | null {
  return (
    plan.dependencies.find((d) => d.predecessorStepCode === stepCode)?.successorStepCode ?? null
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#1e3a5f]/10 bg-white px-3 py-2.5" title={hint}>
      <p className="text-[15px] font-semibold tabular-nums text-[#1e3a5f]">{value}</p>
      <p className="text-[11px] leading-snug text-slate-500">{label}</p>
    </div>
  );
}
