/**
 * Source métier unique — préparation chantier (7 étapes + progression + nextAction).
 *
 * Consommateurs : liste (`portfolio` / `buildPreparationSnapshot`) et fiche
 * (`getProjectWorkspace` / `ProjectPreparationOverview`).
 *
 * Réutilise CTX-03 / CTX-04 via `core-preparation-state` — pas de duplication.
 * Calcul pur : aucune requête Prisma ici.
 */
import {
  evaluateCorePreparationTriple,
  type MetreCoreState,
  type QuoteCoreState,
  type PlanningCoreState,
} from "@/lib/chantier/core-preparation-state";
import {
  resolveProjectQuote,
  resolveProjectVisit,
  studyHasPlanSource,
  type PreparationEntryMode,
  type PreparationPlan,
  type PreparationQuote,
  type PreparationQuoteSync,
  type PreparationStudy,
  type PreparationVisit,
} from "@/lib/chantier/preparation-inputs";
import {
  resolvePrepSchedulePlanForWorkspace,
  resolvePrepStudyForWorkspace,
  type ScopeLike,
} from "@/lib/chantier/resolve-workspace-entities";

function humanizeStatus(raw: string | null | undefined): string {
  if (!raw) return "";
  const map: Record<string, string> = {
    TO_PLAN: "À planifier",
    INTERVENTION_PREVUE: "Intervention prévue",
    DRAFT: "Brouillon",
    FINALIZED: "Finalisé",
    ARCHIVED: "Archivé",
    EN_COURS: "En cours",
    A_VALIDER: "À valider",
    COMPLETE: "Terminé",
    CURRENT: "Actuel",
  };
  return map[raw] ?? raw;
}

export type PreparationStepId =
  | "visite"
  | "metre"
  | "devis"
  | "planning"
  | "suivi"
  | "compte_rendu"
  | "notice";

/** État normalisé commun liste ↔ fiche. */
export type PreparationStepKind =
  | "ABSENT"
  | "IN_PROGRESS"
  | "READY"
  | "NEEDS_VALIDATION"
  | "NEEDS_REVALIDATION"
  | "ACTION_REQUIRED"
  | "DONE"
  | "NOT_APPLICABLE";

export type PreparationStep = {
  id: PreparationStepId;
  label: string;
  kind: PreparationStepKind;
  displayLabel: string;
  secondaryLabel: string | null;
  applicable: boolean;
  countsAsCompleted: boolean;
  hrefHint: string | null;
};

export type ProjectNextActionCode =
  | "ASSIGN_MANAGER"
  | "FINISH_VISIT"
  | "COMPLETE_VISIT"
  | "PLAN_VISIT"
  | "DO_VISIT"
  | "PREPARE_TAKEOFF"
  | "VALIDATE_TAKEOFF"
  | "PREPARE_QUOTE"
  | "FINALIZE_QUOTE"
  | "REVALIDATE_QUOTE"
  | "PREPARE_PLANNING"
  | "UPDATE_PLANNING"
  | "CREATE_FOLLOW_UP"
  | "CREATE_REPORT"
  | "CREATE_NOTICE"
  | "MISSING_DOCUMENTS"
  | "PREPARE_START"
  | "CONTINUE_FOLLOW_UP"
  | "NONE";

export type ProjectNextAction = {
  code: ProjectNextActionCode;
  label: string;
  href: string | null;
  stepId: PreparationStepId | "responsable" | "documents" | null;
};

export type ProjectPreparationState = {
  projectId: string;
  entryMode: PreparationEntryMode;
  visitId: string | null;
  hasResponsible: boolean;

  steps: PreparationStep[];
  visit: PreparationStep;
  takeoff: PreparationStep;
  quote: PreparationStep;
  planning: PreparationStep;
  followUp: PreparationStep;
  report: PreparationStep;
  notice: PreparationStep;

  /** Détail technique réutilisable (CTX-03/04). */
  core: {
    metre: MetreCoreState;
    devis: QuoteCoreState;
    planning: PlanningCoreState;
  };

  completedCount: number;
  totalCount: number;
  progressPercent: number;

  nextAction: ProjectNextAction;
};

