import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessagerieHub } from "@/components/messagerie/MessagerieHub";
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";

export default async function MessageriePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  const isManager = session.user.role === "MANAGER";
  const isAgent = session.user.role === "AGENT" || session.user.role === "AGENCE";
  const isClient = session.user.role === "CLIENT";

  let agents: { id: string; name: string; role?: string }[] = [];
  let recipients: { id: string; name: string; role: string }[] = [];
  let managerId: string | null = null;
  let personType: string | null = null;

  try {
    if (isManager || isAgent) {
      const [agentsRes, managersRes, managerFirst] = await Promise.all([
        prisma.user.findMany({
          where: { role: { in: ["AGENCE", "AGENT"] } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.user.findMany({
          where: { role: "MANAGER" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.user.findFirst({
          where: { role: "MANAGER" },
          select: { id: true },
        }),
      ]);
      agents = agentsRes;
      managerId = managerFirst?.id ?? null;
      recipients = [
        ...agentsRes.map((a) => ({ ...a, role: "agent" as const })),
        ...managersRes.map((m) => ({ ...m, role: "gérant" as const })),
      ]
        .filter((r) => r.id !== session.user.id)
        .sort((a, b) => a.name.localeCompare(b.name));

      const clients = await prisma.user.findMany({
        where: {
          role: "CLIENT",
          OR: [
            {
              tasks: {
                some:
                  isManager || session.user.role === "AGENCE"
                    ? {}
                    : { assignedToId: session.user.id },
              },
            },
          ],
        },
        select: { id: true, name: true },
        take: 80,
        orderBy: { name: "asc" },
      });
      for (const c of clients) {
        if (c.id === session.user.id) continue;
        if (!recipients.some((r) => r.id === c.id)) {
          recipients.push({ id: c.id, name: c.name, role: "client" });
        }
      }
      recipients.sort((a, b) => a.name.localeCompare(b.name));
    } else if (isClient) {
      const me = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { personType: true },
      });
      personType = me?.personType ?? null;

      const [assignedAgents, managers] = await Promise.all([
        prisma.user.findMany({
          where: {
            role: { in: ["AGENCE", "AGENT"] },
            tasksAssigned: { some: { clientId: session.user.id } },
          },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.user.findMany({
          where: { role: "MANAGER" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
          take: 20,
        }),
      ]);
      agents = assignedAgents;
      managerId = managers[0]?.id ?? null;
      recipients = [
        ...assignedAgents.map((a) => ({ ...a, role: "agent" as const })),
        ...managers.map((m) => ({ ...m, role: "gérant" as const })),
      ].filter((r) => r.id !== session.user.id);

      if (recipients.length === 0) {
        const anyStaff = await prisma.user.findMany({
          where: { role: { in: ["AGENCE", "AGENT", "MANAGER"] } },
          select: { id: true, name: true, role: true },
          take: 15,
          orderBy: { name: "asc" },
        });
        recipients = anyStaff
          .filter((u) => u.id !== session.user.id)
          .map((u) => ({
            id: u.id,
            name: u.name,
            role: u.role === "MANAGER" ? "gérant" : "agent",
          }));
        agents = anyStaff.filter((u) => u.role !== "MANAGER").map((u) => ({ id: u.id, name: u.name }));
        managerId = anyStaff.find((u) => u.role === "MANAGER")?.id ?? null;
      }
    }
  } catch {
    // ignore
  }

  const canChangeStatus = isManager || isAgent;
  const external = isExternalPortalUser(personType);

  return (
    <div className="-mx-3 -mb-6 -mt-2 flex h-[calc(100dvh-11rem)] min-h-[420px] min-w-0 flex-col overflow-hidden bg-[#111b21] sm:-mx-5 sm:-mb-8 sm:h-[calc(100dvh-12rem)]">
      <Suspense fallback={<p className="p-4 text-sm text-slate-300">Chargement messagerie…</p>}>
        <MessagerieHub
          sessionUserId={session.user.id}
          isAgence={isManager}
          isAgent={isAgent}
          isClient={isClient}
          canChangeStatus={canChangeStatus}
          agents={agents}
          recipients={recipients}
          managerId={managerId}
          preferChantiers={external}
          hideNewDemande={external}
        />
      </Suspense>
    </div>
  );
}
