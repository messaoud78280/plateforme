/**
 * Risque contractuel — indicateur d’aide au pilotage, distinct de la santé opérationnelle.
 * Ne constitue pas une analyse juridique.
 */

export type ContractRiskLabel = "FAIBLE" | "MODERE" | "ELEVE" | "CRITIQUE";

export type ContractRiskFactor = {
  code: string;
  label: string;
  weight: number;
  count: number;
};

export type ContractRiskResult = {
  score: number;
  label: ContractRiskLabel;
  factors: ContractRiskFactor[];
  reasons: string[];
  recommendations: string[];
  disclaimer: string;
};

export const CONTRACT_RISK_LABELS: Record<ContractRiskLabel, string> = {
  FAIBLE: "Faible",
  MODERE: "Modéré",
  ELEVE: "Élevé",
  CRITIQUE: "Critique",
};

export const CONTRACT_RISK_COLORS: Record<ContractRiskLabel, string> = {
  FAIBLE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  MODERE: "bg-amber-50 text-amber-900 ring-amber-200",
  ELEVE: "bg-orange-50 text-orange-900 ring-orange-200",
  CRITIQUE: "bg-red-50 text-red-800 ring-red-200",
};

export const CONTRACT_RISK_DISCLAIMER =
  "Indicateur d’aide au pilotage. Vérification contractuelle humaine requise.";

export type ContractRiskInput = {
  tsWithoutWrittenValidation: number;
  overdueCriticalObligations: number;
  openCriticalBlockers: number;
  contestedSituations: number;
  incompleteSubcontractors: number;
  overdueSensitiveDeadlines: number;
  openNonConformitiesCritical: number;
  openDelayEvents: number;
  doeMissingNearReception: number;
  unconfirmedAssumptions: number;
};

export function computeContractRisk(input: ContractRiskInput): ContractRiskResult {
  const factors: ContractRiskFactor[] = [];
  let score = 0;

  const push = (code: string, label: string, weight: number, count: number) => {
    if (count <= 0) return;
    const w = weight * Math.min(count, 5);
    factors.push({ code, label, weight: w, count });
    score += w;
  };

  push("ts", "Travaux supplémentaires sans validation écrite", 18, input.tsWithoutWrittenValidation);
  push("obl", "Obligations critiques en retard", 14, input.overdueCriticalObligations);
  push("blk", "Blocages / décisions critiques ouvertes", 16, input.openCriticalBlockers);
  push("sit", "Situations contestées", 12, input.contestedSituations);
  push("st", "Sous-traitants dossier incomplet / non agréé", 10, input.incompleteSubcontractors);
  push("dl", "Échéances sensibles dépassées", 15, input.overdueSensitiveDeadlines);
  push("nc", "Non-conformités critiques ouvertes", 12, input.openNonConformitiesCritical);
  push("delay", "Retards non formalisés / ouverts", 10, input.openDelayEvents);
  push("doe", "DOE à risque près de la réception", 10, input.doeMissingNearReception);
  push("hyp", "Hypothèses d’étude non vérifiées", 6, input.unconfirmedAssumptions);

  score = Math.min(100, score);

  let label: ContractRiskLabel = "FAIBLE";
  if (score >= 70) label = "CRITIQUE";
  else if (score >= 45) label = "ELEVE";
  else if (score >= 20) label = "MODERE";

  const reasons = factors
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4)
    .map((f) => `${f.count} × ${f.label}`);

  if (reasons.length === 0) {
    reasons.push("Aucun facteur de risque contractuel majeur détecté sur les données enregistrées");
  }

  const recommendations: string[] = [];
  if (input.tsWithoutWrittenValidation > 0) {
    recommendations.push("Obtenir une validation écrite pour chaque TS démarré sans accord formalisé.");
  }
  if (input.overdueSensitiveDeadlines > 0) {
    recommendations.push("Traiter ou documenter les échéances sensibles dépassées (vérification humaine).");
  }
  if (input.openCriticalBlockers > 0) {
    recommendations.push("Formaliser les décisions attendues et relancer les destinataires externes.");
  }
  if (input.doeMissingNearReception > 0) {
    recommendations.push("Anticiper le DOE : pièces manquantes avant réception.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Maintenir le suivi documentaire et la traçabilité des décisions.");
  }

  return {
    score,
    label,
    factors,
    reasons,
    recommendations: recommendations.slice(0, 4),
    disclaimer: CONTRACT_RISK_DISCLAIMER,
  };
}
