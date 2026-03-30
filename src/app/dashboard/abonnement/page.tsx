import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/subscription-plans";
import { BackLink } from "@/components/ui/BackLink";
import { TARIFS_PLANS } from "@/lib/tarifs-plans";

const PLAN_LABELS: Record<string, string> = {
  DECOUVERTE: "Structure",
  STANDARD: "Suivi",
  STANDARD_PLUS: "Renfort",
  PREMIUM: "Pilotage",
};

const SOURCE_LABELS: Record<string, string> = {
  SUBSCRIPTION: "Souscription",
  ONE_TIME: "Achat unique (historique)",
  RENEWAL: "Renouvellement",
  ADMIN: "Ajustement",
  TASK_DEDUCTION: "Tâche terminée",
};

export default async function AbonnementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/abonnement");

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  if (isAgence) redirect("/dashboard");

  type TaskWithActionsItem = {
    id: string;
    title: string;
    timeSpentMinutes: number | null;
    actionsUsed: number | null;
    completedAt: Date | null;
    projectId: string | null;
    project: { title: string } | null;
    assignedTo: { name: string } | null;
  };

  let user: { subscriptionPlan: string | null; monthlyActionsTotal: number | null; monthlyActionsUsed: number | null; actionsResetAt: Date | null } | null = null;
  let tasksWithActions: TaskWithActionsItem[] = [];
  let subscriptions: Awaited<ReturnType<typeof prisma.subscription.findMany>> = [];
  let payments: Awaited<ReturnType<typeof prisma.payment.findMany>> = [];
  let actionsTransactions: Awaited<ReturnType<typeof prisma.actionsTransaction.findMany>> = [];

  try {
    const [userResult, tasksResult, subsResult, payResult, actionsResult] = await Promise.all([
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
    user = userResult;
    tasksWithActions = tasksResult;
    subscriptions = subsResult;
    payments = payResult;
    actionsTransactions = actionsResult;
  } catch (err) {
    console.error("[Abonnement] Erreur chargement données:", err);
    // Données de base depuis User si possible
    try {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          subscriptionPlan: true,
          monthlyActionsTotal: true,
          monthlyActionsUsed: true,
          actionsResetAt: true,
        },
      });
      tasksWithActions = await prisma.task.findMany({
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
    } catch {
      // ignore
    }
  }

  const activeSub = subscriptions.find((s) => s.status === "ACTIVE");
  const planName = user?.subscriptionPlan ? (getPlan(user.subscriptionPlan)?.name ?? PLAN_LABELS[user.subscriptionPlan] ?? user.subscriptionPlan) : "—";
  const total = user?.monthlyActionsTotal ?? 0;
  const used = user?.monthlyActionsUsed ?? 0;
  const remaining = Math.max(0, total - used);
  const percent = total > 0 ? Math.min(100, (used / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <BackLink href="/dashboard">Tableau de bord</BackLink>

      {/* Formules disponibles (tarifs) + Devis */}
      <section className="rounded-2xl surface-metallic-light p-6">
        <h2 className="text-lg font-semibold text-slate-800">Formules disponibles</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choisissez une formule ou demandez un devis personnalisé pour un volume sur mesure.
        </p>
        <p className="mt-2 text-xs font-medium text-slate-700">
          Tous nos tarifs sont exprimés TTC, sans frais supplémentaires.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {TARIFS_PLANS.map((plan) => (
            <div
              key={plan.planKey}
              className={`relative rounded-xl border-2 p-4 ${plan.badge ? "border-[#1d4ed8] bg-[#1d4ed8]/5" : "border-slate-200 bg-slate-50"}`}
            >
              {plan.badge && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[#1d4ed8] px-2 py-0.5 text-xs font-semibold text-white">
                  {plan.badge}
                </span>
              )}
              <h3 className="font-semibold text-slate-800">{plan.name}</h3>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-1 text-xl font-bold text-[#1d4ed8]">
                <span className="tabular-nums">{plan.price}</span>
                <span>€</span>
                <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-slate-500">TTC</span>
                {plan.billing === "monthly" && <span className="text-sm font-semibold text-slate-500">/ mois</span>}
              </p>
              <p className="mt-1 text-xs font-medium leading-snug text-slate-700">{plan.tagline}</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                {plan.highlights.slice(0, 3).map((h) => (
                  <li key={h}>• {h}</li>
                ))}
              </ul>
              <Link
                href={`/dashboard/abonnement/souscrire?plan=${plan.planKey}`}
                className="mt-3 block w-full rounded-lg bg-[#1d4ed8] py-2 text-center text-sm font-semibold text-white hover:bg-[#1e40af]"
              >
                Choisir
              </Link>
            </div>
          ))}
          {/* Formule Devis */}
          <div className="relative rounded-xl border-2 border-slate-300 bg-white p-4">
            <h3 className="font-semibold text-slate-800">Devis personnalisé</h3>
            <p className="mt-1 text-sm text-slate-600">Volume sur mesure, solution dédiée.</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li>• Sur mesure</li>
              <li>• 3 périmètres ou plus</li>
              <li>• Full-time possible</li>
            </ul>
            <Link
              href="/contact"
              className="mt-3 block w-full rounded-lg border-2 border-slate-300 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Demander un devis
            </Link>
          </div>
        </div>
      </section>

      {/* Bloc Abonnement et actions — formule, KPIs, 3 CTA */}
      <section className="rounded-2xl surface-metallic-light p-6">
        <h2 className="text-lg font-semibold text-slate-800">Abonnement et actions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Formule active</p>
            <p className="mt-0.5 font-semibold text-slate-800">{planName}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Actions totales</p>
            <p className="mt-0.5 font-semibold text-slate-800">{total}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Actions utilisées</p>
            <p className="mt-0.5 font-semibold text-slate-800">{used}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Actions restantes</p>
            <p className="mt-0.5 font-semibold text-[#1d4ed8]">{remaining}</p>
          </div>
        </div>
        {activeSub?.renewsAt && (
          <p className="mt-3 text-sm text-slate-600">
            Date de renouvellement :{" "}
            <span className="font-medium text-slate-800">
              {new Date(activeSub.renewsAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </p>
        )}
        <div className="mt-4">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#1d4ed8] transition-all"
              style={{ width: `${percent}%` }}
              role="progressbar"
              aria-valuenow={used}
              aria-valuemin={0}
              aria-valuemax={total}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {used} / {total} actions utilisées ce mois
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#suivi-actions"
            className="inline-flex rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af]"
          >
            Voir le suivi des actions
          </a>
          <Link
            href="/dashboard/abonnement/souscrire"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Changer de formule
          </Link>
          <Link
            href="/contract"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Gérer mon abonnement
          </Link>
        </div>
        <div className="mt-3">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${activeSub ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
            {activeSub ? "Abonnement actif" : "Aucun abonnement actif"}
          </span>
        </div>
      </section>

      {/* Historique des paiements */}
      <section className="rounded-2xl surface-metallic-light">
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
      <section className="rounded-2xl surface-metallic-light">
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
      <section id="suivi-actions" className="scroll-mt-6">
        <h2 className="text-xl font-bold text-slate-800">Suivi des actions</h2>
        <p className="mt-1 text-sm text-slate-600">
          Historique des tâches terminées avec déduction d&apos;actions. Minimum 1 action par demande.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl surface-metallic-light">
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
