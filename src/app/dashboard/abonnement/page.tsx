import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/subscription-plans";

const PLAN_LABELS: Record<string, string> = {
  DECOUVERTE: "Offre Découverte",
  STANDARD: "Standard",
  STANDARD_PLUS: "Business",
  PREMIUM: "Premium",
};

const SOURCE_LABELS: Record<string, string> = {
  SUBSCRIPTION: "Souscription",
  ONE_TIME: "Offre Découverte",
  RENEWAL: "Renouvellement",
  ADMIN: "Ajustement",
  TASK_DEDUCTION: "Tâche terminée",
};

export default async function AbonnementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/abonnement");

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  if (isAgence) redirect("/dashboard");

  const [user, tasksWithActions, subscriptions, payments, actionsTransactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionPlan: true,
        monthlyActionsTotal: true,
        monthlyActionsUsed: true,
        actionsResetAt: true,
      },
    }),
    prisma.task.findMany({
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
    }),
    prisma.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.actionsTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const activeSub = subscriptions.find((s) => s.status === "ACTIVE");
  const planName = user?.subscriptionPlan ? (getPlan(user.subscriptionPlan)?.name ?? PLAN_LABELS[user.subscriptionPlan] ?? user.subscriptionPlan) : "—";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Tableau de bord
        </Link>
        <div className="flex gap-3">
          <Link
            href="/dashboard/abonnement/souscrire"
            className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af]"
          >
            Changer de formule
          </Link>
          <Link
            href="/tarifs"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Voir les tarifs
          </Link>
        </div>
      </div>

      {/* Formule active et statut */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Mon abonnement</h2>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Formule active</dt>
            <dd className="mt-0.5 font-medium text-slate-800">{planName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Actions totales / utilisées</dt>
            <dd className="mt-0.5 font-medium text-slate-800">
              {user?.monthlyActionsTotal ?? 0} / {user?.monthlyActionsUsed ?? 0}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Statut</dt>
            <dd className="mt-0.5">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${activeSub ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                {activeSub ? "Actif" : "Aucun abonnement actif"}
              </span>
            </dd>
          </div>
          {activeSub?.renewsAt && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Date de renouvellement</dt>
              <dd className="mt-0.5 font-medium text-slate-800">
                {new Date(activeSub.renewsAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* Historique des paiements */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-6 py-4 text-lg font-semibold text-slate-800">
          Historique des paiements
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-800">Formule</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Montant</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Actions créditées</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Statut</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Aucun paiement pour le moment.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{PLAN_LABELS[p.planKey] ?? p.planKey}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{Number(p.amount)} €</td>
                    <td className="px-4 py-3 text-slate-700">{p.actionsCredited}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "PAID" ? "bg-green-100 text-green-800" :
                        p.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                        p.status === "FAILED" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"
                      }`}>
                        {p.status === "PAID" ? "Payé" : p.status === "PENDING" ? "En attente" : p.status === "FAILED" ? "Échoué" : p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Historique des crédits d'actions */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-6 py-4 text-lg font-semibold text-slate-800">
          Historique des crédits d&apos;actions
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-800">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Type</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Source</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Montant</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Description</th>
              </tr>
            </thead>
            <tbody>
              {actionsTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Aucune transaction pour le moment.
                  </td>
                </tr>
              ) : (
                actionsTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(t.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{t.type}</td>
                    <td className="px-4 py-3 text-slate-700">{SOURCE_LABELS[t.source] ?? t.source}</td>
                    <td className={`px-4 py-3 font-medium ${t.amount >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {t.amount >= 0 ? "+" : ""}{t.amount}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.description ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Suivi des actions (tâches) */}
      <section>
        <h1 className="text-2xl font-bold text-slate-800">Suivi des actions</h1>
        <p className="mt-1 text-sm text-slate-600">
          Historique des tâches terminées avec déduction d&apos;actions. Minimum 1 action par demande.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-800">Demande</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Statut</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Actions utilisées</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Projet</th>
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
                    <td className="px-4 py-3 font-medium text-slate-800">{t.title}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {t.completedAt ? new Date(t.completedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">Terminé</td>
                    <td className="px-4 py-3 font-medium text-[#1d4ed8]">{t.actionsUsed ?? 0} action{(t.actionsUsed ?? 0) > 1 ? "s" : ""}</td>
                    <td className="px-4 py-3 text-slate-600">{t.project?.title ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{t.assignedTo?.name ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
