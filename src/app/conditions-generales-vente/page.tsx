import type { Metadata } from "next";
import Link from "next/link";
import { BEWORK_PUBLIC_OFFERS, formatOfferPriceLabel } from "@/lib/bework-public-offers";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { CREDITS_VALIDITY_DAYS, CREDITS_VALIDITY_NOTICE } from "@/lib/subscription-plans";
import { absoluteUrl } from "@/lib/site";

const path = "/conditions-generales-vente";
const pageUrl = absoluteUrl(path);

export const metadata: Metadata = {
  title: { absolute: "Conditions générales de vente | BeWork" },
  description:
    "Conditions générales de vente BeWork : forfaits, crédits administratifs, validité 30 jours, paiement et prestations.",
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "Conditions générales de vente | BeWork",
    description:
      "CGV BeWork : modalités de vente des forfaits, validité des crédits (30 jours) et conditions d'utilisation.",
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: "CGV — BeWork" }],
  },
};

export default function ConditionsGeneralesVentePage() {
  return (
    <SeoLandingPage
      description="Conditions générales de vente des prestations et forfaits BeWork."
      h1="Conditions générales de vente"
      intro={
        <>
          Les présentes conditions générales de vente (CGV) s&apos;appliquent à toute souscription ou achat de forfait BeWork
          par un client professionnel. En validant une commande ou en signant le contrat d&apos;abonnement, le client les accepte sans réserve.
        </>
      }
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Conditions générales de vente", href: path },
      ]}
    >
      <h2>1. Objet</h2>
      <p>
        BeWork commercialise des prestations d&apos;assistance administrative et d'accompagnement travaux (BTP et activités connexes),
        facturées sous forme de forfaits mensuels incluant un quota de crédits administratifs.
      </p>

      <h2>2. Offres et tarifs</h2>
      <p>
        Les niveaux d&apos;accompagnement et les prix de départ HT sont présentés sur la page{" "}
        <Link href="/tarifs" className="font-medium text-[#1d4ed8] underline hover:no-underline">
          Tarifs
        </Link>{" "}
        du site (mission ponctuelle, accompagnement travaux mensuel, cellule externalisée, sur mesure).
      </p>
      <ul>
        {BEWORK_PUBLIC_OFFERS.map((offer) => (
          <li key={offer.key}>
            <strong>{offer.name}</strong> — {formatOfferPriceLabel(offer)}
          </li>
        ))}
      </ul>
      <p>
        Le tarif définitif est établi sur devis selon le périmètre réel (nombre de chantiers, volume de dossiers,
        livrables, fréquence de suivi). BeWork se réserve le droit de modifier ses tarifs publics pour les nouvelles
        souscriptions ; les conditions contractuellement acceptées restent applicables jusqu&apos;au renouvellement ou à la
        résiliation.
      </p>

      <h2>3. Crédits administratifs (espace client)</h2>
      <p>
        Pour certains contrats conclus via l&apos;espace client, un quota de crédits administratifs peut s&apos;appliquer
        selon les termes du contrat signé. Dans ce cas :
      </p>
      <p>
        Un crédit correspond à une unité de traitement administrative (environ 12 minutes de travail, indicatif).
        Le nombre de crédits consommés par mission dépend du temps réellement passé par l&apos;équipe BeWork, évalué à la clôture de la mission.
      </p>

      <h2>4. Validité des crédits — {CREDITS_VALIDITY_DAYS} jours</h2>
      <p>
        <strong>{CREDITS_VALIDITY_NOTICE}</strong>
      </p>
      <ul>
        <li>
          La validité de <strong>{CREDITS_VALIDITY_DAYS} jours</strong> s&apos;applique à <strong>tous les forfaits</strong>, sans exception.
        </li>
        <li>
          Le délai court à compter de la <strong>date d&apos;achat</strong>, de <strong>créditation</strong> ou de <strong>renouvellement</strong> du forfait.
        </li>
        <li>
          Les crédits non utilisés à l&apos;expiration sont <strong>définitivement perdus</strong> : ils ne sont ni remboursés, ni reportés, ni convertis.
        </li>
        <li>
          Un nouvel achat ou renouvellement crédite un nouveau lot de crédits avec une nouvelle période de validité de {CREDITS_VALIDITY_DAYS} jours.
        </li>
      </ul>

      <h2>5. Commande et paiement</h2>
      <p>
        Le paiement est exigible d&apos;avance, mensuellement, par les moyens proposés sur la plateforme (carte bancaire, prélèvement ou autre
        modalité indiquée au checkout). L&apos;accès aux crédits est ouvert après encaissement effectif.
      </p>

      <h2>6. Exécution des prestations</h2>
      <p>
        Les missions sont déposées par le client sur la plateforme (description, recommandations, pièces jointes).
        BeWork évalue le volume de crédits nécessaire avant ou pendant le traitement. Les prestations sont réalisées à distance,
        sous obligation de moyens, dans le cadre défini contractuellement.
      </p>

      <h2>7. Droit de rétractation</h2>
      <p>
        Le client professionnel ne bénéficie pas du droit de rétractation prévu pour les consommateurs (code de la consommation).
        Toute souscription est ferme dès validation du paiement, sous réserve des conditions de résiliation prévues au contrat d&apos;abonnement.
      </p>

      <h2>8. Résiliation</h2>
      <p>
        La résiliation de l&apos;abonnement est régie par le{" "}
        <Link href="/contract" className="font-medium text-[#1d4ed8] underline hover:no-underline">
          contrat d&apos;abonnement
        </Link>{" "}
        (préavis de 30 jours). La résiliation n&apos;ouvre pas droit au remboursement des crédits non utilisés arrivés à expiration ou encore valides.
      </p>

      <h2>9. Responsabilité</h2>
      <p>
        BeWork est soumis à une obligation de moyens. Sa responsabilité est limitée au montant des sommes effectivement versées par le client
        au titre des prestations des douze (12) derniers mois, sauf faute lourde ou dolosive.
      </p>

      <h2>10. Données personnelles</h2>
      <p>
        Le traitement des données est décrit dans la{" "}
        <Link href="/politique-confidentialite" className="font-medium text-[#1d4ed8] underline hover:no-underline">
          politique de confidentialité
        </Link>
        .
      </p>

      <h2>11. Droit applicable et litiges</h2>
      <p>
        Les présentes CGV sont soumises au droit français. En cas de litige, les parties recherchent une solution amiable avant toute action judiciaire.
        À défaut, les tribunaux compétents du ressort du siège social de BeWork seront seuls compétents, sauf disposition impérative contraire.
      </p>

      <p className="mt-8 text-sm text-slate-600">
        Voir aussi :{" "}
        <Link href="/mentions-legales" className="underline hover:no-underline">
          Mentions légales
        </Link>
        {" · "}
        <Link href="/tarifs" className="underline hover:no-underline">
          Tarifs
        </Link>
        {" · "}
        <Link href="/contact" className="underline hover:no-underline">
          Contact
        </Link>
      </p>
    </SeoLandingPage>
  );
}
