"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  ChantierHierarchyNav,
  moduleChantierNav,
} from "@/components/chantier/ChantierHierarchyNav";
import { ChantierDossierNavHost } from "@/components/chantier/ChantierDossierNavHost";
import type { SchedulePlanViewPayload } from "@/lib/preparation/schedule/transfer";
import {
  buildPlanningViewModel,
  filterPlanningTasks,
  type PlanningFilterId,
  type PlanningViewTab,
  type QualityGroup,
} from "@/lib/preparation/schedule/planning-view-model";
import type { GanttZoom } from "@/lib/preparation/schedule/gantt-layout";
import {
  PrepScheduleGantt,
  type PrepScheduleGanttHandle,
} from "./PrepScheduleGantt";
import { PrepScheduleTaskPanel } from "./PrepScheduleTaskPanel";
import { PrepScheduleTransferModal } from "./PrepScheduleTransferModal";
import { TruncatedTextWithPopover } from "./TruncatedTextWithPopover";
import { BeworkPatchToolbar } from "@/components/bework-patch/BeworkPatchToolbar";
import { getSectionCapability } from "@/lib/bework-patch/capability";
import { buildPlanningDetailState } from "@/lib/chantier/planning-detail-state";

function asIso(d: string | null): string {
  if (!d) return "—";
  return d.slice(0, 10);
}

