import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessagerieMissionsView } from "@/components/messagerie/MessagerieMissionsView";
import { BackLink } from "@/components/ui/BackLink";

export default async function MessageriePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const isAgent = session.user.role === "AGENT";
  const isClient = session.user.role === "CLIENT";

  let agents: { id: string; name: string }[] = [];
  let managerId: string | null = null;
  if (isAgence || isAgent) {
    try {
      const [agentsRes, managerRes] = await Promise.all([
        prisma.user.findMany({
          where: { role: { in: ["AGENCE", "AGENT"] } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.user.findFirst({
          where: { role: "MANAGER" },
          select: { id: true },
        }),
      ]);
      agents = agentsRes;
      managerId = managerRes?.id ?? null;
    } catch {
      // ignore
    }
  }

  const canChangeStatus = isAgence || isAgent;

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard">Dashboard</BackLink>
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">Messagerie</h1>
        <p className="mt-1 text-[#334155]">
          {isClient
            ? "Échangez avec votre assistant, suivez vos demandes et envoyez des documents."
            : "Messagerie centrée sur les missions. Gérez les échanges et le suivi des missions administratives."}
        </p>
      </div>

      <MessagerieMissionsView
        sessionUserId={session.user.id}
        isAgence={isAgence}
        isAgent={isAgent}
        canChangeStatus={canChangeStatus}
        agents={agents}
        managerId={managerId}
      />
    </div>
  );
}
