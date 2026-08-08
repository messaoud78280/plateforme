import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/subscription-plans";

export const dynamic = "force-dynamic";

const PLAN_LABELS: Record<string, string> = {
  DECOUVERTE: "Structure",
  STANDARD: "Suivi",
  STANDARD_PLUS: "Renfort",
  PREMIUM: "Pilotage",
};

export default async function ProfilVueEnsemblePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/parametres");

  const role = session.user?.role ?? "CLIENT";
  if (role !== "CLIENT") {
    redirect("/dashboard/parametres/informations");
  }

  const [user, activeSubscription, payments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionPlan: true,
        company: true,
      },
    }),
    prisma.subscription.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
      orderBy: { renewsAt: "desc" },
      select: { renewsAt: true, planKey: true },
    }),
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const planName = user?.subscriptionPlan
    ? (getPlan(user.subscriptionPlan)?.name ?? PLAN_LABELS[user.subscriptionPlan] ?? user.subscriptionPlan)
    : "—";

  return (
    <div className="space-y-8">
      <section className="rounded-2xl surface-metallic-light p-6" aria-labelledby="abonnement-heading">
        <h2 id="abonnement-heading" className="text-lg font-semibold text-slate-800">
          Abonnement
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Votre formule BeWork. Les prestations hors forfait sont chiffrées sur devis personnalisé.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Formule active</dt>
            <dd className="mt-0.5 font-medium text-slate-800">{planName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Statut</dt>
            <dd className="mt-0.5">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  activeSubscription ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                }`}
              >
                {activeSubscription ? "Actif" : "Aucun abonnement actif"}
              </span>
            </dd>
          </div>
          {activeSubscription?.renewsAt ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Date de renouvellement
              </dt>
              <dd className="mt-0.5 font-medium text-slate-800">
                {new Date(activeSubscription.renewsAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/dashboard/abonnement/souscrire"
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#152a45]"
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

      <section className="rounded-2xl border border-[#1e3a5f]/15 bg-[#1e3a5f]/[0.04] p-6" aria-labelledby="devis-heading">
        <h2 id="devis-heading" className="text-lg font-semibold text-[#1e3a5f]">
          Devis personnalisé
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Plus de compteur de crédits : chaque mission ou pack de prestations hors abonnement est
          chiffré selon votre volume, vos chantiers et le niveau d’accompagnement souhaité.
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>Abonnement pour le suivi bureau-chantier récurrent</li>
          <li>Devis sur mesure pour les missions ponctuelles ou volume important</li>
          <li>Validation claire avant engagement</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/contact?sujet=Demande+de+devis+personnalisé"
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#152a45]"
          >
            Demander un devis
          </Link>
          <Link
            href="/dashboard/nouvelle-demande"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Créer une mission
          </Link>
        </div>
      </section>

      <section className="rounded-2xl surface-metallic-light" aria-labelledby="historique-paiements-heading">
        <h2
          id="historique-paiements-heading"
          className="border-b border-slate-200 px-6 py-4 text-lg font-semibold text-slate-800"
        >
          Historique des paiements
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-800">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Montant</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Type</th>
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
                      {new Date(p.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{Number(p.amount)} €</td>
                    <td className="px-4 py-3 text-slate-700">
                      {PLAN_LABELS[p.planKey] ?? "Souscription / devis"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : p.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : p.status === "FAILED"
                                ? "bg-red-100 text-red-800"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {p.status === "PAID"
                          ? "Payé"
                          : p.status === "PENDING"
                            ? "En attente"
                            : p.status === "FAILED"
                              ? "Échoué"
                              : p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl surface-metallic-light p-6" aria-labelledby="gestion-abonnement-heading">
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
            href="/dashboard/abonnement"
            className="rounded-lg border border-[#1e3a5f] bg-white px-4 py-2 text-sm font-medium text-[#1e3a5f] hover:bg-slate-50"
          >
            Voir mon abonnement
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