export type FollowUpLike = {
  id: string;
  status: string;
  title: string | null;
};

export type SiteDocLike = {
  id: string;
  kind: string;
  status: string;
  number?: string | null;
  title?: string | null;
};

function visitKind(
  visit: PreparationVisit | null,
  required: boolean,
): { kind: PreparationStepKind; displayLabel: string; applicable: boolean } {
  if (!required && !visit) {
    return {
      kind: "NOT_APPLICABLE",
      displayLabel: "Dossier sur plan",
      applicable: false,
    };
  }
  if (!visit) {
    return { kind: "ABSENT", displayLabel: "À faire", applicable: true };
  }
  const map: Record<string, { kind: PreparationStepKind; displayLabel: string }> = {
    TO_PLAN: { kind: "IN_PROGRESS", displayLabel: "À planifier" },
    SCHEDULED: { kind: "IN_PROGRESS", displayLabel: "Planifiée" },
    IN_PROGRESS: { kind: "IN_PROGRESS", displayLabel: "Relevé en cours" },
    INCOMPLETE: { kind: "IN_PROGRESS", displayLabel: "À compléter" },
    READY_TO_QUOTE: { kind: "READY", displayLabel: "Prête à chiffrer" },
    TRANSMITTED: { kind: "DONE", displayLabel: "Transmise" },
    CANCELLED: { kind: "NOT_APPLICABLE", displayLabel: "Annulée" },
  };
  const hit = map[visit.status] ?? {
    kind: "IN_PROGRESS" as const,
    displayLabel: "En cours",
  };
  return {
    kind: hit.kind,
    displayLabel: hit.displayLabel,
    applicable: hit.kind !== "NOT_APPLICABLE",
  };
}

function docKind(doc: SiteDocLike | null, absentLabel: string): {
  kind: PreparationStepKind;
  displayLabel: string;
  countsAsCompleted: boolean;
} {
  if (!doc) {
    return {
      kind: "ABSENT",
      displayLabel: absentLabel,
      countsAsCompleted: false,
    };
  }
  const st = doc.status?.toUpperCase() ?? "";
  if (st === "FINALIZED" || st === "PUBLISHED" || st === "VALIDATED") {
    return {
      kind: "DONE",
      displayLabel: "Finalisé",
      countsAsCompleted: true,
    };
  }
  if (st === "DRAFT" || st === "BROUILLON") {
    return {
      kind: "IN_PROGRESS",
      displayLabel: "Brouillon",
      countsAsCompleted: false,
    };
  }
  // Présent avec statut métier non final → compte comme étape amorcée / suivie
  return {
    kind: "READY",
    displayLabel: humanizeStatus(st) || "Prêt",
    countsAsCompleted: true,
  };
}

function followUpKind(sheet: FollowUpLike | null): {
  kind: PreparationStepKind;
  displayLabel: string;
  countsAsCompleted: boolean;
} {
  if (!sheet) {
    return {
      kind: "ABSENT",
      displayLabel: "À créer",
      countsAsCompleted: false,
    };
  }
  return {
    kind: "READY",
    displayLabel: humanizeStatus(sheet.status) || "Prêt",
    countsAsCompleted: true,
  };
}

/**
 * Prochaine action — priorités uniques liste ↔ fiche.
 *
 * 1. Responsable manquant
 * 2. Visite à terminer / compléter / planifier
 * 3. Métré absent / à valider
 * 4. Devis absent / brouillon / à revalider
 * 5. Planning absent / à mettre à jour
 * 6. Suivi / CR / Notice absents
 * 7. Pièces manquantes
 * 8. Démarrage / continuer suivi
 */
