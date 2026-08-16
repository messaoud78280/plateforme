/**
 * VISITES-METRES-1 — Sync Agenda (type VISITE_CHANTIER, pas de 2e agenda).
 */
import { prisma } from "@/lib/prisma";
import { resolveAgendaOwnerUserId } from "@/lib/agenda/access";

export async function syncSiteVisitAgenda(opts: {
  visitId: string;
  organizationId: string;
  actorUserId: string;
}): Promise<string | null> {
  const visit = await prisma.siteVisit.findFirst({
    where: { id: opts.visitId, organizationId: opts.organizationId },
  });
  if (!visit) throw new Error("Visite introuvable");
  if (!visit.scheduledAt || visit.status === "CANCELLED" || visit.status === "TO_PLAN") {
    if (visit.agendaEventId) {
      await prisma.agendaEvent.updateMany({
        where: { id: visit.agendaEventId, organizationId: opts.organizationId },
        data: { status: "ANNULE" },
      });
      await prisma.siteVisit.update({
        where: { id: visit.id },
        data: { agendaEventId: null },
      });
    }
    return null;
  }

  const startAt = visit.scheduledAt;
  const endAt = new Date(startAt.getTime() + 90 * 60_000);
  const ownerUserId = await resolveAgendaOwnerUserId(opts.actorUserId);
  const title = `Visite — ${visit.siteName || visit.clientName}`;
  const location = visit.siteAddress;
  const description = [
    visit.clientName,
    visit.contactName ? `Contact : ${visit.contactName}` : null,
    visit.contactPhone ? `Tél. : ${visit.contactPhone}` : null,
    visit.subject,
    visit.clientNeed,
    `Fiche : /dashboard/visites-metres/${visit.id}`,
  ]
    .filter(Boolean)
    .join("\n");

  let agendaEventId = visit.agendaEventId;

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
          type: "VISITE_CHANTIER",
          status: "CONFIRME",
          projectId: visit.projectId,
          responsibleId: visit.responsibleId,
        },
      });
      return agendaEventId;
    }
    agendaEventId = null;
  }

  const created = await prisma.agendaEvent.create({
    data: {
      title,
      description,
      location,
      type: "VISITE_CHANTIER",
      status: "CONFIRME",
      startAt,
      endAt,
      allDay: false,
      projectId: visit.projectId,
      responsibleId: visit.responsibleId,
      ownerUserId,
      createdById: opts.actorUserId,
      organizationId: opts.organizationId,
      colorKey: "vert",
    },
    select: { id: true },
  });

  await prisma.siteVisit.update({
    where: { id: visit.id },
    data: { agendaEventId: created.id },
  });
  return created.id;
}
