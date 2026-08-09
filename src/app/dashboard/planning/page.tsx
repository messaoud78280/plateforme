import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isBeworkStaff } from "@/lib/authz";
import { resolveAgendaOwnerUserId } from "@/lib/agenda/access";
import { prisma } from "@/lib/prisma";
import { PlanningBoard } from "@/components/planning/PlanningBoard";

export const metadata: Metadata = {
  title: "Planning",
};

export default async function PlanningPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/planning");
  }

  const staff = isBeworkStaff(session.user);
  const ownerUserId = await resolveAgendaOwnerUserId(session.user.id);

  const teamUsers = staff
    ? await prisma.user.findMany({
        where: { role: { in: ["CLIENT", "AGENT", "MANAGER", "AGENCE"] } },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
        take: 300,
      })
    : await (async () => {
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
        return prisma.user.findMany({
          where: {
            OR: [{ id: ownerUserId }, { invitedById: ownerUserId }],
          },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
          take: 100,
        });
      })();

  return (
    <PlanningBoard
      teamUsers={teamUsers.map((u) => ({
        id: u.id,
        name: u.name || u.email,
        email: u.email,
      }))}
      currentUserId={session.user.id}
    />
  );
}
