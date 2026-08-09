import type { Prisma } from "@prisma/client";
import { isBeworkStaff } from "@/lib/authz";
import { projectWhereForClientUser } from "@/lib/organization/access";
import { prisma } from "@/lib/prisma";

type SessionUser = {
  id: string;
  role?: string | null;
  email?: string | null;
};

/** Propriétaire tenant CLIENT (compte principal ou owner d’org). */
export async function resolveAgendaOwnerUserId(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, invitedById: true },
  });
  if (!user) return userId;
  if (user.role === "CLIENT" && user.invitedById) return user.invitedById;
  return user.id;
}

function mineClause(userId: string): Prisma.AgendaEventWhereInput {
  return {
    OR: [
      { responsibleId: userId },
      { attendees: { some: { userId } } },
      { createdById: userId },
      { ownerUserId: userId },
    ],
  };
}

export async function agendaEventAccessWhere(
  sessionUser: SessionUser,
  opts?: { scope?: "mine" | "team" | "all"; projectId?: string | null },
): Promise<Prisma.AgendaEventWhereInput> {
  const staff = isBeworkStaff(sessionUser);
  if (staff) {
    const base: Prisma.AgendaEventWhereInput = {
      status: { not: "ANNULE" },
      ...(opts?.projectId ? { projectId: opts.projectId } : {}),
    };
    // Moi = responsable / participant / créateur (pas seulement createdBy)
    if (opts?.scope === "mine") {
      return { AND: [base, mineClause(sessionUser.id)] };
    }
    // team ≈ all pour le staff BeWork (pas de second tenant)
    return base;
  }

  const ownerUserId = await resolveAgendaOwnerUserId(sessionUser.id);
  const projectWhere = await projectWhereForClientUser(sessionUser.id);
  const accessibleProjects = await prisma.project.findMany({
    where: projectWhere,
    select: { id: true },
  });
  const projectIds = accessibleProjects.map((p) => p.id);

  const base: Prisma.AgendaEventWhereInput = {
    status: { not: "ANNULE" },
    OR: [
      { ownerUserId },
      { createdById: sessionUser.id },
      { responsibleId: sessionUser.id },
      { attendees: { some: { userId: sessionUser.id } } },
      ...(projectIds.length ? [{ projectId: { in: projectIds } }] : []),
    ],
  };

  if (opts?.projectId) {
    return { AND: [base, { projectId: opts.projectId }] };
  }

  if (opts?.scope === "mine") {
    return {
      AND: [base, mineClause(sessionUser.id)],
    };
  }

  return base;
}

export const agendaEventInclude = {
  project: { select: { id: true, title: true, siteCity: true, siteAddress: true } },
  responsible: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  followUpSheet: {
    select: {
      id: true,
      title: true,
      nextActionAt: true,
      nextActionDone: true,
      urgencyOverride: true,
      status: true,
    },
  },
  purchaseOrder: {
    select: {
      id: true,
      number: true,
      subject: true,
      status: true,
      sharedWithSupplier: true,
      requestedDeliveryAt: true,
      confirmedDeliveryAt: true,
      proposedDeliveryAt: true,
      proposedDeliveryStatus: true,
      legacyTaskId: true,
      externalOrganization: { select: { name: true, tradeName: true } },
      lines: {
        orderBy: { sortOrder: "asc" as const },
        take: 4,
        select: { designation: true, quantity: true, unit: true },
      },
    },
  },
  attendees: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
} satisfies Prisma.AgendaEventInclude;

/** Liste calendrier — sans lignes PO (panneau détail charge le BC si besoin). */
export const agendaEventListInclude = {
  project: { select: { id: true, title: true, siteCity: true, siteAddress: true } },
  responsible: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  followUpSheet: {
    select: {
      id: true,
      title: true,
      nextActionAt: true,
      nextActionDone: true,
      urgencyOverride: true,
      status: true,
    },
  },
  purchaseOrder: {
    select: {
      id: true,
      number: true,
      subject: true,
      status: true,
      sharedWithSupplier: true,
      requestedDeliveryAt: true,
      confirmedDeliveryAt: true,
      proposedDeliveryAt: true,
      proposedDeliveryStatus: true,
      legacyTaskId: true,
      externalOrganization: { select: { name: true, tradeName: true } },
    },
  },
  attendees: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
} satisfies Prisma.AgendaEventInclude;
