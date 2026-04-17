import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/admin-btp-sans-recruter";

export const metadata = landingPageMetadata({
  title: "Administratif BTP sans recruter : structurer et suivre | BeWork",
  description:
    "Structurer l’administratif BTP sans recruter : devis, relances, dossiers, DT/DICT, situations. Pilotage encadré avec validations. Forfaits TTC.",
  path: PAGE_PATH,
  keywords: ["administratif BTP sans recruter", "externalisation administrative BTP", "pilotage administratif", "forfait administratif"],
});

export default function Page() {
  const faq = [
    {
      q: "Pourquoi le forfait colle mieux au BTP qu’un recrutement ?",
      a: "L’activité est cyclique : chiffrage puis terrain. Un forfait permet d’ajuster le niveau de suivi sans porter un poste fixe (charges, management, recrutement).",
    },
    {
      q: "BeWork fait-il du secrétariat ?",
      a: "Non. BeWork vend du suivi et de la structuration : demandes cadrées, exécution, relances, reporting, et validations sur les points sensibles.",
    },
    {
      q: "Qu’est-ce qui reste chez le dirigeant ?",
      a: "Les décisions engageantes : prix, arbitrages techniques, litiges, choix critiques. Le but est de vous libérer du suivi et des relances, pas de remplacer votre expertise.",
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
      description="Structurer l’administratif BTP sans recruter : devis, relances, dossiers, DT/DICT, situations. Pilotage encadré avec validations. Forfaits TTC."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Administratif BTP sans recruter", href: PAGE_PATH },
      ]}
      h1="Administratif BTP sans recruter : structurer le bureau, sécuriser les chantiers"
      intro={
        <>
          Quand le terrain accélère, le bureau décroche : devis en retard, relances oubliées, dossiers qui s’empilent.
          BeWork met en place un pilotage administratif encadré pour structurer le suivi (devis, factures, relances,
          dossiers chantier) sans créer un poste en interne.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Le problème n’est pas “l’administratif”, c’est l’absence de système</h2>
      <p>
        Un minimum de flux (commercial, facturation, suivi client, réglementaire) doit être tenu chaque semaine, sinon
        l’important bureau devient urgent — et coûte du chiffre d’affaires.
      </p>

      <h2>Ce que BeWork met en place</h2>
      <p>
        Demandes cadrées, exécution rapide, suivi traçable, relances régulières, classement par chantier, indicateurs.
        Vous validez les points sensibles, nous tenons le dossier.
      </p>

      <h2>Résultat : plus de régularité, moins de stress, CA mieux sécurisé</h2>
      <p>
        En tenant le bureau au même niveau d’exigence que le chantier, vous gagnez en fiabilité et vous exploitez mieux
        vos opportunités.
      </p>
    </SeoLandingPage>
  );
}

