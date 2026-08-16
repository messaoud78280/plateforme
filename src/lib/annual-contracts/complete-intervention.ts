/**
 * Intervention réalisée → historique + A_FACTURER + échéance N+1 (plannedDate + 1 an).
 * Pas de faux projet. Montant HT = suggestion uniquement.
 */
import { prisma } from "@/lib/prisma";
import { addYearsDateOnly } from "@/lib/annual-contracts/types";
import { resolveAgendaOwnerUserId } from "@/lib/agenda/access";

export type CompleteAnnualInterventionInput = {
  interventionId: string;
  organizationId: string;
  actorUserId: string;
  completedAt?: Date;
  actualCrewCount?: number | null;
  comment?: string | null;
};

export type CompleteAnnualInterventionResult = {
  interventionId: string;
  followUpSheetId: string | null;
  nextInterventionId: string | null;
  nextPlannedDate: string | null;
  billingNote: string;
};

export async function completeAnnualIntervention(
  input: CompleteAnnualInterventionInput,
): Promise<CompleteAnnualInterventionResult> {
  const intervention = await prisma.annualServiceIntervention.findFirst({
    where: {
      id: input.interventionId,
      organizationId: input.organizationId,
    },
    include: {
      contract: true,
    },
  });
  if (!intervention) throw new Error("Intervention introuvable");
  if (intervention.status === "COMPLETED") {
    return {
      interventionId: intervention.id,
      followUpSheetId: intervention.followUpSheetId,
      nextInterventionId: null,
      nextPlannedDate: intervention.contract.nextPlannedDate
        ? intervention.contract.nextPlannedDate.toISOString().slice(0, 10)
        : null,
      billingNote: "Déjà marquée réalisée",
    };
  }
  if (intervention.status === "CANCELLED") {
    throw new Error("Intervention annulée");
  }

  const completedAt = input.completedAt ?? new Date();
  const ownerUserId = await resolveAgendaOwnerUserId(input.actorUserId);
  const amountHt = Number(intervention.contract.amountHt);
  const title = `CE à facturer — ${intervention.contract.clientName}`;

  let followUpSheetId = intervention.followUpSheetId;

  if (!followUpSheetId) {
    const sheet = await prisma.followUpSheet.create({
      data: {
        organizationId: input.organizationId,
        ownerUserId,
        createdById: input.actorUserId,
        projectId: intervention.contract.projectId,
        clientName: intervention.contract.clientName,
        siteAddress: intervention.contract.siteAddress,
        title,
        workObject: `Contrat annuel ${intervention.contract.contractType}`,
        amountHt,
        status: "A_FACTURER",
        urgencyOverride: "IMPORTANT",
        nextAction: "Préparer la facture",
        nextActionAt: completedAt,
        reference: `ASI:${intervention.id}`,
        notes: [
          `Source : contrat annuel ${intervention.contract.contractType}.`,
          `Montant annuel suggéré : ${amountHt.toFixed(2)} € HT (proposition — à valider sur la facture).`,
          `Site : ${intervention.contract.siteAddress}`,
          input.comment ?? intervention.comment,
          intervention.contract.comment,
        ]
          .filter(Boolean)
          .join("\n"),
      },
      select: { id: true },
    });
    followUpSheetId = sheet.id;

    await prisma.followUpTimelineEvent.create({
      data: {
        sheetId: sheet.id,
        authorId: input.actorUserId,
        kind: "statut",
        label: "À facturer",
        detail: "Déclenché par intervention annuelle réalisée",
      },
    });
  }

  if (intervention.agendaEventId) {
    await prisma.agendaEvent.updateMany({
      where: {
        id: intervention.agendaEventId,
        organizationId: input.organizationId,
      },
      data: { status: "TERMINE" },
    });
  }

  await prisma.annualServiceIntervention.update({
    where: { id: intervention.id },
    data: {
      status: "COMPLETED",
      completedAt,
      actualCrewCount: input.actualCrewCount ?? intervention.actualCrewCount,
      comment: input.comment ?? intervention.comment,
      followUpSheetId,
      billingNeededAt: completedAt,
    },
  });

  let nextInterventionId: string | null = null;
  let nextPlannedDate: Date | null = null;

  const contractStatus = intervention.contract.status;
  if (contractStatus !== "TERMINATED") {
    nextPlannedDate = addYearsDateOnly(intervention.plannedDate, 1);

    const existingNext = await prisma.annualServiceIntervention.findFirst({
      where: {
        contractId: intervention.contractId,
        plannedDate: nextPlannedDate,
        status: { not: "CANCELLED" },
      },
      select: { id: true },
    });

    if (existingNext) {
      nextInterventionId = existingNext.id;
    } else {
      const next = await prisma.annualServiceIntervention.create({
        data: {
          contractId: intervention.contractId,
          organizationId: input.organizationId,
          plannedDate: nextPlannedDate,
          plannedCrewCount:
            intervention.plannedCrewCount ?? intervention.contract.plannedCrewCount,
          plannedDuration:
            intervention.plannedDuration ?? intervention.contract.plannedDuration,
          status: "TO_PREPARE",
        },
        select: { id: true },
      });
      nextInterventionId = next.id;
    }

    await prisma.annualServiceContract.update({
      where: { id: intervention.contractId },
      data: { nextPlannedDate },
    });
  }

  const billingNote =
    "Fiche A_FACTURER créée. Utiliser « Préparer la facture » pour ouvrir un brouillon Commercial prérempli (sans créer de chantier).";

  return {
    interventionId: intervention.id,
    followUpSheetId,
    nextInterventionId,
    nextPlannedDate: nextPlannedDate
      ? nextPlannedDate.toISOString().slice(0, 10)
      : null,
    billingNote,
  };
}
