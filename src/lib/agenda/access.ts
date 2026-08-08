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

export async function agendaEventAccessWhere(
  sessionUser: SessionUser,
  opts?: { scope?: "mine" | "team" | "all"; projectId?: string | null },
): Promise<Prisma.AgendaEventWhereInput> {
  const staff = isBeworkStaff(sessionUser);
  if (staff) {
    return {
      status: { not: "ANNULE" },
      ...(opts?.projectId ? { projectId: opts.projectId } : {}),
    };
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
      AND: [
        base,
        {
          OR: [
            { createdById: sessionUser.id },
            { responsibleId: sessionUser.id },
            { attendees: { some: { userId: sessionUser.id } } },
          ],
        },
      ],
    };
  }

  return base;
}

export const agendaEventInclude = {
  project: { select: { id: true, title: true, siteCity: true, siteAddress: true } },
  responsible: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  attendees: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
} satisfies Prisma.AgendaEventInclude;
