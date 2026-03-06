import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/subscription-plans";

export const dynamic = "force-dynamic";

const PLAN_LABELS: Record<string, string> = {
  DECOUVERTE: "Offre Découverte",
  STANDARD: "Standard",
  STANDARD_PLUS: "Business",
  PREMIUM: "Premium",
};

const ACTION_PACKS = [
  { actions: 20, price: 39, label: "20 actions" },
  { actions: 50, price: 89, label: "50 actions" },
  { actions: 100, price: 159, label: "100 actions" },
];

export default async function ProfilVueEnsemblePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/parametres");

  if (session.user?.role !== "CLIENT") {
    redirect("/dashboard");
  }

  const [user, activeSubscription, tasksWithActions, payments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionPlan: true,
        monthlyActionsTotal: true,
        monthlyActionsUsed: true,
        actionsResetAt: true,
      },
    }),
    prisma.subscription.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
      orderBy: { renewsAt: "desc" },
      select: { renewsAt: true, planKey: true },
    }),
    prisma.task.findMany({
      where: {
        clientId: session.user.id,
        status: "COMPLETE",
        actionsUsed: { not: null, gt: 0 },
      },
      orderBy: { completedAt: "desc" },
      take: 50,
      select: { id: true, title: true, completedAt: true, actionsUsed: true },
    }),
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const total = user?.monthlyActionsTotal ?? 0;
  const used = user?.monthlyActionsUsed ?? 0;
  const remaining = Math.max(0, total - used);
  const usagePercent = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const showSuggestion = total > 0 && usagePercent >= 80;

  const planName = user?.subscriptionPlan
    ? (getPlan(user.subscriptionPlan)?.name ?? PLAN_LABELS[user.subscriptionPlan] ?? user.subscriptionPlan)
    : "—";

  return (
    <div className="space-y-8">
      {/* 1. Bloc abonnement */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="abonnement-heading">
        <h2 id="abonnement-heading" className="text-lg font-semibold text-slate-800">
          Abonnement
        </h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Formule active</dt>
            <dd className="mt-0.5 font-medium text-slate-800">{planName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Actions mensuelles</dt>
            <dd className="mt-0.5 font-medium text-slate-800">{total}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Statut</dt>
            <dd className="mt-0.5">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${activeSubscription ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                {activeSubscription ? "Actif" : "Aucun abonnement actif"}
              </span>
            </dd>
          </div>
          {activeSubscription?.renewsAt && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Date de renouvellement</dt>
              <dd className="mt-0.5 font-medium text-slate-800">
                {new Date(activeSubscription.renewsAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
          )}
        </dl>
        <div className="mt-4 flex flex-wrap gap-3">
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
            Voir les offres
          </Link>
        </div>
      </section>

      {/* 2. Compteur d'actions + barre de progression */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="text-lg font-semibold text-slate-800">
          Compteur d&apos;actions
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-slate-800">{total}</p>
            <p className="text-xs text-slate-500">Actions disponibles</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-700">{used}</p>
            <p className="text-xs text-slate-500">Actions utilisées</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#1d4ed8]">{remaining}</p>
            <p className="text-xs text-slate-500">Actions restantes</p>
          </div>
        </div>
        <p className="mt-2 text-center text-sm font-medium text-slate-700">
          {used} / {total} actions
        </p>
        <div className="mt-4">
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={total} aria-label="Actions utilisées">
            <div
              className={`h-full rounded-full transition-all ${usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-amber-400" : "bg-[#1d4ed8]"}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* 6. Suggestion si > 80 % */}
      {showSuggestion && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-amber-800">
            Votre forfait approche de sa limite. L&apos;offre supérieure pourrait être plus adaptée.
          </p>
          <Link
            href="/tarifs"
            className="mt-3 inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Voir l&apos;offre supérieure
          </Link>
        </section>
      )}

      {/* 3. Packs d'actions supplémentaires */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="packs-heading">
        <h2 id="packs-heading" className="text-lg font-semibold text-slate-800">
          Besoin de plus d&apos;actions ?
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Achetez des actions supplémentaires en complément de votre forfait.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {ACTION_PACKS.map((pack) => (
            <div
              key={pack.actions}
              className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 p-4"
            >
              <p className="font-semibold text-slate-800">{pack.label}</p>
              <p className="mt-1 text-xl font-bold text-[#1d4ed8]">{pack.price} €</p>
              <Link
                href={`/contact?sujet=Pack+${pack.actions}+actions`}
                className="mt-4 rounded-lg bg-[#1d4ed8] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[#1e40af]"
              >
                Acheter
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Historique des actions (Demande | Date | Actions utilisées) */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="historique-actions-heading">
        <h2 id="historique-actions-heading" className="border-b border-slate-200 px-6 py-4 text-lg font-semibold text-slate-800">
          Historique des actions
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-800">Demande</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Actions utilisées</th>
              </tr>
            </thead>
            <tbody>
              {tasksWithActions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    Aucune demande avec actions pour le moment.
                  </td>
                </tr>
              ) : (
                tasksWithActions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{t.title}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {t.completedAt ? new Date(t.completedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1d4ed8]">{t.actionsUsed ?? 0} action{(t.actionsUsed ?? 0) > 1 ? "s" : ""}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-6 py-3">
          <Link href="/dashboard/abonnement" className="text-sm font-medium text-[#1d4ed8] hover:underline">
            Voir tout le suivi des actions →
          </Link>
        </div>
      </section>

      {/* 5. Historique des paiements (Date | Montant | Type | Statut) */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="historique-paiements-heading">
        <h2 id="historique-paiements-heading" className="border-b border-slate-200 px-6 py-4 text-lg font-semibold text-slate-800">
          Historique des paiements
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-800">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Montant</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Type de paiement</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Statut</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Aucun paiement pour le moment.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{Number(p.amount)} €</td>
                    <td className="px-4 py-3 text-slate-700">{PLAN_LABELS[p.planKey] ?? "Souscription"}</td>
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

      {/* 7. Gestion abonnement */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="gestion-abonnement-heading">
        <h2 id="gestion-abonnement-heading" className="text-lg font-semibold text-slate-800">
          Gestion de l&apos;abonnement
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Changer de formule, passer à une offre supérieure ou gérer la résiliation.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/dashboard/abonnement/souscrire"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Changer de formule
          </Link>
          <Link
            href="/dashboard/abonnement/souscrire?plan=PREMIUM"
            className="rounded-lg border border-[#1d4ed8] bg-white px-4 py-2 text-sm font-medium text-[#1d4ed8] hover:bg-[#eff6ff]"
          >
            Passer à Premium
          </Link>
          <Link
            href="/contact?sujet=Résiliation+abonnement"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Annuler l&apos;abonnement
          </Link>
        </div>
      </section>
    </div>
  );
}