export function computeProjectNextAction(input: {
  state: Omit<ProjectPreparationState, "nextAction">;
  missingDocumentsCount?: number;
  chantierStatus?: string | null;
  projectId: string;
}): ProjectNextAction {
  const { state, missingDocumentsCount = 0, chantierStatus, projectId } =
    input;

  if (!state.hasResponsible) {
    return {
      code: "ASSIGN_MANAGER",
      label: "Affecter un responsable",
      href: null,
      stepId: "responsable",
    };
  }

  if (state.visit.applicable) {
    if (state.visit.displayLabel === "Relevé en cours") {
      return {
        code: "FINISH_VISIT",
        label: "Terminer la visite",
        href: state.visitId
          ? `/dashboard/visites-metres/${state.visitId}`
          : `/dashboard/visites-metres?projectId=${encodeURIComponent(projectId)}`,
        stepId: "visite",
      };
    }
    if (state.visit.displayLabel === "À compléter") {
      return {
        code: "COMPLETE_VISIT",
        label: "Compléter la visite",
        href: state.visitId
          ? `/dashboard/visites-metres/${state.visitId}`
          : null,
        stepId: "visite",
      };
    }
  }

  if (state.takeoff.kind === "ABSENT") {
    return {
      code: "PREPARE_TAKEOFF",
      label: "Préparer le métré",
      href: null,
      stepId: "metre",
    };
  }
  if (state.takeoff.kind === "NEEDS_VALIDATION" || state.takeoff.kind === "IN_PROGRESS") {
    return {
      code: "VALIDATE_TAKEOFF",
      label: "Finaliser le métré",
      href: null,
      stepId: "metre",
    };
  }

  if (state.quote.kind === "ABSENT") {
    return {
      code: "PREPARE_QUOTE",
      label: "Préparer le devis",
      href: null,
      stepId: "devis",
    };
  }
  if (state.quote.kind === "NEEDS_REVALIDATION") {
    return {
      code: "REVALIDATE_QUOTE",
      label: "Revalider le devis",
      href: null,
      stepId: "devis",
    };
  }
  if (state.quote.kind === "IN_PROGRESS") {
    return {
      code: "FINALIZE_QUOTE",
      label: "Finaliser le devis",
      href: null,
      stepId: "devis",
    };
  }

  if (state.planning.kind === "ABSENT") {
    return {
      code: "PREPARE_PLANNING",
      label: "Préparer le planning",
      href: null,
      stepId: "planning",
    };
  }
  if (
    state.planning.kind === "ACTION_REQUIRED" ||
    state.planning.kind === "NEEDS_VALIDATION" ||
    state.planning.kind === "IN_PROGRESS"
  ) {
    return {
      code: "UPDATE_PLANNING",
      label: "Mettre à jour le planning",
      href: null,
      stepId: "planning",
    };
  }

  if (state.visit.applicable) {
    if (state.visit.displayLabel === "À planifier" || state.visit.kind === "ABSENT") {
      return {
        code: "PLAN_VISIT",
        label: "Planifier la visite",
        href: `/dashboard/visites-metres?projectId=${encodeURIComponent(projectId)}`,
        stepId: "visite",
      };
    }
    if (state.visit.displayLabel === "Planifiée") {
      return {
        code: "DO_VISIT",
        label: "Réaliser la visite",
        href: state.visitId
          ? `/dashboard/visites-metres/${state.visitId}`
          : null,
        stepId: "visite",
      };
    }
  }

  if (state.followUp.kind === "ABSENT") {
    return {
      code: "CREATE_FOLLOW_UP",
      label: "Créer le suivi de chantier",
      href: null,
      stepId: "suivi",
    };
  }
  if (state.report.kind === "ABSENT") {
    return {
      code: "CREATE_REPORT",
      label: "Générer le compte rendu",
      href: `/dashboard/projets/${projectId}/documents-chantier`,
      stepId: "compte_rendu",
    };
  }
  if (state.notice.kind === "ABSENT") {
    return {
      code: "CREATE_NOTICE",
      label: "Générer la notice explicative",
      href: `/dashboard/projets/${projectId}/documents-chantier`,
      stepId: "notice",
    };
  }

  if (missingDocumentsCount > 0) {
    return {
      code: "MISSING_DOCUMENTS",
      label: `${missingDocumentsCount} pièce${missingDocumentsCount > 1 ? "s" : ""} manquante${missingDocumentsCount > 1 ? "s" : ""}`,
      href: `/dashboard/projets/manquants?chantier=${encodeURIComponent(projectId)}`,
      stepId: "documents",
    };
  }

  if (chantierStatus === "ETUDE") {
    return {
      code: "PREPARE_START",
      label: "Préparer le démarrage du chantier",
      href: null,
      stepId: "planning",
    };
  }

  return {
    code: "CONTINUE_FOLLOW_UP",
    label: "Chantier prêt — poursuivre le suivi",
    href: null,
    stepId: "suivi",
  };
}

