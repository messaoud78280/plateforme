import Link from "next/link";
import { GeoExternalisationHubLinks } from "@/components/seo/GeoExternalisationHubLinks";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import {
  EXTERNALISATION_ADMIN_BT_PATHS,
  hreflangExternalisationAdministrativeBtpCluster,
} from "@/lib/externalisation-administrative-btp-geo";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = EXTERNALISATION_ADMIN_BT_PATHS.france;

export const metadata = landingPageMetadata({
  title: "Externalisation administrative BTP France — artisans & conducteurs de travaux | BeWork",
  description:
    "France : devis, facturation chantier, situations de travaux, relances et dossiers administratifs pour artisans, TPE et conducteurs de travaux. Forfait TTC, sans embauche. Équipe francophone encadrée.",
  path: PAGE_PATH,
  keywords: [
    "externalisation administrative BTP France",
    "gestion administrative artisan France",
    "conducteur de travaux administratif",
    "secrétariat externalisé bâtiment",
    "devis relances chantier France",
    "situation travaux administrative",
    "pilotage administratif PME bâtiment",
  ],
  hreflangLanguages: hreflangExternalisationAdministrativeBtpCluster(),
});

export default function Page() {
  const faq = [
    {
      q: "Quelle est la différence entre un secrétariat classique et BeWork pour un artisan ?",
      a: "Un secrétaire prend des messages. BeWork est cadré sur l’exécution jusqu’à statut fiché — devis, relances, factures ou dossiers chantier suivis jusqu’à clôture avec traçabilité. Vous validez les points sensibles.",
    },
    {
      q: "Un conducteur de travaux peut-il déléguer sans perdre la main ?",
      a: "Oui : nous travaillons sur des demandes ouvertes avec critères visibles ; pour ce qui engage la responsabilité contractuelle ou juridique, le déclencheur d’envoi reste votre validation avant expédition.",
    },
    {
      q: "Êtes-vous limité à une région en France ?",
      a: "Non : le fonctionnement est national pour les équipes francophones côté traitement après validation préalable de votre périmètre au rendez-vous découverte — notre siège pilote reste structuré en France.",
    },
  ] as const;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <SeoLandingPage
      description="Externalisation administrative pour le BTP en France — devis, relances et dossiers chantier structurés."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Externalisation administrative BTP — France", href: PAGE_PATH },
      ]}
      h1="Externalisation administrative BTP en France — du devis au dossier chantier"
      intro={
        <>
          En France vous connaissez le rythme&nbsp;: AO publics qui pèsent sur la rédaction, devis envoyés puis oubliés faute de
          relances calibrées, situations de travaux à relancer pour alimenter la trésorerie, piles de mails fournisseur qui
          restent sans réponse un dimanche sur deux. Ce n&apos;est pas une question de discipline personnelle — c&apos;est un
          volume administratif montant en volume quand votre carnet de chantiers se remplit. BeWork prend ce flux comme un flux
          production, pas comme une boîte mail supplémentaire.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Le vocabulaire terrain que vous retrouvez chez vos clients français</h2>
      <p>
        Devis initial, avenants, attestations URSSAF demandées tardivement, mémoires techniques qui piquent vos nuits avant
        soumission&nbsp;: vos interlocuteurs mélangent jargon commercial et jargon administratif. Nous parlons ces objets sous
        forme de demandes actionnables sur la plateforme — «&nbsp;relance devis X&nbsp;», «&nbsp;situation travaux à
        facturer&nbsp;», «&nbsp;pièces pour DICT&nbsp;» — pour que la charge devienne traçable et priorisée par urgence chantier.
      </p>

      <h2>Artisans multisites et conducteurs de travaux multitâches</h2>
      <p>
        Le chef d&apos;entreprise artisan doit parfois enchaîner pose le matin et devis révision l&apos;après-midi. Le CT est
        pris dans les validations techniques et répond aux demandes administratives des sous-traitants. Dans ces deux figures,
        l&apos;enjeu français est mécanique&nbsp;: gagner deux heures de bureau trois fois dans la semaine change la courbe du
        cash et évite erreurs dossier lorsque la pile est élevée hors saison creuse.
      </p>

      <h2>Structurer sans recruter en pleine saison</h2>
      <p>
        Recruter un binôme bureau en plein pic chantier prend du retard et fige vos charges alors que vos carnets suivent cycles
        bâtiments. Externaliser sous forfait TTC évite cet effet «&nbsp;dents creuses puis surcharge&nbsp;» puisque vos paliers{" "}
        <Link href="/tarifs" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
          correspondent à un niveau défini au contrat
        </Link>{" "}
        plutôt qu&apos;à une fiche paie évolutive.
      </p>

      <div className="not-prose my-10 flex flex-wrap gap-4">
        <Link href="/contact" className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-bold text-white hover:bg-[#1e40af]">
          Réserver un appel
        </Link>
        <Link
          href="/contact"
          className="inline-flex rounded-lg border-2 border-[#1d4ed8] px-6 py-3 font-bold text-[#1d4ed8] hover:bg-[#eff6ff]"
        >
          Demander un diagnostic offert
        </Link>
      </div>

      <GeoExternalisationHubLinks currentHref={PAGE_PATH} />
    </SeoLandingPage>
  );
}
