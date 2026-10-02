"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  ChantierHierarchyNav,
  moduleChantierNav,
} from "@/components/chantier/ChantierHierarchyNav";
import type { SchedulePlanViewPayload } from "@/lib/preparation/schedule/transfer";
import {
  buildPlanningViewModel,
  filterPlanningTasks,
  type PlanningFilterId,
  type PlanningViewTab,
  type QualityGroup,
} from "@/lib/preparation/schedule/planning-view-model";
import { PrepScheduleGantt } from "./PrepScheduleGantt";
import { PrepScheduleTaskPanel } from "./PrepScheduleTaskPanel";
import { BeworkPatchToolbar } from "@/components/bework-patch/BeworkPatchToolbar";
import { getSectionCapability } from "@/lib/bework-patch/capability";
import { buildPlanningDetailState } from "@/lib/chantier/planning-detail-state";

function asIso(d: string | null): string {
  if (!d) return "—";
  return d.slice(0, 10);
}

function formatStartFr(d: string | null): string | null {
  if (!d) return null;
  const raw = d.slice(0, 10);
  const [y, m, day] = raw.split("-").map(Number);
  if (!y || !m || !day) return raw;
  try {
    return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return raw;
  }
}

function euro(n: number | null): string {
  if (n == null) return "Non renseigné";
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

const FILTERS: Array<{ id: PlanningFilterId; label: string }> = [
  { id: "all", label: "Toutes les phases" },
  { id: "incomplete", label: "À compléter" },
  { id: "no_crew", label: "Sans équipe" },
  { id: "no_rate", label: "Sans rendement" },
  { id: "with_alert", label: "Avec alerte" },
  { id: "controls", label: "Contrôles" },
  { id: "handover", label: "Remise" },
];

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
  const [startDraft, setStartDraft] = useState("");
  const [startOpen, setStartOpen] = useState(false);
  const [tab, setTab] = useState<PlanningViewTab>("planning");
  const [filter, setFilter] = useState<PlanningFilterId>("all");
  const [query, setQuery] = useState("");

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

  const vm = useMemo(() => (plan ? buildPlanningViewModel(plan) : null), [plan]);

  const filteredTasks = useMemo(() => {
    if (!vm) return [];
    return filterPlanningTasks(vm.tasks, filter, query);
  }, [vm, filter, query]);

  const filteredPhases = useMemo(() => {
    if (!vm) return [];
    const ids = new Set(filteredTasks.map((t) => t.id));
    return vm.phases
      .map((p) => ({
        ...p,
        tasks: p.tasks.filter((t) => ids.has(t.id)),
      }))
      .filter((p) => p.tasks.length > 0)
      .map((p) => ({ ...p, taskCount: p.tasks.length }));
  }, [vm, filteredTasks]);

  const selected = useMemo(
    () => vm?.tasks.find((t) => t.id === selectedId) ?? null,
    [vm, selectedId],
  );

  const nextBlockedStepCode = useMemo(() => {
    if (!plan || !selected?.holdPoint) return null;
    const dep = plan.dependencies.find((d) => d.predecessorStepCode === selected.stepCode);
    return dep?.successorStepCode ?? null;
  }, [plan, selected]);

  function focusStep(stepCode: string) {
    const t = vm?.tasks.find((x) => x.stepCode === stepCode);
    if (t) setSelectedId(t.id);
  }

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

  async function applyStartDate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/prep-studies/${studyId}/set-start-date`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: startDraft, planId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Date de démarrage impossible");
      setStartOpen(false);
      await load();
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
  if (!plan || !vm) {
    return <p className="p-6 text-[13px] text-slate-500">Chargement du planning…</p>;
  }

  const nav = moduleChantierNav({
    projectId: plan.project.id,
    projectTitle: plan.project.title,
    scope: plan.scope ? { id: plan.scope.id, name: plan.scope.name } : null,
    currentLabel: "Planning",
  });

  const metreSync = buildPlanningDetailState({
    status: plan.status,
    revisionNumber: plan.revisionNumber,
    studyVersionAtGeneration: plan.studyVersionAtGeneration,
    currentStudyVersion: plan.study.version,
    startDateLabel: formatStartFr(plan.startDate),
  });

  const s = vm.summary;

  return (
    <div className="relative mx-auto max-w-[1600px] space-y-3 px-4 pb-16 pt-5 sm:px-6">
      <ChantierHierarchyNav
        backHref={nav.backHref}
        backLabel={nav.backLabel}
        crumbs={nav.crumbs}
      />

      {/* En-tête */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Planning global
          </p>
          <h1 className="text-[1.35rem] font-semibold leading-tight text-[#1e3a5f]">
            {plan.project.title}
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-600">{plan.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
            <span>
              Début{" "}
              <strong className="font-medium text-slate-700">
                {formatStartFr(plan.startDate) ?? "à définir"}
              </strong>
            </span>
            <span className="text-slate-300">·</span>
            <span>
              Fin prévisionnelle{" "}
              <strong className="font-medium text-slate-700">
                {formatStartFr(plan.endDateBase) ?? "—"}
              </strong>
            </span>
            <span className="text-slate-300">·</span>
            <span>
              Révision{" "}
              <strong className="font-medium text-slate-700">
                {plan.revisionKind} {plan.revisionNumber}
              </strong>
            </span>
            <span className="text-slate-300">·</span>
            <span>
              Source métré{" "}
              <strong className="font-medium text-slate-700">v{plan.study.version}</strong>
            </span>
            <span className="text-slate-300">·</span>
            <span>
              Devis{" "}
              <strong className="font-medium text-slate-700">
                {plan.quote ? plan.quote.number : "Aucun"}
              </strong>
            </span>
          </div>
          <div className="mt-1.5">
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
                metreSync.primaryVariant === "alert"
                  ? "bg-amber-100 text-amber-950 ring-1 ring-amber-300/80"
                  : metreSync.primaryVariant === "warn"
                    ? "bg-orange-50 text-orange-900 ring-1 ring-orange-200"
                    : metreSync.primaryVariant === "ok"
                      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80"
                      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
              )}
            >
              {metreSync.primaryLabel}
            </span>
          </div>
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
                className="rounded-lg border border-[#1e3a5f]/30 bg-white px-3 py-1.5 text-[12px] font-medium text-[#1e3a5f] disabled:opacity-50"
              >
                Changer le devis
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => patchQuote(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] text-slate-700 disabled:opacity-50"
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
              className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
            >
              Lier un devis
            </button>
          )}
          <Link
            href={`/dashboard/visites-metres/etudes/${studyId}`}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] text-slate-700"
          >
            Voir le métré
          </Link>
          <BeworkPatchToolbar
            section="PLANNING"
            projectId={plan.project.id}
            entityId={plan.id}
            version={plan.revisionNumber}
            capability={getSectionCapability("PLANNING")}
            entityLabel={plan.title}
          />
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-[13px] text-red-800">
          {error}
        </div>
      ) : null}

      {/* Source integrity — distinct de CTX-04 */}
      {vm.sourceWarning ? (
        <div
          className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-2.5 text-[13px] text-orange-950"
          role="status"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-800">
            Source du dossier à vérifier
          </p>
          <p className="mt-0.5">{vm.sourceWarning}</p>
        </div>
      ) : null}

      {/* CTX-04 */}
      {metreSync.syncMessage || vm.metreSync.needsUpdate ? (
        <div
          className={cn(
            "rounded-lg px-4 py-2.5 text-[13px]",
            vm.metreSync.needsUpdate
              ? "border border-amber-300 bg-amber-50 text-amber-950"
              : "border border-orange-200 bg-orange-50 text-orange-950",
          )}
          role="status"
        >
          <p className="font-semibold">
            {vm.metreSync.needsUpdate
              ? "Le métré a évolué depuis la génération de ce planning"
              : metreSync.primaryLabel}
          </p>
          <p className="mt-0.5 text-[12px]">
            Révision planning : {plan.revisionNumber}
            {" · "}Version métré utilisée : {vm.metreSync.studyVersionAtGeneration}
            {" · "}Version actuelle : {vm.metreSync.currentStudyVersion}
          </p>
          {vm.metreSync.needsUpdate ? (
            <p className="mt-1 text-[12px] font-medium">
              Action : Préparer la mise à jour (aucune synchronisation silencieuse).
            </p>
          ) : metreSync.syncMessage ? (
            <p className="mt-0.5 text-[12px]">{metreSync.syncMessage}</p>
          ) : null}
        </div>
      ) : null}

      {plan.isDemonstration || plan.watermark ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-[13px] text-amber-950">
          <span className="font-semibold">
            {plan.watermark ?? "DÉMONSTRATION — NON CONTRACTUEL"}
          </span>
          {" — "}planning prévisionnel, hors indicateurs commerciaux réels.
        </div>
      ) : null}

      {/* KPI synthèse */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-8">
        <Kpi label="Début" value={formatStartFr(s.startDate) ?? "À définir"} />
        <Kpi label="Fin prévue" value={formatStartFr(s.endDate) ?? "—"} />
        <Kpi
          label="Durée chantier"
          value={
            s.workingSpanDays != null ? `${s.workingSpanDays} j ouvrés` : "—"
          }
        />
        <Kpi
          label="Durées cumulées"
          value={`${s.durationCumulatedDays} j`}
          hint="Somme des durées tâches — ≠ charge h.j"
        />
        <Kpi
          label="Charge connue"
          value={s.workloadKnownHj != null ? `${s.workloadKnownHj} h.j` : "—"}
        />
        <Kpi label="Tâches" value={String(s.taskCount)} />
        <Kpi
          label="Équipes"
          value={`${s.crewsFilled} / ${s.taskCount}`}
          hint="Tâches avec équipe renseignée"
        />
        <Kpi
          label="Alertes"
          value={String(s.blockerCount)}
          tone={s.blockerCount > 0 ? "danger" : undefined}
        />
      </div>

      {/* Qualité */}
      <QualityPanel
        blockers={vm.quality.blockers}
        warnings={vm.quality.warnings}
        infos={vm.quality.infos}
        incompleteCount={vm.quality.incompleteCount}
        onFilter={(f) => {
          setTab("planning");
          setFilter(f);
        }}
        onSeeSteps={(codes) => {
          setTab("planning");
          setFilter("with_alert");
          if (codes[0]) focusStep(codes[0]);
        }}
      />

      {/* Date démarrage */}
      {!plan.startDate || startOpen ? (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2.5">
          <div>
            <p className="text-[12px] font-medium text-amber-950">
              {plan.startDate
                ? "Modifier la date de démarrage"
                : "Date de démarrage à définir"}
            </p>
            <p className="mt-0.5 text-[11px] text-amber-900/80">
              Recalcule les dates civiles sans recréer les tâches.
            </p>
          </div>
          <label className="text-[12px] text-slate-700">
            Date
            <input
              type="date"
              className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[13px]"
              value={startDraft}
              onChange={(e) => setStartDraft(e.target.value)}
              min="1990-01-01"
              max="2100-12-31"
            />
          </label>
          <button
            type="button"
            disabled={busy || !startDraft}
            onClick={() => void applyStartDate()}
            className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
          >
            Définir la date de démarrage
          </button>
          {plan.startDate && startOpen ? (
            <button
              type="button"
              className="text-[12px] text-slate-600 underline"
              onClick={() => setStartOpen(false)}
            >
              Annuler
            </button>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          className="rounded-lg border border-[#1e3a5f]/20 bg-white px-3 py-1.5 text-[12px] font-medium text-[#1e3a5f]"
          onClick={() => {
            setStartDraft(plan.startDate ?? "");
            setStartOpen(true);
          }}
        >
          Modifier la date de démarrage
        </button>
      )}

      {/* Tabs */}
      <div
        className="flex flex-wrap items-center gap-1 border-b border-slate-200"
        role="tablist"
        aria-label="Vues planning"
      >
        {(
          [
            ["planning", "Planning"],
            ["resources", "Ressources"],
            ["preparation", "Préparation"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "border-b-2 px-3 py-2 text-[13px] font-medium transition",
              tab === id
                ? "border-[#1e3a5f] text-[#1e3a5f]"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "planning" ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="planning-search">
              Rechercher une tâche
            </label>
            <input
              id="planning-search"
              type="search"
              placeholder="Rechercher…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] outline-none focus:border-[#1e3a5f]/40"
            />
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium",
                    filter === f.id
                      ? "bg-[#1e3a5f] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <PrepScheduleGantt
            phases={filteredPhases}
            tasks={filteredTasks}
            dependencies={plan.dependencies}
            selectedTaskId={selectedId}
            onSelectTask={setSelectedId}
          />

          <TaskTable
            tasks={filteredTasks}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </>
      ) : null}

      {tab === "resources" ? (
        <ResourcesView
          resources={vm.resources}
          onOpenChat={() => {
            /* BeworkPatchToolbar already in header */
          }}
        />
      ) : null}

      {tab === "preparation" ? (
        <PreparationView
          prep={vm.preparation}
          onCategory={(f) => {
            setTab("planning");
            setFilter(f);
          }}
        />
      ) : null}

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
            onFocusStep={focusStep}
          />
        </div>
      ) : null}

      {quoteModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-[16px] font-semibold text-[#1e3a5f]">Lier un devis</h3>
            <p className="mt-1 text-[13px] text-slate-600">
              Sélectionnez un devis de la même étude ou du même projet.
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
                className="rounded-lg border border-slate-200 px-4 py-2 text-[13px]"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={busy || !quoteChoice}
                onClick={() => patchQuote(quoteChoice || null)}
                className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
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

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white px-2.5 py-2",
        tone === "danger"
          ? "border-red-200"
          : "border-[#1e3a5f]/10",
      )}
      title={hint}
    >
      <p
        className={cn(
          "text-[14px] font-semibold tabular-nums",
          tone === "danger" ? "text-red-700" : "text-[#1e3a5f]",
        )}
      >
        {value}
      </p>
      <p className="text-[10px] leading-snug text-slate-500">{label}</p>
    </div>
  );
}

function QualityPanel({
  blockers,
  warnings,
  infos,
  incompleteCount,
  onFilter,
  onSeeSteps,
}: {
  blockers: QualityGroup[];
  warnings: QualityGroup[];
  infos: QualityGroup[];
  incompleteCount: number;
  onFilter: (f: PlanningFilterId) => void;
  onSeeSteps: (codes: string[]) => void;
}) {
  const top = [...blockers, ...warnings, ...infos].slice(0, 6);
  return (
    <section className="rounded-lg border border-[#1e3a5f]/10 bg-white px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[#1e3a5f]">
          Qualité du planning
        </h2>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <SeverityChip
            level="BLOQUANT"
            count={blockers.reduce((s, g) => s + g.count, 0)}
          />
          <SeverityChip level="À COMPLÉTER" count={incompleteCount + warnings.reduce((s, g) => s + g.count, 0)} />
          <SeverityChip
            level="INFORMATION"
            count={infos.reduce((s, g) => s + g.count, 0)}
          />
        </div>
      </div>
      {top.length === 0 ? (
        <p className="mt-2 text-[12px] text-slate-500">
          Aucune alerte détectée par le validateur.
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {top.map((g) => (
            <li
              key={g.code}
              className="flex flex-wrap items-center justify-between gap-2 text-[12px]"
            >
              <span className="text-slate-700">
                <SeverityIcon severity={g.severity} />{" "}
                <strong className="font-medium">{g.count}</strong> {g.title.toLowerCase()}
                {g.count > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                className="text-[11px] font-medium text-[#1e3a5f] underline-offset-2 hover:underline"
                onClick={() => {
                  if (g.code === "CREW_ABSENT" || g.code.includes("CREW")) {
                    onFilter("no_crew");
                  } else if (g.code.includes("RATE") || g.code.includes("PRODUCTIVITY")) {
                    onFilter("no_rate");
                  } else {
                    onSeeSteps(g.stepCodes);
                  }
                }}
              >
                Voir les tâches
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SeverityChip({
  level,
  count,
}: {
  level: "BLOQUANT" | "À COMPLÉTER" | "INFORMATION";
  count: number;
}) {
  const tone =
    level === "BLOQUANT"
      ? "bg-red-50 text-red-800 ring-red-200"
      : level === "À COMPLÉTER"
        ? "bg-amber-50 text-amber-900 ring-amber-200"
        : "bg-slate-50 text-slate-700 ring-slate-200";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ring-1",
        tone,
      )}
    >
      {level === "BLOQUANT" ? "⚠" : level === "À COMPLÉTER" ? "◇" : "ℹ"} {count}{" "}
      {level.toLowerCase()}
      {count > 1 ? "s" : ""}
    </span>
  );
}

function SeverityIcon({ severity }: { severity: QualityGroup["severity"] }) {
  if (severity === "BLOCKER") return <span className="text-red-700">⚠</span>;
  if (severity === "WARNING") return <span className="text-amber-700">◇</span>;
  return <span className="text-slate-500">ℹ</span>;
}

function TaskTable({
  tasks,
  selectedId,
  onSelect,
}: {
  tasks: ReturnType<typeof filterPlanningTasks>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="overflow-x-auto rounded-lg border border-[#1e3a5f]/10 bg-white">
      <table className="w-full min-w-[980px] text-[12px]">
        <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-2.5 py-2">Réf.</th>
            <th className="px-2.5 py-2">Intervention</th>
            <th className="px-2.5 py-2">Phase</th>
            <th className="px-2.5 py-2">Durée</th>
            <th className="px-2.5 py-2">Début</th>
            <th className="px-2.5 py-2">Fin</th>
            <th className="px-2.5 py-2">Quantité / rendement</th>
            <th className="px-2.5 py-2">Équipe</th>
            <th className="px-2.5 py-2">Charge</th>
            <th className="px-2.5 py-2 text-right">Vente HT</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr
              key={t.id}
              className={cn(
                "cursor-pointer border-t border-slate-100 align-top hover:bg-slate-50/80",
                selectedId === t.id && "bg-[#1e3a5f]/[0.04]",
              )}
              onClick={() => onSelect(t.id)}
            >
              <td className="px-2.5 py-1.5 font-mono text-[11px] text-slate-500">
                {t.stepCode}
              </td>
              <td className="px-2.5 py-1.5">
                <p className="font-medium text-slate-900">{t.name}</p>
                {t.visualKind === "incomplete" ? (
                  <p className="text-[10px] font-medium text-amber-800">À compléter</p>
                ) : null}
                {t.visualKind === "blocked" ? (
                  <p className="text-[10px] font-medium text-red-700">Bloquant</p>
                ) : null}
              </td>
              <td className="px-2.5 py-1.5 text-slate-600">{t.phaseLabel}</td>
              <td className="px-2.5 py-1.5 tabular-nums">{t.durationLabel}</td>
              <td className="px-2.5 py-1.5 tabular-nums">{asIso(t.startDate)}</td>
              <td className="px-2.5 py-1.5 tabular-nums">{asIso(t.endDate)}</td>
              <td className="px-2.5 py-1.5 text-slate-600">
                <span
                  className={cn(
                    t.missing.quantity && "text-amber-700",
                  )}
                >
                  {t.quantityDisplay}
                </span>
                <span
                  className={cn(
                    "block text-[11px]",
                    t.missing.rate ? "text-amber-700" : "text-slate-500",
                  )}
                >
                  {t.rateDisplay}
                </span>
              </td>
              <td
                className={cn(
                  "px-2.5 py-1.5",
                  t.missing.crew ? "text-amber-700" : "text-slate-700",
                )}
              >
                {t.crewDisplay}
              </td>
              <td className="px-2.5 py-1.5 tabular-nums text-slate-600">
                {t.workloadDisplay}
              </td>
              <td className="px-2.5 py-1.5 text-right tabular-nums">
                {t.sellHtSnapshot != null ? euro(t.sellHtSnapshot) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ResourcesView({
  resources,
  onOpenChat,
}: {
  resources: ReturnType<typeof buildPlanningViewModel>["resources"];
  onOpenChat: () => void;
}) {
  if (!resources.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
        <p className="text-[14px] font-medium text-slate-800">Aucune équipe renseignée</p>
        <p className="mt-1 text-[12px] text-slate-500">
          Les équipes s&apos;affichent lorsqu&apos;elles sont affectées aux tâches (crew_id /
          effectif).
        </p>
        <p className="mt-3 text-[12px] text-slate-600">
          Utilisez <strong>Modifier avec ChatGPT</strong> dans la barre d&apos;actions pour
          proposer des équipes — avec aperçu avant application.
        </p>
        <button
          type="button"
          onClick={onOpenChat}
          className="mt-3 text-[12px] font-medium text-[#1e3a5f] underline"
        >
          Voir la barre ChatGPT en haut de page
        </button>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-[#1e3a5f]/10 bg-white">
      <table className="w-full text-[12px]">
        <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">Équipe</th>
            <th className="px-3 py-2">Effectif</th>
            <th className="px-3 py-2">Tâches</th>
            <th className="px-3 py-2">Charge h.j</th>
            <th className="px-3 py-2">Période</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((r) => (
            <tr key={r.crewId} className="border-t border-slate-100">
              <td className="px-3 py-2 font-medium text-[#1e3a5f]">{r.label}</td>
              <td className="px-3 py-2">
                {r.crewSize != null ? `${r.crewSize} pers.` : "Non renseigné"}
              </td>
              <td className="px-3 py-2 tabular-nums">{r.taskCount}</td>
              <td className="px-3 py-2 tabular-nums">
                {r.workloadPersonDays != null
                  ? `${Math.round(r.workloadPersonDays * 10) / 10} h.j`
                  : "—"}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {r.startDate && r.endDate
                  ? `${asIso(r.startDate)} → ${asIso(r.endDate)}`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreparationView({
  prep,
  onCategory,
}: {
  prep: ReturnType<typeof buildPlanningViewModel>["preparation"];
  onCategory: (f: PlanningFilterId) => void;
}) {
  const cats: Array<{
    label: string;
    count: number;
    filter: PlanningFilterId;
  }> = [
    { label: "Tâches sans équipe", count: prep.noCrew.length, filter: "no_crew" },
    { label: "Tâches sans rendement", count: prep.noRate.length, filter: "no_rate" },
    {
      label: "Tâches sans prérequis",
      count: prep.noPreconditions.length,
      filter: "incomplete",
    },
    {
      label: "Tâches sans contrôle",
      count: prep.noControls.length,
      filter: "controls",
    },
    {
      label: "Tâches sans moyens",
      count: prep.noEquipment.length,
      filter: "incomplete",
    },
    {
      label: "Tâches à classer",
      count: prep.unclassified.length,
      filter: "incomplete",
    },
    {
      label: "Tâches avec alertes",
      count: prep.withAlert.length,
      filter: "with_alert",
    },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {cats.map((c) => (
        <button
          key={c.label}
          type="button"
          onClick={() => onCategory(c.filter)}
          className={cn(
            "rounded-lg border bg-white px-3 py-3 text-left transition hover:border-[#1e3a5f]/30",
            c.count > 0 ? "border-amber-200" : "border-slate-100",
          )}
        >
          <p
            className={cn(
              "text-[20px] font-semibold tabular-nums",
              c.count > 0 ? "text-amber-800" : "text-slate-400",
            )}
          >
            {c.count}
          </p>
          <p className="text-[12px] text-slate-600">{c.label}</p>
        </button>
      ))}
    </div>
  );
}
