import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";

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
        <div className="overflow-hidden rounded-xl surface-metallic-light shadow-sm">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#c8cdd6] bg-[#f8f9fb] text-black">
                <th className="px-6 py-4 font-semibold">Client</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold text-center">Projets</th>
                <th className="px-6 py-4 font-semibold text-center">Tâches</th>
                <th className="px-6 py-4 font-semibold text-center">Quota crédits (utilisés / total)</th>
                <th className="px-6 py-4 font-semibold text-right">Détail</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const total = client.monthlyActionsTotal ?? 0;
                const used = client.monthlyActionsUsed ?? 0;
                const remaining = Math.max(0, total - used);
                return (
                <tr
                  key={client.id}
                  className="border-b border-[#e0e4ea] transition hover:bg-[#f8f9fb]"
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-black">{client.name}</span>
                    {client.company && (
                      <span className="ml-2 text-black">— {client.company}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-black">{client.email}</td>
                  <td className="px-6 py-4 text-center text-black">
                    {client._count.projects}
                  </td>
                  <td className="px-6 py-4 text-center text-black">
                    {client._count.tasks}
                  </td>
                  <td className="px-6 py-4 text-center text-black">
                    {total > 0 ? (
                      <span>{used} / {total} <span className="text-black">(reste {remaining})</span></span>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="inline-flex items-center rounded-lg surface-metallic-light px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Voir détail
                    </Link>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
