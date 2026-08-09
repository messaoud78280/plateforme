import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { isBeworkStaff } from "@/lib/authz";
import { resolveAgendaOwnerUserId } from "@/lib/agenda/access";
import { prisma } from "@/lib/prisma";
import { PlanningBoard } from "@/components/planning/PlanningBoard";
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";
import { isPlanifiableUser } from "@/lib/planning/board";
import { projectWhereForClientUser } from "@/lib/organization/access";

export const metadata: Metadata = {
  title: "Planning",
};

type TeamRow = {
  id: string;
  name: string | null;
  email: string;
  jobTitle: string | null;
  permissionProfile: string | null;
  personType: string | null;
};

export default async function PlanningPage() {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/planning");
  }

  if (isExternalPortalUser(session.user.personType)) {
    redirect("/dashboard");
  }

  const staff = isBeworkStaff(session.user);
  const ownerUserId = await resolveAgendaOwnerUserId(session.user.id);

  const selectUser = {
    id: true,
    name: true,
    email: true,
    jobTitle: true,
    permissionProfile: true,
    personType: true,
  } as const;

  const rawUsers: TeamRow[] = staff
    ? await prisma.user.findMany({
        where: { role: { in: ["CLIENT", "AGENT", "MANAGER", "AGENCE"] } },
        select: selectUser,
        orderBy: { name: "asc" },
        take: 300,
      })
    : await (async () => {
        const org = await prisma.organization.findUnique({
          where: { ownerUserId },
          select: {
            members: {
              select: { user: { select: selectUser } },
            },
          },
        });
        if (org?.members.length) {
          const map = new Map<string, TeamRow>();
          for (const m of org.members) {
            map.set(m.user.id, m.user);
          }
          const owner = await prisma.user.findUnique({
            where: { id: ownerUserId },
            select: selectUser,
          });
          if (owner) map.set(owner.id, owner);
          return Array.from(map.values()).sort((a, b) =>
            (a.name || a.email).localeCompare(b.name || b.email, "fr"),
          );
        }
        return prisma.user.findMany({
          where: {
            OR: [{ id: ownerUserId }, { invitedById: ownerUserId }],
          },
          select: selectUser,
          orderBy: { name: "asc" },
          take: 100,
        });
      })();

  const teamUsers = rawUsers.filter(isPlanifiableUser).map((u) => ({
    id: u.id,
    name: u.name || u.email,
    email: u.email,
    jobTitle: u.jobTitle,
    permissionProfile: u.permissionProfile,
    personType: u.personType,
  }));

  const projectWhere = staff ? {} : await projectWhereForClientUser(session.user.id);

  const projects = await prisma.project.findMany({
    where: projectWhere,
    select: { id: true, title: true },
    orderBy: { title: "asc" },
    take: 80,
  });

  return (
    <PlanningBoard
      teamUsers={teamUsers}
      projects={projects}
      currentUserId={session.user.id}
    />
  );
}
