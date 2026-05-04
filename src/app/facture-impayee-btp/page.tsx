import Link from "next/link";
import { BtpPainLandingMaillage } from "@/components/seo/BtpPainLandingMaillage";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { BTP_PAIN_PAGE_PATHS } from "@/lib/btp-pain-pages";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = BTP_PAIN_PAGE_PATHS.factureImpayee;

export const metadata = landingPageMetadata({
  title: "Facture impayée BTP : relances structurées & trésorerie chantier | BeWork",
  description:
    "Retard de paiement chantier : factures impayées qui fragilisent la trésorerie. Relance facture bâtiment cadrée, suivi encaissements et remontée des cas sensibles — forfaits TTC.",
  path: PAGE_PATH,
  keywords: [
    "facture impayée BTP",
    "relance facture bâtiment",
    "retard paiement chantier",
    "trésorerie entreprise BTP",
    "encaissement artisan",
    "impayés chantier",
  ],
});

export default function Page() {
  const faq = [
    {
      q: "Relancer sans « casser » la relation client : comment ?",
      a: "Des messages factuels, un calendrier régulier, une traçabilité. L’objectif est une date d’encaissement ou un plan annoncé — pas une guerre de nervis. BeWork aligne le ton sur vos consignes.",
    },
    {
      q: "Quelle différence avec un simple logiciel de relance ?",
      a: "Un outil envoie des modèles. BeWork complète par exécution humaine : relances contextuelles, mise à jour tableau, relance des pièces manquantes (situation, validation d’avancement) et remontée des blocages à valider avec vous.",
    },
    {
      q: "Que se passe-t-il sur les cas sensibles (mise en demeure, litige) ?",
      a: "Nous préparons le dossier factuel et signalons tôt. Les étapes juridiquement engageantes restent sous votre décision explicite.",
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
      description="Factures impayées en BTP : pourquoi la trésorerie chute vite, et comment des relances structurées protègent votre marge et votre calme."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Facture impayée — BTP", href: PAGE_PATH },
      ]}
      h1="Facture impayée en BTP — quand la trésorerie chantier dérape"
      intro={
        <>
          Un retard de paiement isolé passe. Mais quand plusieurs factures traînent après des situations mal cadrées, la
          trésorerie se tend avant même que le prochain chantier démarre. Les factures impayées sont souvent symptomatiques
          d’un suivi incomplet avant l’impayé. BeWork organise relances encaissement, dossier et signaux précoces tout en
          respectant votre ton commercial.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Ce que vous perdez aujourd’hui</h2>
      <ul>
        <li>
          <strong>De la capacité à financer chantier suivant</strong> si l’argent reste trop longtemps en attente.
        </li>
        <li>
          <strong>Des marges en stress</strong> quand on accepte remises sous pression de cash pour éviter confrontation.
        </li>
        <li>
          <strong>Du temps équipe dirigeante</strong> qui appelle trois fois sans méthode plutôt qu’avec un calendrier clair.
        </li>
      </ul>

      <h2>Pourquoi ça arrive</h2>
      <p>
        Parfois le client retarde réellement. Souvent aussi, la chaîne était fragile avant : validations floues, situations
        en retard ou pièces manquantes. Sans tableau de suivis et sans relances disciplinées, l’argent glisse jusqu’à devenir une
        négociation émotionnelle au lieu d’un simple encaissement.
      </p>

      <h2>Comment BeWork vous aide</h2>
      <p>
        Nous suivons retard paiement chantier avec relances régulières, mise à jour d’un tableau de suivi lisible pour vous,
        recherche cordée des motifs (validation interne GO, problème chantier invoqué) et escalade préparée quand nécessaire.
        L&apos;ensemble s’articule avec votre façon de travailler : pas une machine à envoyer des mails agressifs.
      </p>

      <h2>Bénéfices concrets</h2>
      <ul>
        <li>Des encaissements plus prévisibles grâce à des relances constantes plutôt qu’à des coups de fil panique.</li>
        <li>Une image plus maîtrisée : pro, factuel, traçable.</li>
        <li>Moins de trous de trésorerie artificiels liés à l’oubli pur et simple.</li>
      </ul>

      <h2>Questions fréquentes</h2>
      <dl className="space-y-6">
        {faq.map((item) => (
          <div key={item.q}>
            <dt className="font-semibold text-black">{item.q}</dt>
            <dd className="mt-2 text-black leading-relaxed">{item.a}</dd>
          </div>
        ))}
      </dl>

      <div className="not-prose my-10 flex flex-wrap gap-4">
        <Link href="/contact" className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-bold text-white hover:bg-[#1e40af]">
          Réserver un appel
        </Link>
        <Link
          href="/impayes-btp-relances"
          className="inline-flex rounded-lg border-2 border-[#1d4ed8] px-6 py-3 font-bold text-[#1d4ed8] hover:bg-[#eff6ff]"
        >
          Méthode relances impayés
        </Link>
      </div>

      <BtpPainLandingMaillage currentHref={PAGE_PATH} />
    </SeoLandingPage>
  );
}
