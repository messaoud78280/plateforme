import {
  isActionOpen,
  isDocMissing,
  isOverdue,
  isVisaPending,
} from "./calculations";

export type HealthLabel = "CONFORME" | "A_SURVEILLER" | "EN_DIFFICULTE" | "CRITIQUE" | "TERMINE";

export type HealthInput = {
  status: string;
  overdueActions: number;
  criticalObligationsOverdue: number;
  missingDocs: number;
  visasOverdue: number;
  openBlockersCritical: number;
  openBlockers: number;
  tsWithoutValidation: number;
  doeMissing: number;
  blockedMilestones: number;
};

export type HealthResult = {
  score: number;
  label: HealthLabel;
  reasons: string[];
};

export const HEALTH_LABELS: Record<HealthLabel, string> = {
  CONFORME: "Conforme",
  A_SURVEILLER: "À surveiller",
  EN_DIFFICULTE: "En difficulté",
  CRITIQUE: "Critique",
  TERMINE: "Terminé",
};

export const HEALTH_COLORS: Record<HealthLabel, string> = {
  CONFORME: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  A_SURVEILLER: "bg-amber-50 text-amber-900 ring-amber-200",
  EN_DIFFICULTE: "bg-orange-50 text-orange-900 ring-orange-200",
  CRITIQUE: "bg-red-50 text-red-800 ring-red-200",
  TERMINE: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const HEALTH_BAR: Record<HealthLabel, string> = {
  CONFORME: "bg-emerald-500",
  A_SURVEILLER: "bg-amber-500",
  EN_DIFFICULTE: "bg-orange-500",
  CRITIQUE: "bg-red-600",
  TERMINE: "bg-slate-400",
};

/** Règles transparentes — score 100, pénalités cumulées, label dérivé. */
export function computeHealth(input: HealthInput): HealthResult {
  if (input.status === "TERMINE" || input.status === "ARCHIVE") {
    return { score: 100, label: "TERMINE", reasons: ["Chantier terminé ou archivé"] };
  }

  let score = 100;
  const reasons: string[] = [];

  if (input.openBlockersCritical > 0) {
    score -= 35;
    reasons.push(`${input.openBlockersCritical} blocage(s) critique(s)`);
  } else if (input.openBlockers > 0) {
    score -= 15;
    reasons.push(`${input.openBlockers} blocage(s) ouvert(s)`);
  }

  if (input.criticalObligationsOverdue > 0) {
    score -= 20;
    reasons.push(`${input.criticalObligationsOverdue} obligation(s) critique(s) en retard`);
  }

  if (input.overdueActions > 0) {
    score -= Math.min(25, input.overdueActions * 5);
    reasons.push(`${input.overdueActions} action(s) en retard`);
  }

  if (input.visasOverdue > 0) {
    score -= Math.min(15, input.visasOverdue * 5);
    reasons.push(`${input.visasOverdue} visa(s) dépassé(s)`);
  }

  if (input.missingDocs > 0) {
    score -= Math.min(12, input.missingDocs * 3);
    reasons.push(`${input.missingDocs} document(s) manquant(s)`);
  }

  if (input.tsWithoutValidation > 0) {
    score -= 15;
    reasons.push(`${input.tsWithoutValidation} TS sans validation écrite`);
  }

  if (input.blockedMilestones > 0) {
    score -= 12;
    reasons.push(`${input.blockedMilestones} jalon(s) bloqué(s)`);
  }

  if (input.doeMissing >= 5) {
    score -= 8;
    reasons.push("DOE à risque (éléments manquants)");
  }

  if (input.status === "BLOQUE") {
    score = Math.min(score, 25);
    reasons.unshift("Statut chantier : bloqué");
  }

  score = Math.max(0, Math.min(100, score));

  let label: HealthLabel = "CONFORME";
  if (score < 40) label = "CRITIQUE";
  else if (score < 60) label = "EN_DIFFICULTE";
  else if (score < 80) label = "A_SURVEILLER";

  if (reasons.length === 0) reasons.push("Aucun risque administratif majeur détecté");

  return { score, label, reasons: reasons.slice(0, 4) };
}

export function countHealthSignals(params: {
  status: string;
  actions: { dueDate: Date | null; status: string; priority?: string | null }[];
  obligations: { dueDate: Date | null; status: string; priority?: string | null }[];
  requiredDocuments: { status: string }[];
  plans: { visaDueDate: Date | null; status: string }[];
  extraWorks: { startedWithoutValidation: boolean; writtenValidation: boolean; status: string }[];
  doeItems: { status: string }[];
  blockers: { severity: string; status: string }[];
  milestones: { status: string }[];
}): HealthResult {
  const overdueActions = params.actions.filter((a) => isActionOpen(a.status) && isOverdue(a.dueDate, a.status)).length;
  const criticalObligationsOverdue = params.obligations.filter(
    (o) =>
      o.priority === "Critique" &&
      !["Validée", "Non applicable"].includes(o.status) &&
      isOverdue(o.dueDate, o.status),
  ).length;
  const missingDocs = params.requiredDocuments.filter((d) => isDocMissing(d.status)).length;
  const visasOverdue = params.plans.filter(
    (p) => isVisaPending(p.status) && isOverdue(p.visaDueDate, p.status),
  ).length;
  const openBlockers = params.blockers.filter((b) => b.status === "Ouvert" || b.status === "En cours");
  const openBlockersCritical = openBlockers.filter((b) => b.severity === "Critique").length;
  const tsWithoutValidation = params.extraWorks.filter(
    (e) => e.startedWithoutValidation && !e.writtenValidation && !["Validé", "Refusé", "Payé"].includes(e.status),
  ).length;
  const doeMissing = params.doeItems.filter((d) => d.status === "Manquant" || d.status === "À demander").length;
  const blockedMilestones = params.milestones.filter((m) => m.status === "Bloqué").length;

  return computeHealth({
    status: params.status,
    overdueActions,
    criticalObligationsOverdue,
    missingDocs,
    visasOverdue,
    openBlockersCritical,
    openBlockers: openBlockers.length,
    tsWithoutValidation,
    doeMissing,
    blockedMilestones,
  });
}
