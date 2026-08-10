/**
 * FICHES-SUIVI-V2B — phases visuelles (pas un 2e moteur de statut).
 * Regroupe les WorkflowStep pour lecture novice.
 */

export type FollowUpPhaseId = "demarrage" | "preparation" | "execution" | "finalisation";

export type FollowUpPhase = {
  id: FollowUpPhaseId;
  label: string;
};

export const FOLLOW_UP_PHASES: FollowUpPhase[] = [
  { id: "demarrage", label: "Démarrage" },
  { id: "preparation", label: "Préparation" },
  { id: "execution", label: "Exécution" },
  { id: "finalisation", label: "Finalisation" },
];

const PHASE_BY_STATUS: Record<string, FollowUpPhaseId> = {
  NOUVEAU: "demarrage",
  A_ANALYSER: "demarrage",
  A_PLANIFIER: "demarrage",
  PLANIFIE: "demarrage",
  INTERVENTION_PREVUE: "preparation",
  COMMANDE_FOURNISSEUR: "preparation",
  COMMANDE_PASSEE: "preparation",
  ATTENTE_FOURNISSEUR: "preparation",
  EN_COURS: "execution",
  TRAVAUX_TERMINES: "execution",
  CR_A_RECUPERER: "execution",
  AVENANT: "finalisation",
  A_FACTURER: "finalisation",
  FACTURE: "finalisation",
  ATTENTE_REGLEMENT: "finalisation",
  TERMINE: "finalisation",
};

export function phaseForStatus(statusKey: string): FollowUpPhase | null {
  const id = PHASE_BY_STATUS[statusKey];
  if (!id) return null;
  return FOLLOW_UP_PHASES.find((p) => p.id === id) ?? null;
}

/** True si cette colonne est la première visible de sa phase. */
export function isPhaseStart(
  statusKey: string,
  visibleStatusKeys: string[],
): boolean {
  const phase = phaseForStatus(statusKey);
  if (!phase) return false;
  const first = visibleStatusKeys.find((k) => phaseForStatus(k)?.id === phase.id);
  return first === statusKey;
}
