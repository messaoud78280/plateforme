import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BackLink } from "@/components/ui/BackLink";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { CreateClientForm } from "@/components/clients/CreateClientForm";
import { ClientsApprovalBanner } from "@/components/clients/ClientsApprovalBanner";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  const isManager = session.user.role === "MANAGER";
  if (!isManager) {
    redirect("/dashboard");
  }

  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      subscriptionPlan: true,
      monthlyActionsTotal: true,
      monthlyActionsUsed: true,
      accountStatus: true,
      createdAt: true,
      _count: {
        select: { projects: true, tasks: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const sortedClients = [...clients].sort((a, b) => {
    const rank = (s: string) =>
      s === "PENDING_APPROVAL" ? 0 : s === "REJECTED" ? 2 : 1;
    const diff = rank(a.accountStatus) - rank(b.accountStatus);
    if (diff !== 0) return diff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const pendingCount = clients.filter((c) => c.accountStatus === "PENDING_APPROVAL").length;

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <ClientsApprovalBanner pendingCount={pendingCount} />

      <PageHeader
        eyebrow="Portefeuille"
        title="Clients"
        description="Répertoire de vos clients entreprises. Créez un compte, accédez à leurs projets et missions, attribuez un agent."
        actions={<CreateClientForm />}
      />

      {clients.length === 0 ? (
        <EmptyState
          title="Aucun client pour le moment"
          description="Créez un compte entreprise ou attendez une inscription en ligne pour commencer le suivi."
        />
      ) : (
        <ClientsTable
          clients={sortedClients.map((client) => ({
            id: client.id,
            name: client.name,
            email: client.email,
            company: client.company,
            projectsCount: client._count.projects,
            tasksCount: client._count.tasks,
            monthlyActionsTotal: client.monthlyActionsTotal ?? 0,
            monthlyActionsUsed: client.monthlyActionsUsed ?? 0,
            accountStatus: client.accountStatus,
          }))}
        />
      )}
    </div>
  );
}
