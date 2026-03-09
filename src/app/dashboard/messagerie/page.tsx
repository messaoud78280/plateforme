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

  let agents: { id: string; name: string; role?: string }[] = [];
  let recipients: { id: string; name: string; role: string }[] = []; // agents + managers pour "Envoyer un message"
  let managerId: string | null = null;
  if (isAgence || isAgent) {
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
      ].sort((a, b) => a.name.localeCompare(b.name));
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
        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm text-slate-700">
          <strong>Comment envoyer un message ?</strong>{" "}
          {(isAgence || isAgent) && (
            <>Utilisez l&apos;onglet <strong>Envoyer un message</strong> pour écrire à n&apos;importe quel agent ou gérant. Sinon, </>
          )}
          sélectionnez une mission dans la liste du centre, puis utilisez le champ « Écrire un message » en bas à droite et le bouton <strong>Envoyer</strong>. Pour joindre un document : cliquez sur l&apos;icône trombone ou ouvrez la mission pour ajouter des pièces jointes.
        </div>
      </div>

      <MessagerieMissionsView
        sessionUserId={session.user.id}
        isAgence={isAgence}
        isAgent={isAgent}
        isClient={isClient}
        canChangeStatus={canChangeStatus}
        agents={agents}
        managerId={managerId}
        recipients={recipients}
      />
    </div>
  );
}