/** Moteur unique — données déjà chargées (batch portfolio ou workspace). */
export function computeProjectPreparationState(input: {
  projectId: string;
  title?: string | null;
  siteAddress?: string | null;
  siteCity?: string | null;
  chantierStatus?: string | null;
  hasResponsible: boolean;
  missingDocumentsCount?: number;

  visits: PreparationVisit[];
  studies: PreparationStudy[];
  scopes: ScopeLike[];
  quotes: PreparationQuote[];
  plans: PreparationPlan[];
  followUps?: FollowUpLike[];
  reports?: SiteDocLike[];
  notices?: SiteDocLike[];

  quoteSyncByQuoteId?: Record<string, PreparationQuoteSync>;
  studyVersionById?: Record<string, number | null>;
}): ProjectPreparationState {
  const quote = resolveProjectQuote({
    quotes: input.quotes,
    scopes: input.scopes,
  });
  const visit = resolveProjectVisit({
    projectId: input.projectId,
    siteAddress: input.siteAddress,
    siteCity: input.siteCity,
    title: input.title,
    quotes: input.quotes,
    visits: input.visits,
  });
  const studyRef =
    resolvePrepStudyForWorkspace({
      studies: input.studies,
      scopes: input.scopes,
    }) ?? null;
  const studyFull = studyRef
    ? input.studies.find((s) => s.id === studyRef.id) ?? null
    : null;
  const plan =
    resolvePrepSchedulePlanForWorkspace({
      plans: input.plans,
      scopes: input.scopes,
      study: studyRef,
    }) ?? null;

  const hasPlanSource = input.studies.some((s) =>
    studyHasPlanSource(s.sourcesJson),
  );
  const entryMode: PreparationEntryMode =
    visit && hasPlanSource
      ? "mixte"
      : visit
        ? "visite"
        : hasPlanSource
          ? "plan"
          : quote
            ? "devis"
            : "vide";

  const archivedOnly =
    input.plans.length > 0 &&
    input.plans.every((p) => p.status === "ARCHIVED");

  const quoteSync = quote
    ? input.quoteSyncByQuoteId?.[quote.id] ?? null
    : null;
  const planStudyVersion =
    plan?.studyId != null
      ? input.studyVersionById?.[plan.studyId] ??
        studyFull?.version ??
        null
      : studyFull?.version ?? null;

  const core = evaluateCorePreparationTriple({
    study: studyFull
      ? {
          id: studyFull.id,
          dossierStatus: studyFull.dossierStatus,
          lineCount: studyFull.lineCount,
          version: studyFull.version ?? null,
        }
      : null,
    quote: quote ? { id: quote.id, status: quote.status } : null,
    quoteSync: quoteSync
      ? {
          hasMetreProvenance: quoteSync.hasMetreProvenance,
          currentStudyVersion: quoteSync.currentStudyVersion,
          transferStudyVersion: quoteSync.transferStudyVersion,
          hasSignificantQuantityDiffs:
            quoteSync.hasSignificantQuantityDiffs,
        }
      : quote
        ? {
            hasMetreProvenance: false,
            currentStudyVersion: null,
            transferStudyVersion: null,
          }
        : null,
    plan: plan
      ? {
          id: plan.id,
          status: plan.status,
          studyId: plan.studyId,
          studyVersionAtGeneration: plan.studyVersionAtGeneration ?? null,
          startDateLabel: plan.startDateLabel ?? null,
        }
      : null,
    planStudyVersion,
    archivedOnly: archivedOnly && plan?.status === "ARCHIVED",
  });

  const visitReq = entryMode !== "plan";
  const v = visitKind(visit, visitReq);
  const visitStep: PreparationStep = {
    id: "visite",
    label: "Visite",
    kind: v.kind,
    displayLabel: v.displayLabel,
    secondaryLabel: null,
    applicable: v.applicable,
    countsAsCompleted:
      v.applicable && (v.kind === "READY" || v.kind === "DONE"),
    hrefHint: visit
      ? `/dashboard/visites-metres/${visit.id}`
      : `/dashboard/visites-metres?projectId=${encodeURIComponent(input.projectId)}`,
  };

  const metreKind: PreparationStepKind =
    core.metre.kind === "ABSENT"
      ? "ABSENT"
      : core.metre.kind === "VALIDATED"
        ? "DONE"
        : core.metre.kind === "NEEDS_VALIDATION"
          ? "NEEDS_VALIDATION"
          : "IN_PROGRESS";
  const takeoffStep: PreparationStep = {
    id: "metre",
    label: "Métré",
    kind: metreKind,
    displayLabel: core.metre.displayLabel,
    secondaryLabel: null,
    applicable: true,
    countsAsCompleted: metreKind === "DONE",
    hrefHint: null,
  };

  let quoteKind: PreparationStepKind = "ABSENT";
  if (!core.devis.exists) quoteKind = "ABSENT";
  else if (core.devis.needsRevalidation) quoteKind = "NEEDS_REVALIDATION";
  else if (core.devis.syncState === "A_VERIFIER" && core.devis.exists)
    quoteKind = "ACTION_REQUIRED";
  else if (core.devis.workflowReady) quoteKind = "DONE";
  else quoteKind = "IN_PROGRESS";

  const quoteStep: PreparationStep = {
    id: "devis",
    label: "Devis",
    kind: quoteKind,
    displayLabel: core.devis.displayLabel,
    secondaryLabel: null,
    applicable: true,
    countsAsCompleted: quoteKind === "DONE",
    hrefHint: null,
  };

  let planningKind: PreparationStepKind = "ABSENT";
  if (!core.planning.exists) planningKind = "ABSENT";
  else if (core.planning.needsUpdate) planningKind = "ACTION_REQUIRED";
  else if (core.planning.syncState === "A_VERIFIER")
    planningKind = "ACTION_REQUIRED";
  else if (core.planning.displayLabel === "En préparation")
    planningKind = "IN_PROGRESS";
  else if (core.planning.syncState === "A_JOUR") planningKind = "DONE";
  else planningKind = "IN_PROGRESS";

  const planningStep: PreparationStep = {
    id: "planning",
    label: "Planning",
    kind: planningKind,
    displayLabel: core.planning.displayLabel,
    secondaryLabel: core.planning.secondaryLabel,
    applicable: true,
    countsAsCompleted: planningKind === "DONE",
    hrefHint: null,
  };

  const fu = followUpKind(input.followUps?.[0] ?? null);
  const followUpStep: PreparationStep = {
    id: "suivi",
    label: "Suivi",
    kind: fu.kind,
    displayLabel: fu.displayLabel,
    secondaryLabel: null,
    applicable: true,
    countsAsCompleted: fu.countsAsCompleted,
    hrefHint: null,
  };

  const reportDoc =
    (input.reports ?? []).find((d) => d.kind === "COMPTE_RENDU") ??
    (input.reports ?? [])[0] ??
    null;
  const rp = docKind(reportDoc, "À générer");
  const reportStep: PreparationStep = {
    id: "compte_rendu",
    label: "Compte rendu",
    kind: rp.kind,
    displayLabel: rp.displayLabel,
    secondaryLabel: null,
    applicable: true,
    countsAsCompleted: rp.countsAsCompleted,
    hrefHint: `/dashboard/projets/${input.projectId}/documents-chantier`,
  };

  const noticeDoc =
    (input.notices ?? []).find((d) => d.kind === "NOTICE") ??
    (input.notices ?? [])[0] ??
    null;
  const nt = docKind(noticeDoc, "À générer");
  const noticeStep: PreparationStep = {
    id: "notice",
    label: "Notice",
    kind: nt.kind,
    displayLabel: nt.displayLabel,
    secondaryLabel: null,
    applicable: true,
    countsAsCompleted: nt.countsAsCompleted,
    hrefHint: `/dashboard/projets/${input.projectId}/documents-chantier`,
  };

  const steps = [
    visitStep,
    takeoffStep,
    quoteStep,
    planningStep,
    followUpStep,
    reportStep,
    noticeStep,
  ];
  const applicable = steps.filter((s) => s.applicable);
  const completedCount = applicable.filter((s) => s.countsAsCompleted).length;
  const totalCount = Math.max(applicable.length, 1);
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const partial = {
    projectId: input.projectId,
    entryMode,
    visitId: visit?.id ?? null,
    hasResponsible: input.hasResponsible,
    steps,
    visit: visitStep,
    takeoff: takeoffStep,
    quote: quoteStep,
    planning: planningStep,
    followUp: followUpStep,
    report: reportStep,
    notice: noticeStep,
    core: {
      metre: core.metre,
      devis: core.devis,
      planning: core.planning,
    },
    completedCount,
    totalCount,
    progressPercent,
  };

  const nextAction = computeProjectNextAction({
    state: partial,
    missingDocumentsCount: input.missingDocumentsCount ?? 0,
    chantierStatus: input.chantierStatus,
    projectId: input.projectId,
  });

  return { ...partial, nextAction };
}

