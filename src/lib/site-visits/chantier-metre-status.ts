/**
 * Affichage Visites : relevés terrain (SiteVisitMeasurement)
 * distincts du métré chantier (PrepStudy).
 * La résolution d'étude est celle du dossier — aucune autre règle.
 */
import {
  resolvePrepStudyForWorkspace,
  type ScopeLike,
  type StudyLike,
} from "@/lib/chantier/resolve-workspace-entities";

export type ChantierMetreStudy = StudyLike & {
  lineCount: number;
  /** Lignes dont la quantité a été validée. */
  validatedLineCount: number;
  dossierStatus: string | null;
};

export type VisitChantierMetreStatus = {
  /** true si des SiteVisitMeasurement existent. */
  hasMeasurements: boolean;
  releveLabel: string;
  metreLabel: string;
  metreHref: string | null;
  studyId: string | null;
  lineCount: number;
};

function posteLabel(count: number): string {
  return `${count} poste${count > 1 ? "s" : ""}`;
}

export function isChantierMetreValidated(study: {
  lineCount: number;
  validatedLineCount: number;
  dossierStatus: string | null;
}): boolean {
  if (study.dossierStatus === "PRO_VALIDE") return true;
  return study.lineCount > 0 && study.validatedLineCount === study.lineCount;
}

export function metreLabelForStudy(
  study: {
    lineCount: number;
    validatedLineCount: number;
    dossierStatus: string | null;
  } | null,
): string {
  if (!study) return "Métré chantier non créé";
  if (study.lineCount <= 0) return "Métré chantier disponible";
  const postes = posteLabel(study.lineCount);
  if (isChantierMetreValidated(study)) return `Métré validé — ${postes}`;
  return `Métré — ${postes}`;
}

export function releveLabelForVisit(input: {
  measurementLabels: string[];
  hasStudy: boolean;
}): string {
  if (input.measurementLabels.length > 0) return input.measurementLabels.join(" · ");
  if (input.hasStudy) return "Aucun relevé terrain";
  return "Aucun relevé quantitatif";
}

/**
 * Choisit l'étude du projet avec resolvePrepStudyForWorkspace,
 * puis produit les deux libellés (relevé / métré).
 */
export function buildVisitChantierMetreStatus(input: {
  measurementLabels: string[];
  studies: ChantierMetreStudy[];
  scopes: ScopeLike[];
}): VisitChantierMetreStatus {
  const picked = resolvePrepStudyForWorkspace({
    studies: input.studies,
    scopes: input.scopes,
  });
  const study = picked
    ? input.studies.find((s) => s.id === picked.id) ?? null
    : null;
  const hasMeasurements = input.measurementLabels.length > 0;
  return {
    hasMeasurements,
    releveLabel: releveLabelForVisit({
      measurementLabels: input.measurementLabels,
      hasStudy: !!study,
    }),
    metreLabel: metreLabelForStudy(study),
    metreHref: study ? `/dashboard/visites-metres/etudes/${study.id}` : null,
    studyId: study?.id ?? null,
    lineCount: study?.lineCount ?? 0,
  };
}

/** Recolle les relevés de la visite sur un statut déjà résolu pour le projet. */
export function applyVisitMeasurements(
  status: VisitChantierMetreStatus,
  measurementLabels: string[],
): VisitChantierMetreStatus {
  return {
    ...status,
    hasMeasurements: measurementLabels.length > 0,
    releveLabel: releveLabelForVisit({
      measurementLabels,
      hasStudy: status.studyId != null,
    }),
  };
}
