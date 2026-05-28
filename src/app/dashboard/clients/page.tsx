import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BackLink } from "@/components/ui/BackLink";
import { ClientsTable } from "@/components/clients/ClientsTable";

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
      _count: {
        select: { projects: true, tasks: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <div>
        <h1 className="text-2xl font-bold text-black">Clients</h1>
        <p className="mt-1 text-black">
          Répertoire de tous vos clients. Accédez à leurs projets et tâches, et attribuez un agent à chaque projet ou tâche.
        </p>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl surface-metallic-light p-12 text-center">
          <p className="text-black">Aucun client pour le moment.</p>
          <p className="mt-2 text-sm text-black">
            Les projets créés par les clients apparaîtront ici une fois qu&apos;ils auront un compte.
          </p>
        </div>
      ) : (
        <ClientsTable
          clients={clients.map((client) => ({
            id: client.id,
            name: client.name,
            email: client.email,
            company: client.company,
            projectsCount: client._count.projects,
            tasksCount: client._count.tasks,
            monthlyActionsTotal: client.monthlyActionsTotal ?? 0,
            monthlyActionsUsed: client.monthlyActionsUsed ?? 0,
          }))}
        />
      )}
    </div>
  );
}
