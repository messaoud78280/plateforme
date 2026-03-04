import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AbonnementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/abonnement");

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  if (isAgence) redirect("/dashboard");

  const tasksWithActions = await prisma.task.findMany({
    where: {
      clientId: session.user.id,
      status: "COMPLETE",
      actionsUsed: { not: null, gt: 0 },
    },
    orderBy: { completedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      timeSpentMinutes: true,
      actionsUsed: true,
      completedAt: true,
      projectId: true,
      project: { select: { title: true } },
      assignedTo: { select: { name: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Tableau de bord
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-800">Suivi des actions</h1>
      <p className="text-sm text-slate-600">
        Historique des tâches terminées avec déduction d&apos;actions. 1 action = 10 minutes. Minimum 1 action par demande.
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-semibold text-slate-800">Date</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Tâche</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Projet</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Temps utilisé</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Actions déduites</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Assistante</th>
            </tr>
          </thead>
          <tbody>
            {tasksWithActions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Aucune tâche avec actions déduites pour le moment.
                </td>
              </tr>
            ) : (
              tasksWithActions.map((t) => (
                <tr key={t.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-700">
                    {t.completedAt ? new Date(t.completedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{t.title}</td>
                  <td className="px-4 py-3 text-slate-600">{t.project?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{t.timeSpentMinutes != null ? `${t.timeSpentMinutes} min` : "—"}</td>
                  <td className="px-4 py-3 font-medium text-[#1d4ed8]">{t.actionsUsed ?? 0} action{(t.actionsUsed ?? 0) > 1 ? "s" : ""}</td>
                  <td className="px-4 py-3 text-slate-600">{t.assignedTo?.name ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
