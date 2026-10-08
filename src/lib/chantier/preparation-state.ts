/**
 * État de préparation d'un chantier — une seule règle pour la liste,
 * la fiche projet et le pourcentage.
 * Lecture seule : ne rattache rien, ne crée rien.
 *
 * Le calcul métier 7 étapes + progression + nextAction est délégué à
 * `computeProjectPreparationState` (source unique).
 */
import type { CorePreparationTriple } from "@/lib/chantier/core-preparation-state";
import type { ScopeLike } from "@/lib/chantier/resolve-workspace-entities";
import {
  computeProjectPreparationState,
  preparationModulesFromState,
  type FollowUpLike,
  type ProjectNextActionCode,
  type ProjectPreparationState,
  type SiteDocLike,
} from "@/lib/chantier/project-preparation-state";
import {
  resolveProjectQuote,
  resolveProjectVisit,
  studyHasPlanSource,
  visitSharesSite,
  type PreparationEntryMode,
  type PreparationPlan,
  type PreparationQuote,
  type PreparationQuoteSync,
  type PreparationStudy,
  type PreparationVisit,
} from "@/lib/chantier/preparation-inputs";

export type {
  PreparationEntryMode,
  PreparationPlan,
  PreparationQuote,
  PreparationQuoteSync,
  PreparationStudy,
  PreparationVisit,
};
export {
  resolveProjectQuote,
  resolveProjectVisit,
  studyHasPlanSource,
  visitSharesSite,
};

export type PreparationModuleState = "done" | "progress" | "todo" | "na";

export type PreparationModuleKey = "visite" | "metre" | "devis" | "planning";

export type PreparationModule = {
  key: PreparationModuleKey;
  label: string;
  state: PreparationModuleState;
  stateLabel: string;
  applicable: boolean;
};

export type PreparationSnapshot = {
  entryMode: PreparationEntryMode;
  modules: PreparationModule[];
  progressPercent: number;
  /** Libellé next action (compat UI liste). */
  nextAction: string | null;
  nextActionCode: ProjectNextActionCode;
  visitId: string | null;
  /** États métier communs (métré/devis/planning) — CTX-03/04. */
  core: CorePreparationTriple;
  completedCount: number;
  totalCount: number;
  /** État métier complet (7 étapes). */
  preparation: ProjectPreparationState;
};

/**
 * Snapshot liste/fiche — délègue au moteur unique
 * `computeProjectPreparationState`.
 */
export function buildPreparationSnapshot(input: {
  projectId: string;
  title?: string | null;
  siteAddress?: string | null;
  siteCity?: string | null;
  chantierStatus?: string | null;
  hasResponsible?: boolean;
  missingDocumentsCount?: number;
  visits: PreparationVisit[];
  studies: PreparationStudy[];
  scopes: ScopeLike[];
  quotes: PreparationQuote[];
  plans: PreparationPlan[];
  followUps?: FollowUpLike[];
  reports?: SiteDocLike[];
  notices?: SiteDocLike[];
  activeSupplyNeedCount?: number;
  quoteSyncByQuoteId?: Record<string, PreparationQuoteSync>;
  studyVersionById?: Record<string, number | null>;
}): PreparationSnapshot {
  const preparation = computeProjectPreparationState({
    projectId: input.projectId,
    title: input.title,
    siteAddress: input.siteAddress,
    siteCity: input.siteCity,
    chantierStatus: input.chantierStatus,
    hasResponsible: input.hasResponsible ?? true,
    missingDocumentsCount: input.missingDocumentsCount ?? 0,
    visits: input.visits,
    studies: input.studies,
    scopes: input.scopes,
    quotes: input.quotes,
    plans: input.plans,
    followUps: input.followUps,
    reports: input.reports,
    notices: input.notices,
    activeSupplyNeedCount: input.activeSupplyNeedCount,
    quoteSyncByQuoteId: input.quoteSyncByQuoteId,
    studyVersionById: input.studyVersionById,
  });

  return {
    entryMode: preparation.entryMode,
    modules: preparationModulesFromState(preparation),
    progressPercent: preparation.progressPercent,
    nextAction: preparation.nextAction.label,
    nextActionCode: preparation.nextAction.code,
    visitId: preparation.visitId,
    core: preparation.core,
    completedCount: preparation.completedCount,
    totalCount: preparation.totalCount,
    preparation,
  };
}
