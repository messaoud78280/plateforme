import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/assistant-administratif-externalise";

export const metadata = landingPageMetadata({
  title: "Assistant administratif externalisé pour PME | BeWork",
  description:
    "L'assistant administratif externalisé BeWork prend en charge devis, factures, relances et suivi de dossiers pour les PME. Dès 290 € TTC/mois. France, Belgique, Suisse, Luxembourg.",
  path: PAGE_PATH,
  keywords: ["assistant administratif externalisé", "externalisation administrative PME", "BeWork", "assistant virtuel entreprise"],
});

export default function Page() {
  return (
    <SeoLandingPage
      description="L'assistant administratif externalisé BeWork prend en charge devis, factures, relances et suivi de dossiers pour les PME. Dès 290 € TTC/mois. France, Belgique, Suisse, Luxembourg."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Assistant administratif externalisé", href: PAGE_PATH },
      ]}
      h1="Assistant administratif externalisé : déchargez votre entreprise"
      intro={
        <>
          Un assistant administratif externalisé permet aux PME d&apos;externaliser leur administratif sans recruter.
          Devis, factures, relances, suivi de dossiers : BeWork accompagne les dirigeants avec un assistant virtuel
          entreprise dédié. France, Belgique, Suisse, Luxembourg — dès 290 € TTC/mois.
        </>
      }
    >
      <h2>Pourquoi choisir un assistant administratif externalisé ?</h2>
      <p>
        Externaliser votre administratif avec un assistant dédié offre plusieurs avantages : gain de temps, coût maîtrisé
        (pas de charges sociales ni recrutement), réactivité et qualité professionnelle. L&apos;assistant administratif
        externalisé travaille à distance, dans le respect de vos process et de votre secteur.
      </p>

      <h2>Que fait un assistant administratif externalisé BeWork ?</h2>
      <p>
        Nos assistants gèrent les tâches courantes : emails, devis, factures, relances clients et fournisseurs, agenda,
        suivi de dossiers, saisie et classement de documents. Ils s&apos;adaptent à votre secteur (BTP en priorité, PME,
        indépendants, services) et travaillent avec vos outils.
      </p>

      <h2>Pour qui ?</h2>
      <p>
        Dirigeants, PME, TPE, indépendants et cabinets qui souhaitent externaliser administratif PME sans recruter.
        BeWork propose des forfaits dès 290 € TTC/mois, avec une équipe francophone supervisée depuis la France.
      </p>
    </SeoLandingPage>
  );
}
