/**
 * Programmer / confirmer une intervention + sync Agenda (pas de 2e agenda).
 */
import { prisma } from "@/lib/prisma";
import { resolveAgendaOwnerUserId } from "@/lib/agenda/access";

function dayBoundsUtc(date: Date): { startAt: Date; endAt: Date } {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  return {
    startAt: new Date(Date.UTC(y, m, d, 8, 0, 0)),
    endAt: new Date(Date.UTC(y, m, d, 17, 0, 0)),
  };
}

export async function scheduleAnnualIntervention(opts: {
  interventionId: string;
  organizationId: string;
  actorUserId: string;
  plannedDate?: Date;
  plannedCrewCount?: number | null;
  plannedDuration?: string | null;
  comment?: string | null;
}): Promise<{ interventionId: string; agendaEventId: string }> {
  const intervention = await prisma.annualServiceIntervention.findFirst({
    where: {
      id: opts.interventionId,
      organizationId: opts.organizationId,
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    },
    include: {
      contract: {
        select: {
          id: true,
          clientName: true,
          siteAddress: true,
          siteName: true,
          projectId: true,
          plannedCrewCount: true,
          plannedDuration: true,
          status: true,
        },
      },
    },
  });
  if (!intervention) {
    throw new Error("Intervention introuvable ou déjà clôturée");
  }
  if (intervention.contract.status === "TERMINATED") {
    throw new Error("Contrat résilié — programmation refusée");
  }

  const plannedDate = opts.plannedDate ?? intervention.plannedDate;
  const { startAt, endAt } = dayBoundsUtc(plannedDate);
  const ownerUserId = await resolveAgendaOwnerUserId(opts.actorUserId);
  const title = `CE — ${intervention.contract.clientName}`;
  const location =
    intervention.contract.siteName || intervention.contract.siteAddress;
  const crew =
    opts.plannedCrewCount ??
    intervention.plannedCrewCount ??
    intervention.contract.plannedCrewCount;
  const duration =
    opts.plannedDuration ??
    intervention.plannedDuration ??
    intervention.contract.plannedDuration;
  const description = [
    intervention.contract.siteAddress,
    crew ? `${crew} compagnon${crew > 1 ? "s" : ""}` : null,
    duration ? `Durée : ${duration}` : null,
    opts.comment ?? intervention.comment,
  ]
    .filter(Boolean)
    .join("\n");

  let agendaEventId = intervention.agendaEventId;

  if (agendaEventId) {
    const existing = await prisma.agendaEvent.findFirst({
      where: { id: agendaEventId, organizationId: opts.organizationId },
      select: { id: true },
    });
    if (existing) {
      await prisma.agendaEvent.update({
        where: { id: agendaEventId },
        data: {
          title,
          description,
          location,
          startAt,
          endAt,
          type: "INTERVENTION",
          status: "CONFIRME",
          projectId: intervention.contract.projectId,
        },
      });
    } else {
      agendaEventId = null;
    }
  }

  if (!agendaEventId) {
    const created = await prisma.agendaEvent.create({
      data: {
        title,
        description,
        location,
        type: "INTERVENTION",
        status: "CONFIRME",
        startAt,
        endAt,
        allDay: false,
        projectId: intervention.contract.projectId,
        ownerUserId,
        createdById: opts.actorUserId,
        organizationId: opts.organizationId,
        colorKey: "bleu",
      },
      select: { id: true },
    });
    agendaEventId = created.id;
  }

  await prisma.$transaction([
    prisma.annualServiceIntervention.update({
      where: { id: intervention.id },
      data: {
        plannedDate,
        status: "SCHEDULED",
        plannedCrewCount: crew ?? null,
        plannedDuration: duration ?? null,
        comment: opts.comment ?? intervention.comment,
        agendaEventId,
      },
    }),
    prisma.annualServiceContract.update({
      where: { id: intervention.contract.id },
      data: { nextPlannedDate: plannedDate },
    }),
  ]);

  return { interventionId: intervention.id, agendaEventId };
}
