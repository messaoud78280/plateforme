import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessagerieMissionsView } from "@/components/messagerie/MessagerieMissionsView";

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
  if (isManager || isAgent) {
    try {
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
    } catch {
      // ignore
    }
  }

  const canChangeStatus = isManager || isAgent;

  return (
    <div className="-mx-4 -mb-6 -mt-2 flex h-[calc(100dvh-3.5rem)] min-h-[520px] flex-col overflow-hidden bg-[#111b21] sm:-mx-6 lg:h-[calc(100dvh-4rem)]">
      <MessagerieMissionsView
        sessionUserId={session.user.id}
        isAgence={isManager}
        isAgent={isAgent}
        isClient={isClient}
        canChangeStatus={canChangeStatus}
        agents={agents}
        recipients={recipients}
        managerId={managerId}
      />
    </div>
  );
}
