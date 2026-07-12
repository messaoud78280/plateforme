import { prisma } from "@/lib/prisma";
import { computeAdminProgress, computeDoeProgress } from "@/lib/pilotage/calculations";
import { computeContractRisk } from "@/lib/pilotage/contractRisk";
import { countHealthSignals } from "@/lib/pilotage/health";

/** Recalcule santé opérationnelle + risque contractuel et persiste sur le pilotage. */
export async function refreshPilotageProgress(pilotageId: string) {
  const pilotage = await prisma.worksitePilotage.findUnique({
    where: { id: pilotageId },
    select: {
      status: true,
      plannedEndDate: true,
      actions: { where: { archivedAt: null }, select: { dueDate: true, status: true, priority: true } },
      obligations: { where: { archivedAt: null }, select: { dueDate: true, status: true, priority: true } },
      requiredDocuments: { where: { archivedAt: null }, select: { status: true } },
      plans: { where: { archivedAt: null }, select: { visaDueDate: true, status: true } },
      extraWorks: {
        where: { archivedAt: null },
        select: { startedWithoutValidation: true, writtenValidation: true, status: true },
      },
      doeItems: { where: { archivedAt: null }, select: { status: true } },
      blockers: { where: { archivedAt: null }, select: { severity: true, status: true } },
      milestones: { where: { archivedAt: null }, select: { status: true } },
      situations: { where: { archivedAt: null }, select: { status: true } },
      subcontractors: { where: { archivedAt: null }, select: { approvalStatus: true, dossierStatus: true } },
      sensitiveDeadlines: { where: { archivedAt: null }, select: { dueAt: true, status: true } },
      nonConformities: { where: { archivedAt: null }, select: { severity: true, status: true } },
      delayEvents: { where: { archivedAt: null }, select: { status: true } },
      pricingAssumptions: { where: { archivedAt: null }, select: { verificationStatus: true } },
    },
  });
  if (!pilotage) return;

  const doe = computeDoeProgress(pilotage.doeItems);
  const admin = computeAdminProgress({
    obligationsTotal: pilotage.obligations.length,
    obligationsDone: pilotage.obligations.filter((o) => o.status === "Validée" || o.status === "Non applicable").length,
    docsTotal: pilotage.requiredDocuments.length,
    docsDone: pilotage.requiredDocuments.filter((d) => d.status === "Validé" || d.status === "Non applicable").length,
    plansTotal: pilotage.plans.length,
    plansDone: pilotage.plans.filter((p) => ["Validé", "Bon pour exécution", "Obsolète"].includes(p.status)).length,
    doePct: doe.pct,
  });
  const health = countHealthSignals({
    status: pilotage.status,
    actions: pilotage.actions,
    obligations: pilotage.obligations,
    requiredDocuments: pilotage.requiredDocuments,
    plans: pilotage.plans,
    extraWorks: pilotage.extraWorks,
    doeItems: pilotage.doeItems,
    blockers: pilotage.blockers,
    milestones: pilotage.milestones,
  });

  const now = new Date();
  const nearReception =
    pilotage.plannedEndDate != null &&
    pilotage.plannedEndDate.getTime() - now.getTime() < 45 * 24 * 60 * 60 * 1000;
  const risk = computeContractRisk({
    tsWithoutWrittenValidation: pilotage.extraWorks.filter(
      (e) => e.startedWithoutValidation && !e.writtenValidation,
    ).length,
    overdueCriticalObligations: pilotage.obligations.filter(
      (o) =>
        o.priority === "Critique" &&
        o.dueDate != null &&
        o.dueDate < now &&
        !["Validée", "Non applicable"].includes(o.status),
    ).length,
    openCriticalBlockers: pilotage.blockers.filter(
      (b) => b.severity === "Critique" && !["Résolu", "Clôturé", "Non applicable"].includes(b.status),
    ).length,
    contestedSituations: pilotage.situations.filter((s) => s.status === "Contestée").length,
    incompleteSubcontractors: pilotage.subcontractors.filter(
      (s) => s.approvalStatus !== "Agréé" || s.dossierStatus !== "Complet",
    ).length,
    overdueSensitiveDeadlines: pilotage.sensitiveDeadlines.filter(
      (d) =>
        d.status === "Dépassée" ||
        (d.dueAt != null &&
          d.dueAt < now &&
          !["Traitée", "Non applicable", "Contestée"].includes(d.status)),
    ).length,
    openNonConformitiesCritical: pilotage.nonConformities.filter(
      (n) =>
        n.severity === "Critique" &&
        !["Corrigée", "Clôturée", "Non applicable"].includes(n.status),
    ).length,
    openDelayEvents: pilotage.delayEvents.filter(
      (d) => !["Résolu", "Clôturé", "Impact confirmé"].includes(d.status),
    ).length,
    doeMissingNearReception: nearReception
      ? pilotage.doeItems.filter((d) => !["Reçu", "Validé", "Non applicable"].includes(d.status)).length
      : 0,
    unconfirmedAssumptions: pilotage.pricingAssumptions.filter((a) =>
      ["Hypothèse d’étude", "À vérifier"].includes(a.verificationStatus),
    ).length,
  });

  await prisma.worksitePilotage.update({
    where: { id: pilotageId },
    data: {
      adminProgressPct: admin,
      doeProgressPct: doe.pct,
      healthScore: health.score,
      healthLabel: health.label,
      healthUpdatedAt: new Date(),
      contractRiskScore: risk.score,
      contractRiskLabel: risk.label,
      contractRiskUpdatedAt: new Date(),
    },
  });
}
