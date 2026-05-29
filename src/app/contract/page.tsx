import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContractSigningBlock } from "@/components/contract/ContractSigningBlock";
import { BackLink } from "@/components/ui/BackLink";
import { PLAN_KEYS, SUBSCRIPTION_PLANS, formatPriceLabelFr } from "@/lib/subscription-plans";

const CONTRACT_PDF_URL = process.env.CONTRACT_PDF_URL;
const SHOW_PDF_EMBED = Boolean(CONTRACT_PDF_URL);

export default async function ContractPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/contract");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { contractStatus: true, role: true },
  });

  if (!user) {
    redirect("/connexion?callbackUrl=/contract");
  }

  // Agence/Manager n'ont pas à signer
  if (user.role !== "CLIENT") {
    redirect("/dashboard");
  }

  if (user.contractStatus === "SIGNED") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="mb-6 flex justify-center">
          <BackLink href="/dashboard">Retour au tableau de bord</BackLink>
        </div>
        <h1 className="text-2xl font-bold text-black">Contrat signé</h1>
        <p className="mt-2 text-black">
          Votre contrat a bien été accepté. Vous avez accès à l&apos;ensemble du
          tableau de bord.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af]"
        >
          Accéder au tableau de bord
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <BackLink href="/dashboard">Retour au tableau de bord</BackLink>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Contrat d&apos;abonnement</h1>
        <p className="mt-1 text-black">
          Veuillez prendre connaissance du contrat ci-dessous et l&apos;accepter pour activer votre compte.
        </p>
      </div>

      <section className="rounded-2xl surface-metallic-light p-6">
        <h2 className="mb-4 text-lg font-semibold text-black">Document contractuel</h2>
        {SHOW_PDF_EMBED ? (
          <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
            <iframe
              src={CONTRACT_PDF_URL}
              title="Contrat BeWork"
              className="h-full w-full"
            />
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-6 text-black text-sm leading-relaxed">
            <p className="mb-6 text-base font-semibold text-black">CONTRAT D&apos;ABONNEMENT BEWORK</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">1. Présentation des parties</h3>
            <p className="mb-4">BeWork est le prestataire de services. Le client est l&apos;entreprise utilisant la plateforme.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">2. Objet du contrat</h3>
            <p className="mb-4">Fourniture de services d&apos;assistance administrative à distance.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">3. Description des prestations</h3>
            <p className="mb-2">Les prestations incluent notamment : gestion des emails, organisation d&apos;agenda, création de devis et factures, suivi administratif des dossiers, relances administratives, mise en forme de documents, reporting, gestion fournisseurs, pré-comptabilité administrative. Les prestations sont limitées à des tâches administratives.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">4. Modalités de prestation</h3>
            <p className="mb-4">Les prestations sont réalisées à distance via la plateforme BeWork.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">5. Quota de crédits inclus dans les offres</h3>
            <p className="mb-4">Les offres BeWork sont exprimées en quota de crédits administratifs. Un crédit correspond à une tâche administrative simple réalisée par notre équipe. La plupart des crédits représentent environ 12 minutes de traitement administratif (équivalent indicatif : cinq crédits par heure). Ce quota ne constitue pas une mise à disposition d&apos;un salarié. Le prestataire organise librement ses ressources. Les assistants restent sous l&apos;autorité exclusive de BeWork. Le client ne dispose d&apos;aucun lien de subordination avec les assistants.</p>
            <p className="mb-4"><strong>Validité des crédits :</strong> les crédits achetés ou crédités sont valables 30 jours à compter de la date d&apos;achat ou de créditation, quel que soit le forfait. Les crédits non utilisés à l&apos;issue de ce délai sont perdus sans remboursement ni report. Voir les{" "}
              <Link href="/conditions-generales-vente" className="font-medium text-[#1d4ed8] underline hover:no-underline">
                conditions générales de vente
              </Link>
              .
            </p>

            <h3 className="mb-2 mt-6 font-semibold text-black">6. Tarifs et paiement</h3>
            <p className="mb-2">Les tarifs sont ceux affichés sur la page Tarifs du site :</p>
            <ul className="mb-4 list-disc pl-5">
              {PLAN_KEYS.map((key) => {
                const p = SUBSCRIPTION_PLANS[key];
                return (
                  <li key={key}>
                    {p.name} : {formatPriceLabelFr(p.priceLabel)} € HT / mois
                  </li>
                );
              })}
            </ul>
            <p className="mb-4">Paiement mensuel d&apos;avance.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">7. Obligations du prestataire</h3>
            <p className="mb-4">Fournir un service professionnel, assurer le suivi, respecter la confidentialité.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">8. Obligations du client</h3>
            <p className="mb-4">Fournir les informations nécessaires, donner les accès nécessaires, respecter les délais de paiement.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">9. Confidentialité</h3>
            <p className="mb-4">Les informations du client sont strictement confidentielles.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">10. Protection des données (RGPD)</h3>
            <p className="mb-4">Respect du RGPD. Les données peuvent être traitées uniquement pour l&apos;exécution des prestations. Les infrastructures utilisées pour l&apos;hébergement et le traitement des données sont situées au sein de l&apos;Union européenne ou conformes aux exigences européennes.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">11. Utilisation d&apos;outils numériques et d&apos;intelligence artificielle</h3>
            <p className="mb-4">Le prestataire peut utiliser des outils numériques et d&apos;intelligence artificielle pour améliorer l&apos;efficacité des prestations tout en respectant la confidentialité des données.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">12. Responsabilité</h3>
            <p className="mb-4">Le prestataire est soumis à une obligation de moyens. La responsabilité du prestataire est limitée au montant des prestations payées par le client au cours des 12 derniers mois.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">13. Responsabilité des informations</h3>
            <p className="mb-4">Le client est responsable de l&apos;exactitude et de la légalité des informations fournies.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">14. Indépendance des parties</h3>
            <p className="mb-4">Les assistants intervenant restent sous la responsabilité exclusive de BeWork. Ils ne sont pas les salariés du client.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">15. Non-sollicitation</h3>
            <p className="mb-4">Le client s&apos;engage à ne pas recruter un assistant intervenant dans le cadre des prestations pendant la durée du contrat et pendant 12 mois après la fin de celui-ci.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">16. Suspension du service</h3>
            <p className="mb-4">BeWork peut suspendre les prestations en cas de non-paiement ou de violation du contrat.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">17. Durée</h3>
            <p className="mb-4">Contrat mensuel renouvelable automatiquement.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">18. Résiliation</h3>
            <p className="mb-4">Chaque partie peut résilier le contrat avec un préavis de 30 jours.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">19. Force majeure</h3>
            <p className="mb-4">Aucune partie ne pourra être tenue responsable en cas de force majeure.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">20. Droit applicable</h3>
            <p className="mb-4">Le contrat est soumis au droit français.</p>

            <h3 className="mb-2 mt-6 font-semibold text-black">21. Signature électronique</h3>
            <p className="mb-4">L&apos;acceptation du contrat via le bouton « J&apos;accepte le contrat » constitue une signature électronique conforme au règlement européen eIDAS. La signature est horodatée et associée aux informations techniques du signataire.</p>
          </div>
        )}
        <ContractSigningBlock />
      </section>
    </div>
  );
}
