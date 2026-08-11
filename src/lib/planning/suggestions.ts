/**
 * PLANNING-V2C — suggestions d'affectation déterministes (pas d'IA / LLM).
 * Scores explicables, testables, basés uniquement sur données BeWork.
 */
import type { AgendaEventDTO } from "@/components/agenda/agenda-types";
import { findAgendaConflicts } from "@/lib/agenda/conflicts";
import { isTerrainPlanifiableProfile } from "@/lib/planning/board";

export type PlanningProjectHint = {
  id: string;
  title: string;
  assignedToId?: string | null;
  /** Users with ProjectAccess on this project */
  accessUserIds?: string[];
  /** Conducteur pilotage travaux (si présent) */
  conducteurId?: string | null;
};

export type PlanningSuggestionCandidate = {
  id: string;
  name: string;
  email: string;
  permissionProfile?: string | null;
  jobTitle?: string | null;
};

export type PlanningSuggestionReason =
  | "conducteur_pilotage"
  | "assigne_projet"
  | "acces_projet"
  | "role_terrain"
  | "deja_sur_chantier"
  | "aucun_conflit"
  | "conflit_horaire"
  | "role_moins_adapte";

export const PLANNING_SUGGESTION_WEIGHTS = {
  conducteur_pilotage: 40,
  assigne_projet: 35,
  acces_projet: 20,
  role_terrain: 20,
  deja_sur_chantier: 15,
  aucun_conflit: 15,
  conflit_horaire: -1000, // exclusion soft (score bas, flag)
  role_moins_adapte: -10,
} as const;

export type PlanningAssigneeSuggestion = {
  userId: string;
  name: string;
  roleLabel: string;
  score: number;
  reasons: PlanningSuggestionReason[];
  reasonLabels: string[];
  hasConflict: boolean;
  suggested: boolean;
};

const REASON_LABELS: Record<PlanningSuggestionReason, string> = {
  conducteur_pilotage: "Conducteur du chantier",
  assigne_projet: "Assigné au chantier",
  acces_projet: "Accès chantier",
  role_terrain: "Rôle terrain",
  deja_sur_chantier: "Déjà affecté sur ce chantier",
  aucun_conflit: "Aucun conflit",
  conflit_horaire: "Conflit horaire",
  role_moins_adapte: "Rôle moins adapté",
};

function roleLabelFor(c: PlanningSuggestionCandidate): string {
  if (c.jobTitle?.trim()) return c.jobTitle.trim();
  switch (c.permissionProfile) {
    case "DIRECTION":
      return "Direction";
    case "CONDUCTEUR":
      return "Conducteur de travaux";
    case "ADMINISTRATIF":
      return "Administratif";
    case "CHEF_CHANTIER":
      return "Chef de chantier";
    default:
      return "Équipe";
  }
}

/**
 * Classe les collaborateurs pour un AgendaEvent à affecter.
 * Exclut les comptes non fournis (caller filtre déjà isPlanifiable).
 */
export function evaluatePlanningAssigneeSuggestions(params: {
  event: Pick<AgendaEventDTO, "id" | "startAt" | "endAt" | "projectId" | "responsibleId">;
  candidates: PlanningSuggestionCandidate[];
  allEvents: AgendaEventDTO[];
  projectHint?: PlanningProjectHint | null;
}): PlanningAssigneeSuggestion[] {
  const { event, candidates, allEvents, projectHint } = params;
  const projectId = event.projectId ?? projectHint?.id ?? null;
  const accessSet = new Set(projectHint?.accessUserIds ?? []);

  const scored: PlanningAssigneeSuggestion[] = candidates.map((c) => {
    const reasons: PlanningSuggestionReason[] = [];
    let score = 0;

    if (projectHint?.conducteurId && c.id === projectHint.conducteurId) {
      reasons.push("conducteur_pilotage");
      score += PLANNING_SUGGESTION_WEIGHTS.conducteur_pilotage;
    }
    if (projectHint?.assignedToId && c.id === projectHint.assignedToId) {
      reasons.push("assigne_projet");
      score += PLANNING_SUGGESTION_WEIGHTS.assigne_projet;
    }
    if (accessSet.has(c.id)) {
      reasons.push("acces_projet");
      score += PLANNING_SUGGESTION_WEIGHTS.acces_projet;
    }
    if (isTerrainPlanifiableProfile(c.permissionProfile)) {
      reasons.push("role_terrain");
      score += PLANNING_SUGGESTION_WEIGHTS.role_terrain;
    } else if (
      c.permissionProfile === "ADMINISTRATIF" ||
      c.permissionProfile === "DIRECTION"
    ) {
      reasons.push("role_moins_adapte");
      score += PLANNING_SUGGESTION_WEIGHTS.role_moins_adapte;
    }

    if (projectId) {
      const already = allEvents.some(
        (e) =>
          e.projectId === projectId &&
          e.responsibleId === c.id &&
          e.id !== event.id,
      );
      if (already) {
        reasons.push("deja_sur_chantier");
        score += PLANNING_SUGGESTION_WEIGHTS.deja_sur_chantier;
      }
    }

    const conflicts = findAgendaConflicts(
      {
        id: event.id.includes("__") ? event.id.split("__")[0] : event.id,
        startAt: event.startAt,
        endAt: event.endAt,
        responsibleId: c.id,
        projectId: event.projectId,
      },
      allEvents,
    );
    const hasConflict = conflicts.length > 0;
    if (hasConflict) {
      reasons.push("conflit_horaire");
      score += PLANNING_SUGGESTION_WEIGHTS.conflit_horaire;
    } else {
      reasons.push("aucun_conflit");
      score += PLANNING_SUGGESTION_WEIGHTS.aucun_conflit;
    }

    return {
      userId: c.id,
      name: c.name,
      roleLabel: roleLabelFor(c),
      score,
      reasons,
      reasonLabels: reasons
        .filter((r) => r !== "role_moins_adapte" || reasons.length <= 2)
        .map((r) => REASON_LABELS[r]),
      hasConflict,
      suggested: false,
    };
  });

  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "fr"));
  if (scored[0] && scored[0].score > 0 && !scored[0].hasConflict) {
    scored[0]!.suggested = true;
  } else if (scored[0] && scored[0].score > PLANNING_SUGGESTION_WEIGHTS.conflit_horaire) {
    // best non-excluded even with conflict — still mark suggested if clearly ahead
    const best = scored[0]!;
    const second = scored[1];
    if (!second || best.score - second.score >= 15) {
      best.suggested = true;
    }
  }

  return scored;
}

export function planningSuggestionReasonLabel(r: PlanningSuggestionReason): string {
  return REASON_LABELS[r];
}