/** Adapter modules legacy (4 chips liste) depuis l’état unifié. */
export function preparationModulesFromState(
  state: ProjectPreparationState,
): Array<{
  key: "visite" | "metre" | "devis" | "planning";
  label: string;
  state: "done" | "progress" | "todo" | "na";
  stateLabel: string;
  applicable: boolean;
}> {
  const toBucket = (
    kind: PreparationStepKind,
    applicable: boolean,
  ): "done" | "progress" | "todo" | "na" => {
    if (!applicable || kind === "NOT_APPLICABLE") return "na";
    if (kind === "DONE" || kind === "READY") return "done";
    if (kind === "ABSENT") return "todo";
    return "progress";
  };
  return [
    {
      key: "visite",
      label: "Visite",
      state: toBucket(state.visit.kind, state.visit.applicable),
      stateLabel: state.visit.displayLabel,
      applicable: state.visit.applicable,
    },
    {
      key: "metre",
      label: "Métré",
      state: toBucket(state.takeoff.kind, true),
      stateLabel: state.takeoff.displayLabel,
      applicable: true,
    },
    {
      key: "devis",
      label: "Devis",
      state: toBucket(state.quote.kind, true),
      stateLabel: state.quote.displayLabel,
      applicable: true,
    },
    {
      key: "planning",
      label: "Planning",
      state: toBucket(state.planning.kind, true),
      stateLabel: state.planning.displayLabel,
      applicable: true,
    },
  ];
}
