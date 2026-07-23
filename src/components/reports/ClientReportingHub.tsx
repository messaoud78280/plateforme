"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import type {
  ClientInsightSeverity,
  ClientReportingDossier,
  ClientReportingSnapshot,
} from "@/lib/client-reporting-insights";

const SEVERITY_STYLES: Record<ClientInsightSeverity, { label: string; badge: string; border: string }> = {
  bloquant: {
    label: "Bloquant",
    badge: "bg-red-100 text-red-800 ring-red-200",
    border: "border-red-200/90",
  },
  urgent: {
    label: "Urgent",
    badge: "bg-amber-100 text-amber-900 ring-amber-200",
    border: "border-amber-200/90",
  },
  a_valider: {
    label: "À valider",
    badge: "bg-blue-100 text-blue-900 ring-blue-200",
    border: "border-blue-200/90",
  },
  info: {
    label: "Info",
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    border: "border-slate-200/90",
  },
};

const FLAG_STYLES: Record<ClientReportingDossier["flag"], string> = {
  bloquant: "bg-red-100 text-red-800 ring-red-200",
  urgent: "bg-amber-100 text-amber-900 ring-amber-200",
  a_valider: "bg-blue-100 text-blue-900 ring-blue-200",
  en_cours: "bg-slate-100 text-slate-700 ring-slate-200",
};

type FilterKey = "tous" | "bloquant" | "a_valider" | "urgent" | "en_cours";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "bloquant", label: "Bloquants" },
  { key: "a_valider", label: "À valider" },
  { key: "urgent", label: "Urgents" },
  { key: "en_cours", label: "En cours" },
];

