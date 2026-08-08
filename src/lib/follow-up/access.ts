import type { Prisma } from "@prisma/client";
import { isBeworkStaff } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { resolveAgendaOwnerUserId } from "@/lib/agenda/access";

type SessionUser = {
  id: string;
  role?: string | null;
};

export async function resolveFollowUpOwnerUserId(userId: string): Promise<string> {
  return resolveAgendaOwnerUserId(userId);
}

export async function followUpSheetAccessWhere(
  sessionUser: SessionUser,
): Promise<Prisma.FollowUpSheetWhereInput> {
  if (isBeworkStaff(sessionUser)) {
    return { status: { not: "ARCHIVE" } };
  }

  const ownerUserId = await resolveFollowUpOwnerUserId(sessionUser.id);
  return {
    OR: [
      { ownerUserId },
      { createdById: sessionUser.id },
      { assigneeId: sessionUser.id },
    ],
  };
}

export async function canAccessFollowUpSheet(
  sessionUser: SessionUser,
  sheetId: string,
): Promise<boolean> {
  const where = await followUpSheetAccessWhere(sessionUser);
  const found = await prisma.followUpSheet.findFirst({
    where: { AND: [{ id: sheetId }, where] },
    select: { id: true },
  });
  return Boolean(found);
}

export const followUpSheetInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  project: { select: { id: true, title: true, siteCity: true, siteAddress: true } },
  timeline: {
    orderBy: { occurredAt: "asc" as const },
    take: 80,
    include: { author: { select: { id: true, name: true } } },
  },
  agendaEvents: {
    where: { status: { not: "ANNULE" as const } },
    orderBy: { startAt: "asc" as const },
    take: 40,
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      startAt: true,
      endAt: true,
      allDay: true,
    },
  },
} satisfies Prisma.FollowUpSheetInclude;
