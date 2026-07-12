import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessagerieMissionsView } from "@/components/messagerie/MessagerieMissionsView";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";

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
    <div className="space-y-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <PageHeader
        eyebrow="Échanges chantier"
        title="Messagerie"
        description={
          isClient
            ? "Échangez avec votre assistant, suivez vos demandes et envoyez des documents."
            : "Messagerie centrée sur les missions. Gérez les échanges et le suivi des missions."
        }
      />

      <Alert tone="info" title="Comment envoyer un message ?">
        {(isManager || isAgent) && (
          <>
            Utilisez l&apos;onglet <strong>Envoyer un message</strong> pour écrire à n&apos;importe quel agent ou gérant.
            Sinon,{" "}
          </>
        )}
        sélectionnez une mission dans la liste du centre, puis utilisez le champ « Écrire un message » en bas à droite et
        le bouton <strong>Envoyer</strong>. Pour joindre un document : icône trombone ou fiche mission.
      </Alert>

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