export function ClientReportingHub({ snapshot }: { snapshot: ClientReportingSnapshot }) {
  const [filter, setFilter] = useState<FilterKey>("tous");
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const filteredDossiers = useMemo(() => {
    if (filter === "tous") return snapshot.dossiers;
    return snapshot.dossiers.filter((d) => d.flag === filter);
  }, [filter, snapshot.dossiers]);

  const copyDigest = () => {
    void navigator.clipboard.writeText(snapshot.executiveDigest.shareText).then(() => {
      startTransition(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* KPIs décisionnels */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiMini label="Missions ouvertes" value={snapshot.openMissions} />
        <KpiMini label="À valider par vous" value={snapshot.awaitingClientDecision} tone="blue" />
        <KpiMini label="Info manquante" value={snapshot.awaitingClientInfo} tone="red" />
        <KpiMini label="Pilotages actifs" value={snapshot.activePilotages} tone="slate" />
      </div>

      {/* Synthèse dirigeant */}
      <Card hover={false}>
        <CardHeader
          title="Synthèse dirigeant"
          description="Vue en 10 secondes — à partager en réunion ou par message."
        />
        <p className="mt-3 text-base font-semibold text-slate-900">{snapshot.executiveDigest.headline}</p>
        <ul className="mt-3 space-y-1.5">
          {snapshot.executiveDigest.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2 text-sm leading-relaxed text-slate-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyDigest}
            className="inline-flex rounded-lg border border-[#1d4ed8]/35 bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#1e3a8a] transition hover:bg-[#dbeafe]"
          >
            {copied ? "Synthèse copiée" : "Copier la synthèse"}
          </button>
          <Link
            href="/dashboard/pilotage-travaux"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Ouvrir le pilotage
          </Link>
        </div>
      </Card>

      {/* Insights */}
      <Card hover={false}>
        <CardHeader
          title="Points à traiter"
          description="Faits constatés sur vos dossiers — vous validez avant engagement."
        />
        <ul className="mt-3 space-y-3">
          {snapshot.insights.map((insight) => {
            const style = SEVERITY_STYLES[insight.severity];
            const inner = (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${style.badge}`}
                  >
                    {style.label}
                  </span>
                  {insight.count > 0 ? (
                    <span className="text-xs font-semibold text-slate-500">{insight.count}</span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">{insight.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{insight.detail}</p>
                {insight.href ? <p className="mt-2 text-sm font-semibold text-[#1d4ed8]">Ouvrir →</p> : null}
              </>
            );
            const className = `rounded-xl border ${style.border} bg-white px-4 py-3 shadow-sm transition hover:shadow-md`;
            return (
              <li key={insight.id}>
                {insight.href ? (
                  <Link
                    href={insight.href}
                    className={`block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/40 ${className}`}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className={className}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        {/* Dossiers filtrables */}
        <Card hover={false}>
          <CardHeader
            title="Dossiers à suivre"
            description="Priorisés : bloquant → à valider → urgent → en cours."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const count =
                f.key === "tous"
                  ? snapshot.dossiers.length
                  : snapshot.dossiers.filter((d) => d.flag === f.key).length;
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={
                    active
                      ? "rounded-lg bg-[#1d4ed8] px-3 py-1.5 text-xs font-bold text-white"
                      : "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  }
                >
                  {f.label} ({count})
                </button>
              );
            })}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--cc-chrome-border)] text-bework-muted">
                  <th className="pb-2 font-medium">Dossier</th>
                  <th className="pb-2 font-medium">Signal</th>
                  <th className="pb-2 font-medium">Attente</th>
                  <th className="pb-2 font-medium">Prochaine action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDossiers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-sm text-slate-500">
                      Aucun dossier sur ce filtre.
                    </td>
                  </tr>
                ) : (
                  filteredDossiers.map((dossier) => (
                    <tr key={dossier.id} className="border-b border-bework-navy/[0.06] last:border-b-0 align-top">
                      <td className="py-3 pr-3">
                        <Link
                          href={dossier.href}
                          className="font-semibold text-bework-ink hover:text-[#1d4ed8] hover:underline"
                        >
                          {dossier.title}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">
                          {dossier.missionTypeLabel}
                          {dossier.projectTitle ? ` · ${dossier.projectTitle}` : ""}
                          {dossier.assignedToName ? ` · ${dossier.assignedToName}` : ""}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">{dossier.statusLabel}</p>
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${FLAG_STYLES[dossier.flag]}`}
                        >
                          {dossier.flagLabel}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-slate-700">
                        {dossier.daysWaiting} j
                        {dossier.desiredDate ? (
                          <span className="mt-1 block text-xs text-slate-500">Souhaitée {dossier.desiredDate}</span>
                        ) : null}
                      </td>
                      <td className="py-3 text-slate-800">{dossier.nextAction}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card hover={false}>
            <CardHeader
              title="Décisions récentes"
              description="Accepté, réserves ou refus — traçabilité de vos validations."
            />
            <ul className="mt-3 space-y-3">
              {snapshot.recentDecisions.length === 0 ? (
                <li className="text-sm text-slate-500">Aucune décision client récente.</li>
              ) : (
                snapshot.recentDecisions.map((decision) => (
                  <li key={decision.id} className="rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={decision.href}
                        className="font-semibold text-slate-900 hover:text-[#1d4ed8] hover:underline"
                      >
                        {decision.title}
                      </Link>
                      <span className="shrink-0 text-xs font-semibold text-slate-500">
                        {decision.decidedAt ? new Date(decision.decidedAt).toLocaleDateString("fr-FR") : "—"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-[#1d4ed8]">{decision.decisionLabel}</p>
                    {decision.note ? <p className="mt-1 text-sm text-slate-700">{decision.note}</p> : null}
                  </li>
                ))
              )}
            </ul>
          </Card>

          <Card hover={false}>
            <CardHeader
              title="Pilotage chantier"
              description="Santé opérationnelle et accès direct aux suivis actifs."
            />
            <ul className="mt-3 space-y-3">
              {snapshot.pilotages.length === 0 ? (
                <li className="text-sm text-slate-500">Aucun pilotage chantier actif.</li>
              ) : (
                snapshot.pilotages.map((pilotage) => (
                  <li key={pilotage.id} className="rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={pilotage.href}
                          className="font-semibold text-slate-900 hover:text-[#1d4ed8] hover:underline"
                        >
                          {pilotage.projectTitle}
                        </Link>
                        <p className="mt-1 text-sm text-slate-700">
                          Santé : {pilotage.healthLabel ?? "À calculer"}
                          {typeof pilotage.healthScore === "number" ? ` · ${pilotage.healthScore}/100` : ""}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Fin prévisionnelle : {pilotage.plannedEndDate ?? "—"}
                        </p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {pilotage.status}
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
            <div className="mt-4">
              <Link
                href="/dashboard/pilotage-travaux"
                className="inline-flex rounded-lg border border-[#1d4ed8]/35 bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#1e3a8a] transition hover:bg-[#dbeafe]"
              >
                Ouvrir le pilotage travaux
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KpiMini({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "blue" | "red" | "slate";
}) {
  const wrap =
    tone === "blue"
      ? "border-blue-200/80 bg-[#eff6ff]/50"
      : tone === "red"
        ? "border-red-200/80 bg-red-50/40"
        : tone === "slate"
          ? "border-slate-200 bg-slate-50/60"
          : "border-slate-200/90 bg-white";
  const valueClass =
    tone === "blue" ? "text-[#1d4ed8]" : tone === "red" ? "text-red-700" : "text-slate-900";
  return (
    <div className={`rounded-xl border px-4 py-3 shadow-sm ${wrap}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}
