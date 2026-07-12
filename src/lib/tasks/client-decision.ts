/**
 * Décision client après transmission du livrable / compte rendu.
 * Ne remplace pas TaskStatus (workflow interne BeWork).
 */

export const CLIENT_DECISIONS = [
  "EN_ATTENTE_CLIENT",
  "ACCEPTE",
  "REFUSE",
  "RESERVES",
] as const;

export type ClientDecision = (typeof CLIENT_DECISIONS)[number];

export const CLIENT_DECISION_LABELS: Record<ClientDecision, string> = {
  EN_ATTENTE_CLIENT: "À valider par le client",
  ACCEPTE: "Accepté par le client",
  REFUSE: "Refusé — correction demandée",
  RESERVES: "Accepté avec réserves",
};

export function isClientDecision(value: unknown): value is ClientDecision {
  return typeof value === "string" && (CLIENT_DECISIONS as readonly string[]).includes(value);
}

export function clientDecisionRequiresNote(decision: ClientDecision): boolean {
  return decision === "REFUSE" || decision === "RESERVES";
}
