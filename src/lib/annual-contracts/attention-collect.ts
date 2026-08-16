/**
 * Collecte Attention — contrats annuels (réutilise le board À traiter).
 */
import { prisma } from "@/lib/prisma";
import type { ATraiterAttentionCard } from "@/lib/a-traiter/attention-board";
import { ATTENTION_CATEGORY_LABELS } from "@/lib/a-traiter/attention-board";
import { formatKanbanDueLabel } from "@/lib/follow-up/urgency";
import {
  evaluateAnnualBillingAttention,
  evaluateAnnualInterventionAttention,
} from "@/lib/annual-contracts/evaluate-attention";
import type { SerializedAttention } from "@/lib/follow-up/attention";
import { canAccessAnnualContracts } from "@/lib/annual-contracts/access";

export async function collectAnnualContractAttentionCards(
  sessionUser: {
    id: string;
    role?: string | null;
    personType?: string | null;
    permissionProfile?: string | null;
  },
  organizationId: string | null,
  light = false,
  takeOverride?: number,
): Promise<{ cards: ATraiterAttentionCard[]; sampled: number }> {
  if (!organizationId || !canAccessAnnualContracts(sessionUser)) {
    return { cards: [], sampled: 0 };
  }

  const take = takeOverride ?? (light ? 40 : 80);
  const now = new Date();

  const interventions = await prisma.annualServiceIntervention.findMany({
    where: {
      organizationId,
      OR: [
        { status: { in: ["TO_PREPARE", "SCHEDULED"] } },
        {
          status: "COMPLETED",
          billingNeededAt: { not: null },
          billedAt: null,
        },
      ],
    },
    include: {
      contract: {
        select: {
          id: true,
          clientName: true,
          siteAddress: true,
          projectId: true,
          status: true,
        },
      },
    },
    orderBy: { plannedDate: "asc" },
    take,
  });

  const cards: ATraiterAttentionCard[] = [];

  for (const i of interventions) {
    if (i.contract.status === "TERMINATED" && i.status !== "COMPLETED") continue;

    const prep =
      i.status === "COMPLETED"
        ? null
        : evaluateAnnualInterventionAttention({
            plannedDate: i.plannedDate,
            status: i.status,
            now,
          });
    const bill =
      i.status === "COMPLETED"
        ? evaluateAnnualBillingAttention({
            billingNeededAt: i.billingNeededAt,
            billedAt: i.billedAt,
            now,
          })
        : null;
    const att = bill ?? prep;
    if (!att) continue;

    const item: SerializedAttention["attentionItems"][number] = {
      code: att.code,
      level: att.level,
      reason: att.reason,
      actionLabel: bill ? "Préparer la facturation" : "Ouvrir le contrat",
      dueAt: i.plannedDate.toISOString(),
      overdueByHours: null,
      relatedEntity: null,
    };

    const actionUrl = bill
      ? i.followUpSheetId
        ? `/dashboard/fiches-suivi?sheet=${encodeURIComponent(i.followUpSheetId)}`
        : `/dashboard/facturation?filtre=a_facturer`
      : `/dashboard/contrats-annuels?view=piloter&contract=${encodeURIComponent(i.contract.id)}&intervention=${encodeURIComponent(i.id)}`;

    cards.push({
      subjectType: "ANNUAL_CONTRACT",
      subjectId: i.id,
      sheetId: i.id,
      title: `${i.contract.clientName} — intervention annuelle`,
      clientName: i.contract.clientName,
      projectId: i.contract.projectId,
      projectTitle: null,
      osNumber: null,
      orderNumber: null,
      workObject: i.contract.siteAddress,
      nextAction: item.actionLabel ?? att.reason,
      nextActionDone: false,
      assigneeId: null,
      assigneeName: null,
      nextActionAt: i.plannedDate.toISOString(),
      dueLabel: formatKanbanDueLabel(i.plannedDate, now),
      status: i.status,
      statusEnteredAt: null,
      effectiveUrgency: att.level,
      primaryReason: att.reason,
      attentionItems: [item],
      otherReasonsCount: 0,
      category: bill ? "FACTURATION" : "INTERVENTION",
      categoryLabel: bill
        ? ATTENTION_CATEGORY_LABELS.FACTURATION
        : ATTENTION_CATEGORY_LABELS.INTERVENTION,
      relatedAgendaId: i.agendaEventId,
      relatedTaskId: null,
      actionUrl,
      actionLabel: item.actionLabel ?? "Ouvrir",
      supplierMessageUrl: null,
      searchExtra: i.contract.siteAddress,
    });
  }

  return { cards, sampled: interventions.length };
}