/** Date tableau lisible — une seule ligne, jamais 2026- / 10-21 empilés. */
function formatTableDate(d: string | null): string {
  if (!d) return "—";
  const raw = d.slice(0, 10);
  const [y, m, day] = raw.split("-");
  if (!y || !m || !day) return raw;
  return `${day}/${m}/${y}`;
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

const SECONDARY_FILTERS: Array<{ id: PlanningFilterId; label: string }> = [
  { id: "incomplete", label: "À compléter" },
  { id: "no_crew", label: "Sans équipe" },
  { id: "no_rate", label: "Sans rendement" },
  { id: "with_alert", label: "Avec alerte" },
  { id: "controls", label: "Contrôles" },
  { id: "handover", label: "Remise" },
];

const ZOOM_OPTIONS: Array<[GanttZoom, string]> = [
  ["day", "Jour"],
  ["week", "Semaine"],
  ["3weeks", "3 semaines"],
  ["month", "Mois"],
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
  const [updateFromMetreOpen, setUpdateFromMetreOpen] = useState(false);
  const [tab, setTab] = useState<PlanningViewTab>("planning");
  const [filter, setFilter] = useState<PlanningFilterId>("all");
  const [query, setQuery] = useState("");
  const [crewFilter, setCrewFilter] = useState<string>("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [conductMode, setConductMode] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [density, setDensity] = useState<"comfortable" | "compact">(
    "comfortable",
  );
  const [moreOpen, setMoreOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [zoom, setZoom] = useState<GanttZoom>("3weeks");
  const ganttRef = useRef<PrepScheduleGanttHandle | null>(null);

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
    let list = filterPlanningTasks(vm.tasks, filter, query);
    if (crewFilter !== "all") {
      list = list.filter((t) => (t.crewId ?? "") === crewFilter);
    }
    if (phaseFilter !== "all") {
      list = list.filter((t) => t.phaseLabel === phaseFilter);
    }
    return list;
  }, [vm, filter, query, crewFilter, phaseFilter]);

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

  const crewOptions = useMemo(() => {
    if (!vm) return [] as string[];
    const ids = [
      ...new Set(vm.tasks.map((t) => t.crewId).filter((x): x is string => !!x)),
    ];
    return ids.sort((a, b) => a.localeCompare(b, "fr"));
  }, [vm]);

  useEffect(() => {
    const cls = "bework-planning-expanded";
    if (expanded) document.body.classList.add(cls);
    else document.body.classList.remove(cls);
    return () => document.body.classList.remove(cls);
  }, [expanded]);

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

  const hideCommercial = conductMode || expanded;
  const shell = cn(
    "relative space-y-3",
    expanded
      ? "h-dvh overflow-hidden px-2 py-2 sm:px-3"
      : "mx-auto max-w-none px-3 pb-16 pt-3 sm:px-4 lg:px-5",
  );
  const activeFilterCount = filter === "all" ? 0 : 1;

  return (
    <div className={shell}>
      <ChantierHierarchyNav
        backHref={nav.backHref}
        backLabel={nav.backLabel}
        crumbs={nav.crumbs}
      />
      {!expanded ? (
        <ChantierDossierNavHost
          projectId={plan.project.id}
          scopeId={plan.scope?.id ?? null}
          activeStep="planning"
          variant="compact"
          sticky={false}
        />
      ) : null}

      {/* En-tête */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[1.5rem] font-semibold leading-tight tracking-tight text-[#1e3a5f]">
            Planning chantier
          </h1>
          <p className="mt-1 text-[15px] text-slate-700">{plan.project.title}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
            {formatStartFr(plan.startDate) ?? "Début à définir"}
            {" → "}
            {formatStartFr(plan.endDateBase) ?? "—"}
            {" · "}Révision {plan.revisionNumber}
            {" · "}Métré v{plan.study.version}
            {!hideCommercial ? (
              <>
                {" · "}
                {plan.quote ? plan.quote.number : "Devis non lié"}
              </>
            ) : null}
            {s.incompleteCount > 0 ? (
              <>
                {" · "}
                <span className="text-amber-800">
                  {s.incompleteCount} à compléter
                </span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!hideCommercial ? (
            <BeworkPatchToolbar
              section="PLANNING"
              projectId={plan.project.id}
              entityId={plan.id}
              version={plan.revisionNumber}
              capability={getSectionCapability("PLANNING")}
              entityLabel={plan.title}
              primaryActionLabel="Modifier avec ChatGPT"
              compact
            />
          ) : null}
          <button
            type="button"
            onClick={() => setConductMode((v) => !v)}
            aria-pressed={conductMode}
            className={cn(
              "h-9 rounded-[10px] px-3 text-[13px] font-medium transition-colors duration-150",
              conductMode
                ? "bg-[#1e3a5f] text-white"
                : "border border-slate-200 bg-white text-[#1e3a5f] hover:bg-slate-50",
            )}
          >
            Vue chantier
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-pressed={expanded}
            className="h-9 rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-medium text-[#1e3a5f] hover:bg-slate-50"
          >
            {expanded ? "Quitter le mode agrandi" : "Agrandir"}
          </button>
          {!hideCommercial ? (
            <div className="relative">
              <button
                type="button"
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                onClick={() => setMoreOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Autres actions</span>
              </button>
              {moreOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-[12px] border border-slate-200 bg-white py-1 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.35)]"
                >
                  {plan.quote ? (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        className="block w-full px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setQuoteChoice(plan.quote!.id);
                          setQuoteModal(true);
                          setMoreOpen(false);
                        }}
                      >
                        Changer le devis
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="block w-full px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          void patchQuote(null);
                          setMoreOpen(false);
                        }}
                      >
                        Retirer le devis
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      className="block w-full px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setQuoteChoice(plan.quoteOptions[0]?.id ?? "");
                        setQuoteModal(true);
                        setMoreOpen(false);
                      }}
                    >
                      Lier un devis
                    </button>
                  )}
                  <Link
                    role="menuitem"
                    href={`/dashboard/visites-metres/etudes/${studyId}`}
                    className="block px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50"
                    onClick={() => setMoreOpen(false)}
                  >
                    Voir le métré
                  </Link>
                  {plan.startDate ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="block w-full px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setStartDraft(plan.startDate ?? "");
                        setStartOpen(true);
                        setMoreOpen(false);
                      }}
                    >
                      Date de démarrage
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-[13px] text-red-800">
          {error}
        </div>
      ) : null}

      {/* Deep-link historique — pas de redirect auto vers CURRENT */}
      {(plan.status ?? "").toUpperCase() === "ARCHIVED" ? (
        <div
          className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-[13px] text-slate-800"
          role="status"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Version historique
          </p>
          <p className="mt-0.5">
            Ce planning est archivé. Un planning plus récent peut exister pour
            ce métré.
          </p>
          {plan.siblingCurrentPlanId ? (
            <Link
              href={`/dashboard/visites-metres/etudes/${studyId}/planning/${plan.siblingCurrentPlanId}`}
              className="mt-2 inline-flex rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-[12px] font-medium text-white"
            >
              Ouvrir la version actuelle
            </Link>
          ) : null}
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
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setUpdateFromMetreOpen(true)}
                className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
              >
                Mettre à jour le planning
              </button>
              <p className="text-[12px] text-amber-900/80">
                Prépare une régénération depuis le métré v{vm.metreSync.currentStudyVersion}
                {" "}(aucune écriture avant confirmation).
              </p>
            </div>
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

      {/* Bandeau synthèse retiré — dates / tâches déjà dans le titre */}

      {!expanded ? (
        <QualityPanel
          blockers={vm.quality.blockers}
          warnings={vm.quality.warnings}
          infos={vm.quality.infos}
          incompleteCount={vm.quality.incompleteCount}
          missingRateCount={vm.preparation.noRate.length}
          missingCrewCount={vm.preparation.noCrew.length}
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
      ) : null}

      {!expanded ? (
      <>
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
      ) : null}
      </>
      ) : null}

      {/* Tabs — flux normal, fond opaque (pas de sticky → pas de fantôme sous header) */}
      <div
        className="relative z-0 flex flex-wrap items-center gap-1 border-b border-slate-200 bg-[color:var(--cc-surface-muted)]"
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
              "border-b-2 px-3 py-1.5 text-[13px] font-medium transition-colors duration-150",
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
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <label className="sr-only" htmlFor="planning-search">
              Rechercher une tâche
            </label>
            <input
              id="planning-search"
              type="search"
              placeholder="Rechercher…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 min-w-[140px] flex-1 rounded-[10px] border border-slate-200 bg-white px-2.5 text-[12px] outline-none focus:border-[#1e3a5f]/40 sm:max-w-[200px]"
            />
            <select
              aria-label="Équipe"
              className="h-8 rounded-[10px] border border-slate-200 bg-white px-2 text-[12px] text-slate-700"
              value={crewFilter}
              onChange={(e) => setCrewFilter(e.target.value)}
            >
              <option value="all">Équipe</option>
              {crewOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
            <select
              aria-label="Phase"
              className="h-8 max-w-[160px] rounded-[10px] border border-slate-200 bg-white px-2 text-[12px] text-slate-700"
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
            >
              <option value="all">Phase</option>
              {vm.phases.map((p) => (
                <option key={p.key} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>

            <div className="relative">
              <button
                type="button"
                aria-expanded={filtersOpen}
                aria-haspopup="menu"
                onClick={() => setFiltersOpen((v) => !v)}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-[10px] border px-2.5 text-[12px] font-medium transition-colors duration-150",
                  activeFilterCount > 0
                    ? "border-[#1e3a5f]/30 bg-[#1e3a5f]/5 text-[#1e3a5f]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                )}
              >
                Filtres
                {activeFilterCount > 0 ? (
                  <span className="rounded-md bg-[#1e3a5f] px-1.5 text-[10px] font-semibold text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
              {filtersOpen ? (
                <div
                  role="menu"
                  className="absolute left-0 z-40 mt-1 w-56 overflow-hidden rounded-[12px] border border-slate-200 bg-white py-1 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.35)]"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className={cn(
                      "block w-full px-3 py-2 text-left text-[13px] hover:bg-slate-50",
                      filter === "all"
                        ? "font-semibold text-[#1e3a5f]"
                        : "text-slate-700",
                    )}
                    onClick={() => {
                      setFilter("all");
                      setFiltersOpen(false);
                    }}
                  >
                    Tous
                  </button>
                  {SECONDARY_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      role="menuitem"
                      className={cn(
                        "block w-full px-3 py-2 text-left text-[13px] hover:bg-slate-50",
                        filter === f.id
                          ? "font-semibold text-[#1e3a5f]"
                          : "text-slate-700",
                      )}
                      onClick={() => {
                        setFilter(f.id);
                        setFiltersOpen(false);
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                  <div className="my-1 border-t border-slate-100" />
                  <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Densité
                  </p>
                  <button
                    type="button"
                    role="menuitem"
                    className={cn(
                      "block w-full px-3 py-2 text-left text-[13px] hover:bg-slate-50",
                      density === "comfortable"
                        ? "font-semibold text-[#1e3a5f]"
                        : "text-slate-700",
                    )}
                    onClick={() => {
                      setDensity("comfortable");
                      setFiltersOpen(false);
                    }}
                  >
                    Confortable
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={cn(
                      "block w-full px-3 py-2 text-left text-[13px] hover:bg-slate-50",
                      density === "compact"
                        ? "font-semibold text-[#1e3a5f]"
                        : "text-slate-700",
                    )}
                    onClick={() => {
                      setDensity("compact");
                      setFiltersOpen(false);
                    }}
                  >
                    Compact
                  </button>
                </div>
              ) : null}
            </div>

            <span className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:block" aria-hidden />

            <button
              type="button"
              onClick={() => ganttRef.current?.scrollToday()}
              className="h-8 rounded-[10px] border border-[#1e3a5f]/25 bg-white px-2.5 text-[12px] font-semibold text-[#1e3a5f] hover:bg-[#1e3a5f]/5"
            >
              Aujourd&apos;hui
            </button>
            <button
              type="button"
              onClick={() => ganttRef.current?.scrollThisWeek()}
              className="h-8 rounded-[10px] border border-slate-200 bg-white px-2.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
            >
              Cette semaine
            </button>

            <span className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:block" aria-hidden />

            <div
              className="flex h-8 items-center gap-0.5 rounded-[10px] border border-slate-200 bg-white p-0.5"
              role="group"
              aria-label="Échelle du Gantt"
            >
              {ZOOM_OPTIONS.map(([z, label]) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZoom(z)}
                  aria-pressed={zoom === z}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium transition-colors duration-150",
                    zoom === z
                      ? "bg-[#1e3a5f] text-white"
                      : "text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={cn("flex min-w-0 gap-0", selected && "lg:pr-0")}>
            <div className="min-w-0 flex-1">
          <PrepScheduleGantt
            ref={ganttRef}
            phases={filteredPhases}
            tasks={filteredTasks}
            dependencies={plan.dependencies}
            selectedTaskId={selectedId}
            onSelectTask={setSelectedId}
            density={density}
            expanded={expanded}
            conductMode={conductMode}
            showChrome={false}
            zoom={zoom}
            onZoomChange={setZoom}
          />
            </div>
            {selected ? (
              <div className="hidden w-[400px] shrink-0 lg:block">
                <PrepScheduleTaskPanel
                  task={selected}
                  nextBlockedStepCode={nextBlockedStepCode}
                  busy={busy}
                  onClose={() => setSelectedId(null)}
                  onHoldStatusChange={patchHold}
                  onFocusStep={focusStep}
                  docked
                />
              </div>
            ) : null}
          </div>

          {!hideCommercial ? (
            <TaskTable
              tasks={filteredTasks}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ) : null}
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
        <div className="fixed inset-y-0 right-0 z-40 flex lg:hidden">
          <button
            type="button"
            aria-label="Fermer le panneau"
            className="flex-1 bg-slate-900/20"
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

      <PrepScheduleTransferModal
        studyId={studyId}
        open={updateFromMetreOpen}
        onClose={() => setUpdateFromMetreOpen(false)}
        intent="update_from_metre"
        preferredQuoteId={plan.quote?.id ?? null}
        replacePlanId={planId}
        onCommitted={({ href }) => {
          setUpdateFromMetreOpen(false);
          window.location.assign(href);
        }}
      />
    </div>
  );
}

function QualityPanel({
  blockers,
  warnings,
  infos: _infos,
  incompleteCount: _incompleteCount,
  missingRateCount,
  missingCrewCount,
  onFilter,
  onSeeSteps,
}: {
  blockers: QualityGroup[];
  warnings: QualityGroup[];
  infos: QualityGroup[];
  incompleteCount: number;
  missingRateCount: number;
  missingCrewCount: number;
  onFilter: (f: PlanningFilterId) => void;
  onSeeSteps: (codes: string[]) => void;
}) {
  const blockCount = blockers.reduce((s, g) => s + g.count, 0);
  const top = [...blockers, ...warnings].slice(0, 1);
  const parts: string[] = [];
  if (blockCount) {
    parts.push(`${blockCount} contrôle${blockCount > 1 ? "s" : ""} à revoir`);
  }
  if (missingRateCount > 0) {
    parts.push(
      `${missingRateCount} rendement${missingRateCount > 1 ? "s" : ""} à compléter`,
    );
  }
  if (missingCrewCount > 0) {
    parts.push(
      `${missingCrewCount} équipe${missingCrewCount > 1 ? "s" : ""} à renseigner`,
    );
  }
  const summary = parts.length ? parts.join(" · ") : "Aucune alerte";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-slate-600">
      <p>
        <span className="font-medium text-slate-800">Qualité</span>
        {" · "}
        {summary}
      </p>
      {parts.length ? (
        <button
          type="button"
          className="text-[13px] font-medium text-[#1e3a5f] hover:underline"
          onClick={() => {
            if (missingRateCount > 0) {
              onFilter("no_rate");
              return;
            }
            if (missingCrewCount > 0) {
              onFilter("no_crew");
              return;
            }
            const g = top[0];
            if (g) onSeeSteps(g.stepCodes);
          }}
        >
          Voir
        </button>
      ) : null}
    </div>
  );
}

function TaskTable({
  tasks,
  selectedId,
  onSelect,
}: {
  tasks: ReturnType<typeof filterPlanningTasks>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <section className="w-full overflow-x-auto rounded-[14px] border border-slate-200/80 bg-white">
      <table className="w-max min-w-[1520px] table-fixed border-collapse text-[12px]">
        <colgroup>
          <col style={{ width: 80 }} />
          <col style={{ width: 320 }} />
          <col style={{ width: 220 }} />
          <col style={{ width: 80 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 100 }} />
          <col style={{ width: 150 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 110 }} />
        </colgroup>
        <thead className="bg-slate-50 text-left text-[11px] font-medium text-slate-500">
          <tr>
            <th className="px-2.5 py-2">Réf.</th>
            <th className="px-2.5 py-2">Intervention</th>
            <th className="px-2.5 py-2">Phase</th>
            <th className="px-2.5 py-2">Durée</th>
            <th className="px-2.5 py-2">Début</th>
            <th className="px-2.5 py-2">Fin</th>
            <th className="px-2.5 py-2">Quantité</th>
            <th className="px-2.5 py-2">Rendement</th>
            <th className="px-2.5 py-2">Équipe</th>
            <th className="px-2.5 py-2">Charge</th>
            <th className="px-2.5 py-2 text-right">Montant</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr
              key={t.id}
              className={cn(
                "cursor-pointer border-t border-slate-100 transition-colors duration-150 hover:bg-slate-50/80",
                selectedId === t.id && "bg-[#1e3a5f]/[0.04]",
              )}
              onClick={() => onSelect(selectedId === t.id ? null : t.id)}
            >
              <td className="overflow-hidden px-2.5 py-2 align-middle font-mono text-[11px] tabular-nums text-slate-500">
                <span className="block truncate">{t.stepCode}</span>
              </td>
              <td className="overflow-hidden px-2.5 py-2 align-middle">
                <TruncatedTextWithPopover
                  text={t.name}
                  className="block max-w-full font-medium text-slate-900"
                />
                {t.visualKind === "incomplete" ? (
                  <p className="mt-0.5 truncate text-[10px] font-medium text-amber-800">
                    À compléter
                  </p>
                ) : null}
                {t.visualKind === "blocked" ? (
                  <p className="mt-0.5 truncate text-[10px] font-medium text-red-700">
                    Bloquant
                  </p>
                ) : null}
              </td>
              <td className="overflow-hidden px-2.5 py-2 align-middle text-slate-600">
                <TruncatedTextWithPopover
                  text={t.phaseLabel}
                  className="block max-w-full"
                />
              </td>
              <td className="overflow-hidden whitespace-nowrap px-2.5 py-2 align-middle tabular-nums">
                {t.durationLabel}
              </td>
              <td className="overflow-hidden whitespace-nowrap px-2.5 py-2 align-middle tabular-nums text-slate-700">
                {formatTableDate(t.startDate)}
              </td>
              <td className="overflow-hidden whitespace-nowrap px-2.5 py-2 align-middle tabular-nums text-slate-700">
                {formatTableDate(t.endDate)}
              </td>
              <td
                className={cn(
                  "overflow-hidden whitespace-nowrap px-2.5 py-2 align-middle",
                  t.missing.quantity ? "text-amber-700" : "text-slate-700",
                )}
              >
                <span className="block truncate">{t.quantityDisplay}</span>
              </td>
              <td
                className={cn(
                  "overflow-hidden whitespace-nowrap px-2.5 py-2 align-middle",
                  t.missing.rate ? "text-amber-700" : "text-slate-700",
                )}
              >
                <span className="block truncate">{t.rateDisplay}</span>
              </td>
              <td
                className={cn(
                  "overflow-hidden px-2.5 py-2 align-middle",
                  t.missing.crew ? "text-amber-700" : "text-slate-700",
                )}
              >
                <span className="block truncate">{t.crewDisplay}</span>
              </td>
              <td className="overflow-hidden whitespace-nowrap px-2.5 py-2 align-middle tabular-nums text-slate-600">
                {t.workloadDisplay}
              </td>
              <td className="overflow-hidden whitespace-nowrap px-2.5 py-2 align-middle text-right tabular-nums">
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
