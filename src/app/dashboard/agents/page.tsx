import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BackLink } from "@/components/ui/BackLink";

export default async function AgentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/agents");
  const isManager = session.user.role === "MANAGER";
  if (!isManager) redirect("/dashboard");

  let agents: {
    id: string;
    name: string;
    email: string;
    missionsEnCours: number;
  }[] = [];

  try {
    const users = await prisma.user.findMany({
      where: { role: "AGENT" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    const counts = await Promise.all(
      users.map((u) =>
        prisma.task.count({
          where: {
            assignedToId: u.id,
            status: { in: ["ASSIGNEE", "EN_ANALYSE", "EN_COURS", "EN_ATTENTE_INFO", "A_VALIDER"] },
          },
        })
      )
    );
    agents = users.map((u, i) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      missionsEnCours: counts[i] ?? 0,
    }));
  } catch {
    // ignore
  }

  return (
    <div className="space-y-8">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Agents</h1>
        <p className="mt-1 text-slate-600">
          Vue d&apos;ensemble des agents et de leur charge de travail.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl surface-metallic-light">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-4 font-semibold text-slate-800">Nom</th>
              <th className="px-6 py-4 font-semibold text-slate-800">Email</th>
              <th className="px-6 py-4 font-semibold text-slate-800 text-center">Missions en cours</th>
              <th className="px-6 py-4 font-semibold text-slate-800">Statut</th>
              <th className="px-6 py-4 font-semibold text-slate-800">Disponibilité</th>
            </tr>
          </thead>
          <tbody>
            {agents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  Aucun agent enregistré.
                </td>
              </tr>
            ) : (
              agents.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">{a.name}</td>
                  <td className="px-6 py-4 text-slate-600">{a.email}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-medium text-slate-800">{a.missionsEnCours}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Actif
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        a.missionsEnCours >= 5
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {a.missionsEnCours >= 5 ? "Occupé" : "Disponible"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/dashboard/taches"
          className="rounded-xl surface-metallic-light px-6 py-3 text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          Voir les missions
        </Link>
        <Link
          href="/dashboard/clients"
          className="rounded-xl surface-metallic-light px-6 py-3 text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          Voir les clients
        </Link>
      </div>
    </div>
  );
}
