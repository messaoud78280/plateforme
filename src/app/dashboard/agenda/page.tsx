import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isBeworkStaff } from "@/lib/authz";
import { resolveAgendaOwnerUserId } from "@/lib/agenda/access";
import { projectWhereForClientUser } from "@/lib/organization/access";
import { prisma } from "@/lib/prisma";
import { AgendaApp } from "@/components/agenda/AgendaApp";

export const metadata: Metadata = {
  title: "Agenda",
};

export default async function AgendaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/agenda");
  }

  const staff = isBeworkStaff(session.user);
  const ownerUserId = await resolveAgendaOwnerUserId(session.user.id);

  const projectWhere = staff ? {} : await projectWhereForClientUser(session.user.id);

  const [projects, teamUsers] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      select: { id: true, title: true },
      orderBy: { title: "asc" },
      take: 200,
    }),
    staff
      ? prisma.user.findMany({
          where: { role: { in: ["CLIENT", "AGENT", "MANAGER", "AGENCE"] } },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
          take: 300,
        })
      : (async () => {
          const org = await prisma.organization.findUnique({
            where: { ownerUserId },
            select: {
              members: {
                select: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          });
          if (org?.members.length) {
            const map = new Map<string, { id: string; name: string; email: string }>();
            for (const m of org.members) {
              map.set(m.user.id, {
                id: m.user.id,
                name: m.user.name ?? "",
                email: m.user.email,
              });
            }
            const owner = await prisma.user.findUnique({
              where: { id: ownerUserId },
              select: { id: true, name: true, email: true },
            });
            if (owner) {
              map.set(owner.id, {
                id: owner.id,
                name: owner.name ?? "",
                email: owner.email,
              });
            }
            return Array.from(map.values()).sort((a, b) =>
              (a.name || a.email).localeCompare(b.name || b.email, "fr"),
            );
          }
          const invited = await prisma.user.findMany({
            where: {
              OR: [{ id: ownerUserId }, { invitedById: ownerUserId }],
            },
            select: { id: true, name: true, email: true },
            orderBy: { name: "asc" },
          });
          return invited.map((u) => ({
            id: u.id,
            name: u.name ?? "",
            email: u.email,
          }));
        })(),
  ]);

  return (
    <AgendaApp
      projects={projects}
      teamUsers={teamUsers.map((u) => ({
        id: u.id,
        name: u.name || u.email,
        email: u.email,
      }))}
      currentUserId={session.user.id}
    />
  );
}
