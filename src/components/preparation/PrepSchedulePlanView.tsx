"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { formatQty } from "@/lib/preparation/units";

type PlanView = {
  id: string;
  title: string;
  isDemonstration: boolean;
  watermark: string | null;
  status: string;
  revisionKind: string;
  startDate: string | null;
  endDateBase: string | null;
  baseDurationWorkingDays: number | null;
  withConditionalWorkingDays: number | null;
  study: { id: string; title: string };
  project: { id: string; title: string };
  quote: { id: string; number: string; subject: string; isDemonstration: boolean } | null;
  tasks: Array<{
    stepCode: string;
    name: string;
    kind: string;
    includeInBase: boolean;
    holdPoint: boolean;
    conditional: boolean;
    startDate: string | null;
    endDate: string | null;
    durationDays: number;
    durationCalendar: string;
    quantitySnapshot: number | null;
    quantityUnit: string | null;
    rateValue: number | null;
    rateUnit: string | null;
    ratePer: string | null;
    crewJson: unknown;
    equipmentJson: unknown;
    dependsOnJson: unknown;
    blockingReason: string | null;
    sellHtSnapshot: number | null;
    costHtSnapshot: number | null;
    description: string | null;
  }>;
};

function asIso(d: string | null): string {
  if (!d) return "—";
  return d.slice(0, 10);
}

export function PrepSchedulePlanView({
  studyId,
  planId,
}: {
  studyId: string;
  planId: string;
}) {
  const [plan, setPlan] = useState<PlanView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/prep-studies/${studyId}/schedule/${planId}`);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Chargement impossible");
        if (!cancelled) setPlan(data.plan);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studyId, planId]);

  if (error) {
    return <p className="p-6 text-[13px] text-red-700">{error}</p>;
  }
  if (!plan) {
    return <p className="p-6 text-[13px] text-slate-500">Chargement du planning…</p>;
  }

  const dates = plan.tasks
    .map((t) => t.startDate?.slice(0, 10))
    .filter((d): d is string => !!d);
  const minDate = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null;
  const endDates = plan.tasks
    .map((t) => t.endDate?.slice(0, 10))
    .filter((d): d is string => !!d);
  const maxDate = endDates.length ? endDates.reduce((a, b) => (a > b ? a : b)) : null;

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 px-4 pb-16 pt-6 sm:px-6">
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
        <Link
          href={`/dashboard/visites-metres/etudes/${studyId}`}
          className="rounded-full border border-slate-200 px-4 py-2 text-[13px] text-slate-700"
        >
          Retour à l&apos;étude
        </Link>
      </header>

      {plan.isDemonstration || plan.watermark ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-950">
          <span className="font-semibold">{plan.watermark ?? "DÉMONSTRATION — NON CONTRACTUEL"}</span>
          {" — "}planning prévisionnel, hors indicateurs commerciaux réels.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Démarrage" value={asIso(plan.startDate)} />
        <Kpi
          label="Durée de base"
          value={
            plan.baseDurationWorkingDays != null
              ? `${plan.baseDurationWorkingDays} j ouvrés`
              : "—"
          }
        />
        <Kpi label="Fin de base" value={asIso(plan.endDateBase)} />
        <Kpi label="Interventions" value={String(plan.tasks.length)} />
      </div>

      {/* Emplacement Gantt — phase 3C */}
      <section className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-4">
        <h2 className="text-[14px] font-semibold text-[#1e3a5f]">Timeline prévisionnelle</h2>
        <p className="mt-1 text-[12px] text-slate-500">
          Diagramme de Gantt interactif prévu en phase suivante. Aperçu chronologique ci-dessous
          {minDate && maxDate ? ` (${minDate} → ${maxDate})` : ""}.
        </p>
        <div className="mt-3 space-y-1">
          {plan.tasks.map((t) => (
            <div key={t.stepCode} className="flex items-center gap-2 text-[12px]">
              <span className="w-12 shrink-0 font-mono text-slate-500">{t.stepCode}</span>
              <div className="h-6 min-w-0 flex-1 rounded bg-slate-100">
                <div
                  className={cn(
                    "flex h-full items-center truncate rounded px-2 text-[11px] font-medium text-white",
                    t.conditional
                      ? "bg-slate-400"
                      : t.kind === "wait"
                        ? "bg-violet-500"
                        : t.holdPoint
                          ? "bg-amber-600"
                          : "bg-[#1e3a5f]",
                  )}
                  style={{ width: `${Math.min(100, Math.max(8, t.durationDays * 12))}%` }}
                  title={`${t.startDate?.slice(0, 10)} → ${t.endDate?.slice(0, 10)}`}
                >
                  {t.name}
                </div>
              </div>
              <span className="w-16 shrink-0 text-right tabular-nums text-slate-600">
                {t.durationDays} j
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-[#1e3a5f]/10 bg-white">
        <table className="w-full min-w-[960px] text-[12.5px]">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Réf.</th>
              <th className="px-3 py-2">Intervention</th>
              <th className="px-3 py-2">Durée</th>
              <th className="px-3 py-2">Début</th>
              <th className="px-3 py-2">Fin</th>
              <th className="px-3 py-2">Quantité / rendement</th>
              <th className="px-3 py-2">Moyens</th>
              <th className="px-3 py-2 text-right">Vente HT</th>
            </tr>
          </thead>
          <tbody>
            {plan.tasks.map((t) => (
              <tr key={t.stepCode} className="border-t border-slate-100 align-top">
                <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{t.stepCode}</td>
                <td className="px-3 py-2">
                  <p className="font-medium text-slate-900">{t.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {t.kind}
                    {t.holdPoint ? " · Point d'arrêt" : ""}
                    {t.conditional ? " · Conditionnel" : ""}
                  </p>
                  {t.blockingReason ? (
                    <p className="text-[11px] text-amber-800">{t.blockingReason}</p>
                  ) : null}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {t.durationDays} j{" "}
                  {t.durationCalendar === "calendar" ? "cal." : "ouv."}
                </td>
                <td className="px-3 py-2 tabular-nums">{asIso(t.startDate)}</td>
                <td className="px-3 py-2 tabular-nums">{asIso(t.endDate)}</td>
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
                  {summarizeJsonList(t.crewJson, "labor")}
                  {summarizeJsonList(t.equipmentJson, "eq") ? (
                    <span className="block">{summarizeJsonList(t.equipmentJson, "eq")}</span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {t.sellHtSnapshot != null ? `${t.sellHtSnapshot.toFixed(2)} €` : "—"}
                  {t.costHtSnapshot != null ? (
                    <span className="block text-[11px] text-slate-500">
                      Déboursé {t.costHtSnapshot.toFixed(2)} €
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#1e3a5f]/10 bg-white px-3 py-2.5">
      <p className="text-[15px] font-semibold text-[#1e3a5f]">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function summarizeJsonList(raw: unknown, kind: "labor" | "eq"): string {
  if (!Array.isArray(raw) || !raw.length) return kind === "labor" ? "—" : "";
  if (kind === "labor") {
    return raw
      .map((c) => {
        if (!c || typeof c !== "object") return null;
        const o = c as { labor_id?: string; count?: number };
        return o.labor_id ? `${o.count ?? 1}× ${o.labor_id}` : null;
      })
      .filter(Boolean)
      .join(", ");
  }
  return raw
    .map((c) => {
      if (!c || typeof c !== "object") return null;
      const o = c as { equipment_id?: string; count?: number };
      return o.equipment_id ? `${o.count ?? 1}× ${o.equipment_id}` : null;
    })
    .filter(Boolean)
    .join(", ");
}
