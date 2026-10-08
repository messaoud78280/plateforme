"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Layers, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/Modal";
import {
  codeFromScopeName,
  formatUnscopedHumanMessage,
  type ChantierWorkflowStep,
  type ProjectWorkspace,
  type ScopeWorkspace,
  type UnscopedItem,
} from "@/lib/chantier/project-workspace";
import {
  buildPilotageTodos,
  computePilotageNextAction,
} from "@/lib/chantier/pilotage-display";
import { computeProjectNextAction } from "@/lib/chantier/project-preparation-state";
import { TakeoffCreateFromChatgptModal } from "@/components/chantier/TakeoffCreateFromChatgptModal";
import { QuoteCreateFromChatgptModal } from "@/components/chantier/QuoteCreateFromChatgptModal";
import { PlanningCreateFromChatgptModal } from "@/components/chantier/PlanningCreateFromChatgptModal";
import { PlanningCreateV2Modal } from "@/components/chantier/PlanningCreateV2Modal";
import { ChantierDossierNav } from "@/components/chantier/ChantierDossierNav";
import { buildDossierNavFromWorkspace } from "@/lib/chantier/dossier-nav";
import { isFeatureEnabled } from "@/lib/feature-flags";

type QuoteSectionPreview = {
  sectionId: string;
  title: string;
  code: string;
  lineCount: number;
  selected: boolean;
  existingScopeId: string | null;
  existingScopeName: string | null;
  action: "create" | "link_existing";
};

