import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlan, SUBSCRIPTION_PRICE_DISCLAIMER, SUBSCRIPTION_PRICE_TAX_LABEL } from "@/lib/subscription-plans";
import { BackLink } from "@/components/ui/BackLink";
import { TARIFS_PLANS } from "@/lib/tarifs-plans";

const PLAN_LABELS: Record<string, string> = {
  DECOUVERTE: "Structure",
  STANDARD: "Suivi",
  STANDARD_PLUS: "Renfort",
  PREMIUM: "Pilotage",
};

export default async function AbonnementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/abonnement");

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  if (isAgence) redirect("/dashboard");

  type TaskWithActionsItem = {
    id: string;
    title: string;
    completedAt: Date | null;
    project: { title: string } | null;
    assignedTo: { name: string } | null;
  };

  let user: { subscriptionPlan: string | null } | null = null;
  let tasksWithActions: TaskWithActionsItem[] = [];
  let subscriptions: Awaited<ReturnType<typeof prisma.subscription.findMany>> = [];
  let payments: Awaited<ReturnType<typeof prisma.payment.findMany>> = [];

  try {
    const [userResult, tasksResult, subsResult, payResult] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          subscriptionPlan: true,
        },
      }),
      prisma.task.findMany({
        where: {
          clientId: session.user.id,
          status: "COMPLETE",
        },
        orderBy: { completedAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          completedAt: true,
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
    ]);
    user = userResult;
    tasksWithActions = tasksResult;
    subscriptions = subsResult;
    payments = payResult;
  } catch (err) {
    console.error("[Abonnement] Erreur chargement données:", err);
    try {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          subscriptionPlan: true,
        },
      });
    } catch {
      // ignore
    }
  }

  const activeSub = subscriptions.find((s) => s.status === "ACTIVE");
  const planName = user?.subscriptionPlan ? (getPlan(user.subscriptionPlan)?.name ?? PLAN_LABELS[user.subscriptionPlan] ?? user.subscriptionPlan) : "—";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <BackLink href="/dashboard">Tableau de bord</BackLink>

      {/* Formules disponibles (tarifs) + Devis */}
      <section className="rounded-2xl surface-metallic-light p-6">
        <h2 className="text-lg font-semibold text-slate-800">Formules disponibles</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choisissez une formule d&apos;abonnement ou demandez un devis personnalisé pour un volume sur mesure.
        </p>
        <p className="mt-2 text-xs font-medium text-slate-700">
          {SUBSCRIPTION_PRICE_DISCLAIMER}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-slate-500">
                  {SUBSCRIPTION_PRICE_TAX_LABEL}
                </span>
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
          <div className="relative rounded-xl border-2 border-slate-300 bg-white p-4">
            <h3 className="font-semibold text-slate-800">Devis personnalisé</h3>
            <p className="mt-1 text-sm text-slate-600">Volume sur mesure, solution dédiée — hors forfait standard.</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li>• Sur mesure</li>
              <li>• 3 périmètres ou plus</li>
              <li>• Full-time possible</li>
            </ul>
            <Link
              href="/contact?sujet=Demande+de+devis+personnalisé"
              className="mt-3 block w-full rounded-lg border-2 border-slate-300 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Demander un devis
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl surface-metallic-light p-6">
        <h2 className="text-lg font-semibold text-slate-800">Mon abonnement</h2>
        <p className="mt-1 text-sm text-slate-600">
          Plus de compteur de crédits : votre accès BeWork repose sur l&apos;abonnement, les prestations
          hors forfait sur devis personnalisé.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Formule active</p>
            <p className="mt-0.5 font-semibold text-slate-800">{planName}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Statut</p>
            <p className="mt-0.5">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${activeSub ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                {activeSub ? "Abonnement actif" : "Aucun abonnement actif"}
              </span>
            </p>
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
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/abonnement/souscrire"
            className="inline-flex rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#152a45]"
          >
            Changer de formule
          </Link>
          <Link
            href="/contact?sujet=Demande+de+devis+personnalisé"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Demander un devis
          </Link>
          <Link
            href="/contract"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Voir le contrat
          </Link>
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
                    <td className="px-4 py-3 font-medium text-slate-800">{PLAN_LABELS[p.planKey] ?? p.planKey}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{Number(p.amount)} €</td>
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

      <section className="rounded-2xl surface-metallic-light">
        <h2 className="border-b border-slate-200 px-6 py-4 text-lg font-semibold text-slate-800">
          Missions terminées
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-800">Mission</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Chantier</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Assistant</th>
              </tr>
            </thead>
            <tbody>
              {tasksWithActions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Aucune mission terminée pour le moment.
                  </td>
                </tr>
              ) : (
                tasksWithActions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{t.title}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {t.completedAt ? new Date(t.completedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) : "—"}
                    </td>
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