export function ProjectPreparationOverview({
  workspace: workspaceRaw,
  canEdit = true,
  hasResponsible = true,
  missingDocumentsCount = 0,
  canAccessApprovisionnements = true,
}: {
  workspace: ProjectWorkspace;
  canEdit?: boolean;
  hasResponsible?: boolean;
  missingDocumentsCount?: number;
  /** Si false : pas de lien vers un onglet Approvisionnements invisible. */
  canAccessApprovisionnements?: boolean;
}) {
  const workspace = useMemo((): ProjectWorkspace => {
    if (canAccessApprovisionnements) return workspaceRaw;
    return {
      ...workspaceRaw,
      global: {
        ...workspaceRaw.global,
        workflow: workspaceRaw.global.workflow.map((s) =>
          s.id === "approvisionnements"
            ? {
                ...s,
                href: null,
                actionLabel: "Accès réservé",
                detail:
                  "Réservé aux comptes internes (achats / chantier).",
              }
            : s,
        ),
      },
    };
  }, [workspaceRaw, canAccessApprovisionnements]);
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [classifyOpen, setClassifyOpen] = useState(false);
  const [fromQuoteOpen, setFromQuoteOpen] = useState(false);
  const [fromQuoteId, setFromQuoteId] = useState<string | null>(null);
  const [createPrefill, setCreatePrefill] = useState("");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [takeoffCreateOpen, setTakeoffCreateOpen] = useState(false);
  const [quoteCreateOpen, setQuoteCreateOpen] = useState(false);
  const [planningCreateOpen, setPlanningCreateOpen] = useState(false);
  const [planningV2Open, setPlanningV2Open] = useState(false);
  const planningV2Enabled = isFeatureEnabled("planningV2Ui");

  const unscopedMsg = formatUnscopedHumanMessage(workspace.unscoped);
  const hasUnscoped = workspace.unscoped.items.length > 0;
  const primaryUnscopedQuoteId =
    workspace.unscoped.items.find((i) => i.kind === "quote")?.id ??
    workspace.global.primaryQuoteId;
  const [globalBusy, setGlobalBusy] = useState(false);
  const [globalBusyLabel, setGlobalBusyLabel] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const workflow = workspace.global.workflow ?? [];
  const dossierNav = useMemo(
    () =>
      buildDossierNavFromWorkspace(workspace, {
        activeStep: null,
        scopeId: null,
      }),
    [workspace],
  );
  const prepState = workspace.global.preparationState;
  const workflowReady =
    prepState?.completedCount ?? workflow.filter((s) => s.ready).length;
  const workflowTotal =
    prepState?.totalCount ?? Math.max(workflow.length, 1);
  const quoteId =
    workspace.global.primaryQuoteId ?? primaryUnscopedQuoteId ?? null;

  function metreBlockReason(): string | null {
    // Existence (href) ≠ terminé (ready) — ne pas regénérer un métré déjà présent.
    if (workspace.global.metre.href) return null;
    if (!canEdit) return "Modification du chantier non autorisée";
    // CREATE via ChatGPT : visite recommandée mais non bloquante (plan facultatif).
    return null;
  }

  function planningBlockReason(): string | null {
    if (workspace.global.planning.href) return null;
    if (!canEdit) return "Modification du chantier non autorisée";
    if (!workspace.global.metre.href) {
      return "Générez d’abord le métré";
    }
    if (!quoteId && !workspace.global.metre.href) {
      return "Un devis ou un métré est requis avant de générer le planning";
    }
    return null;
  }

  function workflowCardMode(step: ChantierWorkflowStep): {
    mode: "open" | "generate" | "blocked";
    reason: string | null;
    busyLabel: string | null;
  } {
    if (step.href && (step.ready || step.primaryAction === "open")) {
      return { mode: "open", reason: null, busyLabel: null };
    }
    if (
      step.id === "metre" &&
      (step.primaryAction === "create_global_prep" ||
        step.primaryAction === "prepare_takeoff_chatgpt")
    ) {
      const reason = metreBlockReason();
      if (reason) return { mode: "blocked", reason, busyLabel: null };
      return {
        mode: "generate",
        reason: null,
        busyLabel:
          step.primaryAction === "prepare_takeoff_chatgpt"
            ? "Ouverture ChatGPT…"
            : "Préparation du métré…",
      };
    }
    if (step.id === "devis" && step.primaryAction === "prepare_quote_chatgpt") {
      if (!workspace.global.metre.href) {
        return {
          mode: "blocked",
          reason: "Préparez d’abord le métré avant le devis",
          busyLabel: null,
        };
      }
      return {
        mode: "generate",
        reason: null,
        busyLabel: "Ouverture ChatGPT…",
      };
    }
    if (step.id === "planning" && step.primaryAction === "prepare_planning_chatgpt") {
      if (!workspace.global.metre.href) {
        return {
          mode: "blocked",
          reason: "Préparez d’abord le métré avant le planning",
          busyLabel: null,
        };
      }
      return {
        mode: "generate",
        reason: null,
        busyLabel: planningV2Enabled
          ? "Ouverture Planning V2…"
          : "Ouverture ChatGPT…",
      };
    }
    if (step.id === "planning" && step.primaryAction === "create_global_prep") {
      const reason = planningBlockReason();
      if (reason) return { mode: "blocked", reason, busyLabel: null };
      return {
        mode: "generate",
        reason: null,
        busyLabel: "Préparation du planning…",
      };
    }
    if (
      canEdit &&
      !step.ready &&
      (step.primaryAction === "attach_visit" ||
        step.primaryAction === "create_global_prep" ||
        step.primaryAction === "prepare_takeoff_chatgpt" ||
        step.primaryAction === "prepare_quote_chatgpt" ||
        step.primaryAction === "prepare_planning_chatgpt" ||
        step.primaryAction === "create_follow_up" ||
        step.primaryAction === "create_compte_rendu" ||
        step.primaryAction === "create_notice")
    ) {
      return { mode: "generate", reason: null, busyLabel: "Préparation…" };
    }
    if (step.href) return { mode: "open", reason: null, busyLabel: null };
    if (!canEdit) {
      return {
        mode: "blocked",
        reason: "Modification du chantier non autorisée",
        busyLabel: null,
      };
    }
    return {
      mode: "blocked",
      reason: "Action indisponible pour le moment",
      busyLabel: null,
    };
  }

  const nextAction = useMemo(() => {
    if (prepState) {
      const action = computeProjectNextAction({
        state: { ...prepState, hasResponsible },
        missingDocumentsCount,
        chantierStatus: workspace.chantierStatus,
        projectId: workspace.projectId,
      });
      return {
        label: action.label,
        href: action.href,
        stepId: action.stepId,
        code: action.code,
      };
    }
    return computePilotageNextAction({
      workspace,
      hasResponsible,
      missingDocumentsCount,
    });
  }, [prepState, workspace, hasResponsible, missingDocumentsCount]);
  const todos = useMemo(
    () =>
      buildPilotageTodos({
        workspace,
        hasResponsible,
        missingDocumentsCount,
        canEdit,
      }),
    [workspace, hasResponsible, missingDocumentsCount, canEdit],
  );

  const metrePosts =
    workspace.global.metre.detail?.match(/(\d+)\s*poste/i)?.[1] ?? null;
  const planningStart =
    workspace.global.planning.detail?.match(
      /(\d{1,2}\s+[a-zéûôî]+)/i,
    )?.[1] ?? null;

  async function createGlobalPrep(opts?: { prefer?: "metre" | "planning" }) {
    const targetQuoteId = quoteId;
    setGlobalBusy(true);
    setGlobalBusyLabel(
      opts?.prefer === "planning"
        ? "Préparation du planning…"
        : "Préparation du métré…",
    );
    setGlobalError(null);
    try {
      if (!workspace.global.visitId && workspace.global.suggestedVisitId) {
        const attach = await fetch(
          `/api/projets/${workspace.projectId}/global-prep`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "attach_visit",
              attachVisitId: workspace.global.suggestedVisitId,
              quoteId: targetQuoteId ?? undefined,
            }),
          },
        );
        const attachData = await attach.json().catch(() => null);
        if (!attach.ok) {
          throw new Error(attachData?.error ?? "Rattachement visite impossible");
        }
      }
      if (!targetQuoteId && !workspace.global.metre.href) {
        throw new Error("Un devis est requis avant de générer le métré");
      }
      if (opts?.prefer === "planning" && !workspace.global.metre.href) {
        throw new Error("Générez d’abord le métré");
      }
      const res = await fetch(`/api/projets/${workspace.projectId}/global-prep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: targetQuoteId ?? undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Création impossible");
      const planHref =
        typeof data?.planHref === "string" && data.planHref
          ? data.planHref
          : null;
      const studyId =
        typeof data?.studyId === "string" && data.studyId ? data.studyId : null;
      if (opts?.prefer === "planning" && planHref) {
        router.push(planHref);
        return;
      }
      if (opts?.prefer === "metre" && studyId) {
        router.push(`/dashboard/visites-metres/etudes/${studyId}`);
        return;
      }
      if (planHref) {
        router.push(planHref);
        return;
      }
      if (studyId) {
        router.push(`/dashboard/visites-metres/etudes/${studyId}`);
        return;
      }
      router.refresh();
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setGlobalBusy(false);
      setGlobalBusyLabel(null);
    }
  }

  async function attachSuggestedVisit() {
    if (!workspace.global.suggestedVisitId) {
      setGlobalError("Aucune visite à rattacher");
      return;
    }
    setGlobalBusy(true);
    setGlobalBusyLabel("Rattachement de la visite…");
    setGlobalError(null);
    try {
      const res = await fetch(`/api/projets/${workspace.projectId}/global-prep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "attach_visit",
          attachVisitId: workspace.global.suggestedVisitId,
          quoteId: workspace.global.primaryQuoteId ?? undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Rattachement impossible");
      router.refresh();
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setGlobalBusy(false);
      setGlobalBusyLabel(null);
    }
  }

  async function createFollowUp() {
    setGlobalBusy(true);
    setGlobalBusyLabel("Préparation du suivi…");
    setGlobalError(null);
    try {
      const res = await fetch(
        `/api/projets/${workspace.projectId}/planning-suivi`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Création suivi impossible");
      const href =
        data?.href ??
        `/dashboard/projets/${workspace.projectId}/suivi-planning`;
      router.push(href);
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setGlobalBusy(false);
      setGlobalBusyLabel(null);
    }
  }

  async function createCompteRendu() {
    setGlobalBusy(true);
    setGlobalBusyLabel("Préparation du compte rendu…");
    setGlobalError(null);
    try {
      const res = await fetch(
        `/api/projets/${workspace.projectId}/site-documents`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "COMPTE_RENDU",
            title: "Compte rendu de chantier",
          }),
        },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Création document impossible");
      const id = data?.document?.id ?? data?.id;
      if (id) {
        router.push(
          `/dashboard/projets/${workspace.projectId}/documents-chantier/${id}`,
        );
      } else {
        router.push(`/dashboard/projets/${workspace.projectId}/documents-chantier`);
      }
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setGlobalBusy(false);
      setGlobalBusyLabel(null);
    }
  }

  async function createNotice() {
    setGlobalBusy(true);
    setGlobalBusyLabel("Préparation de la notice…");
    setGlobalError(null);
    try {
      const res = await fetch(
        `/api/projets/${workspace.projectId}/site-documents`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "NOTICE",
            title: "Notice explicative du chantier",
          }),
        },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Création notice impossible");
      const id = data?.document?.id ?? data?.id;
      if (id) {
        router.push(
          `/dashboard/projets/${workspace.projectId}/documents-chantier/${id}`,
        );
      } else {
        router.push(`/dashboard/projets/${workspace.projectId}/documents-chantier`);
      }
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setGlobalBusy(false);
      setGlobalBusyLabel(null);
    }
  }

  async function runWorkflowAction(step: ChantierWorkflowStep) {
    const card = workflowCardMode(step);
    if (card.mode === "blocked") {
      setGlobalError(card.reason ?? "Action indisponible");
      return;
    }
    if (step.primaryAction === "attach_visit") {
      await attachSuggestedVisit();
      return;
    }
    if (step.primaryAction === "prepare_takeoff_chatgpt") {
      setTakeoffCreateOpen(true);
      return;
    }
    if (step.primaryAction === "prepare_quote_chatgpt") {
      setQuoteCreateOpen(true);
      return;
    }
    if (step.primaryAction === "prepare_planning_chatgpt") {
      // Flag ON → parcours réel ROCKMAN / « Lancer » ouvre V2 (bework_schedule_ai_v2).
      // Legacy reste accessible via le bouton secondaire « Flux legacy ».
      if (planningV2Enabled) {
        setPlanningV2Open(true);
      } else {
        setPlanningCreateOpen(true);
      }
      return;
    }
    if (step.primaryAction === "create_global_prep") {
      await createGlobalPrep({
        prefer: step.id === "planning" ? "planning" : "metre",
      });
      return;
    }
    if (step.primaryAction === "create_follow_up") {
      await createFollowUp();
      return;
    }
    if (step.primaryAction === "create_compte_rendu") {
      await createCompteRendu();
      return;
    }
    if (step.primaryAction === "create_notice") {
      await createNotice();
      return;
    }
    if (step.href) {
      // Même page + hash : forcer hashchange (Next soft-nav ne remonte pas le cockpit)
      try {
        const url = new URL(step.href, window.location.origin);
        if (
          url.pathname === window.location.pathname &&
          url.hash &&
          url.hash !== "#"
        ) {
          const nextHash = url.hash;
          if (window.location.hash === nextHash) {
            window.location.hash = "";
            queueMicrotask(() => {
              window.location.hash = nextHash;
            });
          } else {
            window.location.hash = nextHash;
          }
          return;
        }
      } catch {
        /* fallback router.push */
      }
      router.push(step.href);
      return;
    }
    if (step.id === "approvisionnements" && !canAccessApprovisionnements) {
      setGlobalError(
        "Approvisionnements réservé aux comptes internes (achats / chantier).",
      );
      return;
    }
    setGlobalError("Aucune action disponible pour cette étape");
  }

  function openCreate(prefill?: string) {
    setCreatePrefill(prefill ?? "");
    setCreateOpen(true);
  }

  function openCreateLotsFromQuote(quoteId?: string | null) {
    const id = quoteId ?? primaryUnscopedQuoteId;
    if (!id) return;
    setFromQuoteId(id);
    setFromQuoteOpen(true);
  }

  return (
    <section className="space-y-4">
      {/* Bandeau décisionnel */}
      <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-4 sm:px-5 sm:py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Pilotage chantier
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              {workspace.global.devis.href &&
              workspace.global.devis.title !== "Non créé" ? (
                <p className="text-[1.35rem] font-extrabold tabular-nums tracking-tight text-slate-950">
                  {workspace.global.devis.detail?.match(/[\d\s ,.]+€/)?.[0]?.trim() ??
                    workspace.global.devis.detail?.split(" · ").find((p) => p.includes("€")) ??
                    workspace.global.devis.title}
                </p>
              ) : (
                <p className="text-[15px] font-semibold text-slate-500">
                  Devis non rattaché
                </p>
              )}
              {planningStart ? (
                <p className="text-[13px] text-slate-600">
                  Début :{" "}
                  <span className="font-semibold text-slate-900">{planningStart}</span>
                </p>
              ) : null}
              <p className="text-[13px] text-slate-600">
                Préparation :{" "}
                <span className="font-semibold tabular-nums text-[#1e3a5f]">
                  {workflowReady} / {workflowTotal}
                </span>
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#1e3a5f]/15 bg-[#1e3a5f]/[0.03] px-3 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#1e3a5f]/70">
                Prochaine action
              </span>
              <span className="text-[13.5px] font-semibold text-slate-900">
                {nextAction.label}
              </span>
              {nextAction.href ? (
                <Link
                  href={nextAction.href}
                  className="ml-auto text-[12.5px] font-semibold text-[#1e3a5f] hover:underline"
                >
                  Ouvrir →
                </Link>
              ) : canEdit &&
                nextAction.stepId &&
                nextAction.stepId !== "responsable" &&
                nextAction.stepId !== "documents" ? (
                <button
                  type="button"
                  disabled={globalBusy}
                  onClick={() => {
                    const step = workflow.find((s) => s.id === nextAction.stepId);
                    if (step) void runWorkflowAction(step);
                  }}
                  className="ml-auto rounded-lg bg-[#1e3a5f] px-2.5 py-1 text-[12px] font-semibold text-white disabled:opacity-50"
                >
                  {globalBusy ? "…" : "Lancer"}
                </button>
              ) : null}
            </div>
          </div>

          {canEdit ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAddMenuOpen((v) => !v)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-[#152a45]"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Ajouter au chantier
              </button>
              {addMenuOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Fermer"
                    onClick={() => setAddMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-1 min-w-[220px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    {workspace.global.visitId ? (
                      <Link
                        href={`/dashboard/visites-metres/${workspace.global.visitId}`}
                        className="block px-3.5 py-2 text-[13px] text-slate-800 hover:bg-slate-50"
                        onClick={() => setAddMenuOpen(false)}
                      >
                        Visite — Ouvrir
                      </Link>
                    ) : (
                      <Link
                        href={`/dashboard/visites-metres/nouveau?projectId=${encodeURIComponent(workspace.projectId)}`}
                        className="block px-3.5 py-2 text-[13px] text-slate-800 hover:bg-slate-50"
                        onClick={() => setAddMenuOpen(false)}
                      >
                        Visite — Créer
                      </Link>
                    )}
                    <Link
                      href={`/dashboard/projets/${workspace.projectId}/documents-chantier`}
                      className="block px-3.5 py-2 text-[13px] text-slate-800 hover:bg-slate-50"
                      onClick={() => setAddMenuOpen(false)}
                    >
                      Document
                    </Link>
                    <button
                      type="button"
                      className="block w-full px-3.5 py-2 text-left text-[13px] text-slate-800 hover:bg-slate-50"
                      onClick={() => {
                        setAddMenuOpen(false);
                        const step = workflow.find((s) => s.id === "compte_rendu");
                        if (step) void runWorkflowAction(step);
                      }}
                    >
                      Compte rendu
                    </button>
                    <Link
                      href={`/dashboard/devis-facturation/devis/nouveau?projectId=${encodeURIComponent(workspace.projectId)}`}
                      className="block px-3.5 py-2 text-[13px] text-slate-800 hover:bg-slate-50"
                      onClick={() => setAddMenuOpen(false)}
                    >
                      Devis complémentaire
                    </Link>
                    <button
                      type="button"
                      className="block w-full px-3.5 py-2 text-left text-[13px] text-slate-800 hover:bg-slate-50"
                      onClick={() => {
                        setAddMenuOpen(false);
                        openCreate();
                      }}
                    >
                      Lot / phase
                    </button>
                    <Link
                      href={`#tab-taches`}
                      className="block px-3.5 py-2 text-[13px] text-slate-800 hover:bg-slate-50"
                      onClick={() => setAddMenuOpen(false)}
                    >
                      Tâche
                    </Link>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Navigation transversale dossier — variante FULL */}
      <ChantierDossierNav
        snapshot={dossierNav}
        variant="full"
        busy={globalBusy}
        onStepAction={async (navStep) => {
          const step = workflow.find((s) => s.id === navStep.id);
          if (!step) return;
          const card = workflowCardMode(step);
          if (card.mode === "blocked") {
            setGlobalError(card.reason ?? "Action indisponible");
            return;
          }
          await runWorkflowAction(step);
        }}
      />
      {globalBusyLabel ? (
        <p className="text-[12.5px] font-medium text-[#1e3a5f]">
          {globalBusyLabel}
        </p>
      ) : null}
      {globalError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-800"
        >
          {globalError}
        </p>
      ) : null}

      {canEdit &&
      planningV2Enabled &&
      workspace.global.metre.href &&
      !workspace.global.planning.href ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/40 px-3 py-2">
          <p className="text-[12.5px] text-emerald-950">
            Parcours principal = Planning V2 (<code className="text-[11px]">bework_schedule_ai_v2</code>).
            Le bouton « Lancer » ouvre ce flux.
          </p>
          <button
            type="button"
            onClick={() => setPlanningCreateOpen(true)}
            className="inline-flex rounded-lg border border-slate-300/80 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ouvrir le flux legacy
          </button>
        </div>
      ) : null}

      {/* 3 colonnes pilotage */}
      <div className="grid gap-3 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            À faire
          </h3>
          {todos.length === 0 ? (
            <p className="mt-2 text-[13px] text-slate-500">Rien de bloquant.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {todos.map((t) => (
                <li key={t.id}>
                  {t.href ? (
                    <Link
                      href={t.href}
                      className="flex items-start justify-between gap-2 rounded-lg px-1.5 py-1 text-[13px] text-slate-800 hover:bg-slate-50"
                    >
                      <span>{t.label}</span>
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    </Link>
                  ) : t.id === "unscoped-quotes" && canEdit ? (
                    <button
                      type="button"
                      onClick={() => openCreateLotsFromQuote()}
                      className="flex w-full items-start justify-between gap-2 rounded-lg px-1.5 py-1 text-left text-[13px] text-slate-800 hover:bg-slate-50"
                    >
                      <span>{t.label}</span>
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    </button>
                  ) : (
                    <span className="block px-1.5 py-1 text-[13px] text-slate-700">
                      {t.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Chantier
          </h3>
          <dl className="mt-2 space-y-1.5 text-[13px]">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Lots</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {workspace.scopes.length}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Postes métré</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {metrePosts ?? (workspace.global.metre.ready ? "—" : "—")}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Début planning</dt>
              <dd className="font-semibold text-slate-900">
                {planningStart ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Chaîne</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {workflowReady}/{workflowTotal}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Commercial
          </h3>
          {workspace.global.devis.href &&
          workspace.global.devis.title !== "Non créé" ? (
            <div className="mt-2 space-y-1.5 text-[13px]">
              <p className="font-semibold text-slate-900">
                {workspace.global.devis.title}
              </p>
              <p className="text-slate-600">
                {workspace.global.devis.detail ?? "—"}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={workspace.global.devis.href}
                  className="inline-flex text-[12.5px] font-semibold text-[#1e3a5f] hover:underline"
                >
                  {workspace.global.devis.ready
                    ? "Ouvrir →"
                    : "Finaliser →"}
                </Link>
                <span className="text-[12.5px] text-slate-500">
                  Modifier avec ChatGPT depuis le devis
                </span>
              </div>
            </div>
          ) : workspace.global.metre.href ? (
            <div className="mt-2 space-y-1.5 text-[13px]">
              <p className="text-slate-600">À préparer depuis le métré</p>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => setQuoteCreateOpen(true)}
                  className="inline-flex text-[12.5px] font-semibold text-[#1e3a5f] hover:underline"
                >
                  Préparer avec ChatGPT →
                </button>
              ) : (
                <p className="text-slate-500">Lecture seule</p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-slate-500">Aucun devis de référence.</p>
          )}
        </article>
      </div>

      {hasUnscoped ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-semibold text-amber-950">
              {workspace.unscoped.quotes === 1 &&
              workspace.unscoped.studies === 0 &&
              workspace.unscoped.schedulePlans === 0
                ? "1 devis à organiser"
                : workspace.unscoped.quotes > 1 &&
                    workspace.unscoped.studies === 0 &&
                    workspace.unscoped.schedulePlans === 0
                  ? `${workspace.unscoped.quotes} devis à organiser`
                  : `${workspace.unscoped.items.length} élément${workspace.unscoped.items.length > 1 ? "s" : ""} à organiser`}
            </p>
            {unscopedMsg ? (
              <p className="mt-0.5 text-[12.5px] text-amber-900/85">{unscopedMsg}</p>
            ) : null}
          </div>
          {canEdit ? (
            <div className="flex shrink-0 flex-wrap gap-2">
              {primaryUnscopedQuoteId ? (
                <button
                  type="button"
                  onClick={() => openCreateLotsFromQuote(primaryUnscopedQuoteId)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-[#152a45]"
                >
                  <Layers className="h-3.5 w-3.5" aria-hidden />
                  Créer les lots depuis le devis
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setClassifyOpen(true)}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-[12.5px] font-semibold",
                  primaryUnscopedQuoteId
                    ? "border border-amber-300/80 bg-white text-amber-950 hover:bg-amber-50"
                    : "bg-[#1e3a5f] text-white hover:bg-[#152a45]",
                )}
              >
                Classer
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {workspace.global.phases.length > 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white px-3.5 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Lots / phases
              </h3>
              <p className="mt-0.5 text-[12px] text-slate-500">
                Filtres du dossier — pas de métré ni planning séparés.
              </p>
            </div>
            {canEdit ? (
              <button
                type="button"
                onClick={() => openCreate()}
                className="text-[12.5px] font-semibold text-[#1e3a5f] hover:underline"
              >
                + Phase
              </button>
            ) : null}
          </div>
          <ul className="mt-2.5 divide-y divide-slate-100">
            {workspace.scopes.map((scope) => (
              <li key={scope.id}>
                <Link
                  href={scope.href}
                  className="flex items-center gap-3 py-2.5 transition hover:bg-slate-50/80"
                >
                  <span className="w-10 shrink-0 text-[11px] font-bold tabular-nums text-slate-400">
                    {scope.code}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-slate-900">
                    {scope.name}
                  </span>
                  <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    {scope.progress.ready >= scope.progress.total &&
                    scope.progress.total > 0
                      ? "Prêt"
                      : "Filtre"}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyPreparationState
          canEdit={canEdit}
          hasUnscoped={hasUnscoped}
          hasUnscopedQuote={!!primaryUnscopedQuoteId}
          onCreate={() =>
            openCreate(workspace.unscoped.items[0]?.suggestedScopeName ?? "")
          }
          onClassify={() => setClassifyOpen(true)}
          onCreateFromQuote={() => openCreateLotsFromQuote(primaryUnscopedQuoteId)}
        />
      )}

      <CreateScopeModal
        open={createOpen}
        projectId={workspace.projectId}
        prefillName={createPrefill}
        onClose={() => setCreateOpen(false)}
        onDone={() => {
          setCreateOpen(false);
          router.refresh();
        }}
      />

      <ClassifyItemsModal
        open={classifyOpen}
        projectId={workspace.projectId}
        scopes={workspace.scopes}
        items={workspace.unscoped.items}
        onClose={() => setClassifyOpen(false)}
        onDone={() => {
          setClassifyOpen(false);
          router.refresh();
        }}
      />

      {fromQuoteId ? (
        <CreateLotsFromQuoteModal
          open={fromQuoteOpen}
          projectId={workspace.projectId}
          quoteId={fromQuoteId}
          onClose={() => {
            setFromQuoteOpen(false);
            setFromQuoteId(null);
          }}
          onDone={() => {
            setFromQuoteOpen(false);
            setFromQuoteId(null);
            router.refresh();
          }}
        />
      ) : null}

      {takeoffCreateOpen ? (
        <TakeoffCreateFromChatgptModal
          projectId={workspace.projectId}
          visitId={workspace.global.visitId ?? null}
          onClose={() => setTakeoffCreateOpen(false)}
          onCreated={() => {
            setTakeoffCreateOpen(false);
            router.refresh();
          }}
        />
      ) : null}

      {quoteCreateOpen ? (
        <QuoteCreateFromChatgptModal
          projectId={workspace.projectId}
          studyId={workspace.global.metre.href?.match(/etudes\/([^/?#]+)/)?.[1] ?? null}
          onClose={() => setQuoteCreateOpen(false)}
          onCreated={() => {
            setQuoteCreateOpen(false);
            router.refresh();
          }}
        />
      ) : null}

      {planningCreateOpen ? (
        <PlanningCreateFromChatgptModal
          projectId={workspace.projectId}
          studyId={workspace.global.metre.href?.match(/etudes\/([^/?#]+)/)?.[1] ?? null}
          onClose={() => setPlanningCreateOpen(false)}
          onCreated={() => {
            setPlanningCreateOpen(false);
            router.refresh();
          }}
        />
      ) : null}

      {planningV2Open ? (
        <PlanningCreateV2Modal
          projectId={workspace.projectId}
          studyId={workspace.global.metre.href?.match(/etudes\/([^/?#]+)/)?.[1] ?? null}
          onClose={() => setPlanningV2Open(false)}
          onCreated={() => {
            setPlanningV2Open(false);
            router.refresh();
          }}
        />
      ) : null}
    </section>
  );
}

function EmptyPreparationState({
  canEdit,
  hasUnscoped,
  hasUnscopedQuote,
  onCreate,
  onClassify,
  onCreateFromQuote,
}: {
  canEdit: boolean;
  hasUnscoped: boolean;
  hasUnscopedQuote: boolean;
  onCreate: () => void;
  onClassify: () => void;
  onCreateFromQuote: () => void;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-[#1e3a5f]/20 bg-[rgba(30,58,95,0.02)] px-5 py-8 text-center sm:px-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1e3a5f]/70">
        Préparation du chantier
      </p>
      <p className="mt-2 text-[16px] font-semibold text-[#1e3a5f]">
        Aucun lot de travaux n’est encore défini.
      </p>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-slate-600">
        {hasUnscopedQuote
          ? "Votre devis contient déjà des sections : créez les lots en un clic pour débloquer la préparation et le planning."
          : "Organisez ce chantier par périmètre pour regrouper les plans, métrés, devis et plannings."}
      </p>
      {canEdit ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {hasUnscopedQuote ? (
            <button
              type="button"
              onClick={onCreateFromQuote}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#152a45]"
            >
              <Layers className="h-4 w-4" aria-hidden />
              Créer les lots depuis le devis
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCreate}
            className={cn(
              "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold",
              hasUnscopedQuote
                ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                : "bg-[#1e3a5f] text-white hover:bg-[#152a45]",
            )}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Créer un périmètre
          </button>
          {hasUnscoped && !hasUnscopedQuote ? (
            <button
              type="button"
              onClick={onClassify}
              className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Classer les éléments existants
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CreateLotsFromQuoteModal({
  open,
  projectId,
  quoteId,
  onClose,
  onDone,
}: {
  open: boolean;
  projectId: string;
  quoteId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteLabel, setQuoteLabel] = useState("");
  const [sections, setSections] = useState<QuoteSectionPreview[]>([]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!open || !quoteId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSections([]);
    setSelected(new Set());
    setQuoteLabel("");

    void (async () => {
      try {
        const res = await fetch(
          `/api/projets/${projectId}/scopes/from-quote?quoteId=${encodeURIComponent(quoteId)}`,
        );
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error ?? "Aperçu impossible");
        }
        if (cancelled) return;
        const list = (data?.sections ?? []) as QuoteSectionPreview[];
        setQuoteLabel(
          [data?.quote?.number, data?.quote?.subject].filter(Boolean).join(" — "),
        );
        setSections(list);
        setSelected(new Set(list.map((s) => s.sectionId)));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erreur");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, projectId, quoteId]);

  function toggle(sectionId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projets/${projectId}/scopes/from-quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          sectionIds: [...selected],
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Création impossible");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const selectedCount = selected.size;
  const createCount = sections.filter(
    (s) => selected.has(s.sectionId) && s.action === "create",
  ).length;
  const linkCount = sections.filter(
    (s) => selected.has(s.sectionId) && s.action === "link_existing",
  ).length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Créer les lots depuis le devis"
      description={
        quoteLabel
          ? `Aperçu des lots à partir de ${quoteLabel}. Décochez les sections à ignorer.`
          : "Aperçu des lots à créer à partir des sections du devis."
      }
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-700"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={busy || loading || selectedCount === 0}
            onClick={() => void submit()}
            className="rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {busy
              ? "Création…"
              : selectedCount === 0
                ? "Sélectionnez un lot"
                : `Valider (${selectedCount})`}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {loading ? (
          <p className="text-[13px] text-slate-500">Chargement des sections…</p>
        ) : null}
        {!loading && sections.length > 0 ? (
          <>
            <ul className="max-h-[min(360px,50vh)] space-y-2 overflow-y-auto">
              {sections.map((sec) => {
                const checked = selected.has(sec.sectionId);
                return (
                  <li key={sec.sectionId}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition",
                        checked
                          ? "border-[#1e3a5f]/25 bg-[rgba(30,58,95,0.03)]"
                          : "border-slate-200 bg-white opacity-70",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={checked}
                        onChange={() => toggle(sec.sectionId)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-400">
                            {sec.code}
                          </span>
                          {sec.action === "link_existing" ? (
                            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10.5px] font-semibold text-sky-900">
                              Lot existant — rattacher
                            </span>
                          ) : (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-900">
                              À créer
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-[13.5px] font-semibold text-slate-900">
                          {sec.title}
                        </span>
                        <span className="mt-0.5 block text-[12px] text-slate-500">
                          {sec.lineCount} poste{sec.lineCount > 1 ? "s" : ""}
                          {sec.existingScopeName
                            ? ` · rattachement à « ${sec.existingScopeName} »`
                            : null}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <p className="text-[12px] text-slate-500">
              {createCount > 0
                ? `${createCount} lot${createCount > 1 ? "s" : ""} à créer`
                : "Aucun nouveau lot"}
              {linkCount > 0
                ? ` · ${linkCount} rattachement${linkCount > 1 ? "s" : ""} sans doublon`
                : null}
              . Le devis devient référence des lots retenus — montants inchangés.
            </p>
          </>
        ) : null}
        {error ? <p className="text-[12.5px] text-red-700">{error}</p> : null}
      </div>
    </Modal>
  );
}

function CreateScopeModal({
  open,
  projectId,
  prefillName,
  onClose,
  onDone,
}: {
  open: boolean;
  projectId: string;
  prefillName: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(prefillName);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(prefillName);
    setCode(prefillName ? codeFromScopeName(prefillName) : "");
    setDescription("");
    setError(null);
  }, [open, prefillName]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projets/${projectId}/scopes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Création impossible");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Créer un périmètre"
      description="Ex. Fondations, Installation électrique, VRD, Maçonnerie…"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-700"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={busy || !name.trim()}
            onClick={() => void submit()}
            className="rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Création…" : "Créer"}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <label className="block text-[12.5px] font-medium text-slate-700">
          Nom du périmètre
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!code || code === codeFromScopeName(name)) {
                setCode(codeFromScopeName(e.target.value));
              }
            }}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px] outline-none focus:border-[#1e3a5f]/40"
            placeholder="Fondations"
            autoFocus
          />
        </label>
        <label className="block text-[12.5px] font-medium text-slate-700">
          Code (facultatif)
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px] outline-none focus:border-[#1e3a5f]/40"
            placeholder="FOND"
          />
        </label>
        <label className="block text-[12.5px] font-medium text-slate-700">
          Description (facultatif)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px] outline-none focus:border-[#1e3a5f]/40"
            placeholder="Lot fondations superficielles…"
          />
        </label>
        {error ? <p className="text-[12.5px] text-red-700">{error}</p> : null}
      </div>
    </Modal>
  );
}

function ClassifyItemsModal({
  open,
  projectId,
  scopes,
  items,
  onClose,
  onDone,
}: {
  open: boolean;
  projectId: string;
  scopes: ScopeWorkspace[];
  items: UnscopedItem[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [mode, setMode] = useState<"existing" | "create">(
    scopes.length > 0 ? "existing" : "create",
  );
  const [scopeId, setScopeId] = useState(scopes[0]?.id ?? "");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [referenceQuoteId, setReferenceQuoteId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedQuotes = items.filter(
    (i) => i.kind === "quote" && selected.has(`${i.kind}:${i.id}`),
  );

  useEffect(() => {
    if (!open) return;
    setSelected(new Set(items.map((i) => `${i.kind}:${i.id}`)));
    setMode(scopes.length > 0 ? "existing" : "create");
    setScopeId(scopes[0]?.id ?? "");
    const suggestion =
      items.find((i) => i.suggestedScopeName)?.suggestedScopeName ?? "";
    setName(suggestion);
    setCode(suggestion ? codeFromScopeName(suggestion) : "");
    const firstQuote = items.find((i) => i.kind === "quote");
    setReferenceQuoteId(firstQuote?.id ?? "");
    setError(null);
  }, [open, items, scopes]);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const payloadItems = items
        .filter((i) => selected.has(`${i.kind}:${i.id}`))
        .map((i) => ({ kind: i.kind, id: i.id }));
      if (payloadItems.length === 0) {
        throw new Error("Sélectionnez au moins un élément");
      }
      const refId =
        referenceQuoteId &&
        payloadItems.some((i) => i.kind === "quote" && i.id === referenceQuoteId)
          ? referenceQuoteId
          : undefined;
      const res = await fetch(`/api/projets/${projectId}/scopes/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "create"
            ? {
                createScope: {
                  name: name.trim(),
                  code: code.trim() || undefined,
                },
                items: payloadItems,
                referenceQuoteId: refId,
              }
            : { scopeId, items: payloadItems, referenceQuoteId: refId },
        ),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Classement impossible");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Classer les éléments"
      description="Rattachez explicitement les devis, métrés ou plannings à un lot de travaux."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-700"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={busy || selected.size === 0}
            onClick={() => void submit()}
            className="rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Enregistrement…" : "Classer"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {items.map((item) => {
            const key = `${item.kind}:${item.id}`;
            const kindLabel =
              item.kind === "quote"
                ? "Devis"
                : item.kind === "study"
                  ? "Métré"
                  : "Planning";
            return (
              <li key={key}>
                <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selected.has(key)}
                    onChange={() => toggle(key)}
                    className="mt-1"
                  />
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {kindLabel}
                    </span>
                    <span className="block text-[13.5px] font-semibold text-slate-900">
                      {item.label}
                    </span>
                    {item.detail ? (
                      <span className="block text-[12px] text-slate-500">{item.detail}</span>
                    ) : null}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap gap-2">
          {scopes.length > 0 ? (
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={cn(
                "rounded-full px-3 py-1.5 text-[12px] font-semibold",
                mode === "existing"
                  ? "bg-[#1e3a5f] text-white"
                  : "border border-slate-200 text-slate-700",
              )}
            >
              Lot existant
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setMode("create")}
            className={cn(
              "rounded-full px-3 py-1.5 text-[12px] font-semibold",
              mode === "create"
                ? "bg-[#1e3a5f] text-white"
                : "border border-slate-200 text-slate-700",
            )}
          >
            Nouveau lot
          </button>
        </div>

        {mode === "existing" && scopes.length > 0 ? (
          <label className="block text-[12.5px] font-medium text-slate-700">
            Périmètre
            <select
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px]"
            >
              {scopes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[12.5px] font-medium text-slate-700 sm:col-span-2">
              Nom du nouveau lot
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setCode(codeFromScopeName(e.target.value));
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px]"
                placeholder="Installation électrique"
              />
            </label>
            <label className="block text-[12.5px] font-medium text-slate-700">
              Code
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px]"
              />
            </label>
          </div>
        )}

        {selectedQuotes.length > 0 ? (
          <label className="block text-[12.5px] font-medium text-slate-700">
            Devis de référence (facultatif)
            <select
              value={
                selectedQuotes.some((q) => q.id === referenceQuoteId)
                  ? referenceQuoteId
                  : selectedQuotes[0]?.id ?? ""
              }
              onChange={(e) => setReferenceQuoteId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px]"
            >
              {selectedQuotes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.label}
                  {q.detail ? ` — ${q.detail}` : ""}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[11.5px] font-normal text-slate-500">
              Les autres devis restent rattachés au même lot.
            </span>
          </label>
        ) : null}

        {error ? <p className="text-[12.5px] text-red-700">{error}</p> : null}
      </div>
    </Modal>
  );
}
