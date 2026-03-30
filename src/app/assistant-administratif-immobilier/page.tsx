import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/assistant-administratif-immobilier");

export const metadata: Metadata = {
  title: "Assistant administratif immobilier | Dossiers, relances loyers | BeWork",
  description:
    "Assistant administratif pour l'immobilier : dossiers locataires, relances loyers, gestion locative. Agences immobilières France, Belgique, Suisse. Dès 290 € TTC/mois.",
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
};

export default function Page() {
  return (
    <SeoLandingPage
      title="Assistant administratif immobilier"
      description="Assistant administratif pour l'immobilier"
      h1="Assistant administratif immobilier : dossiers, relances, gestion locative"
      intro={
        <>
          Les agences immobilières et gestionnaires de biens peuvent externaliser leur administratif : dossiers
          locataires, relances loyers, état des lieux, gestion des demandes. BeWork accompagne les professionnels
          de l&apos;immobilier en France, Belgique, Suisse et Luxembourg. Dès 290 € TTC/mois.
        </>
      }
    >
      <h2>Missions pour l&apos;immobilier</h2>
      <p>
        Collecte et suivi des dossiers locataires, relances de loyers, coordination des états des lieux, mise à jour
        des bases de données, gestion des demandes locataires et propriétaires. L&apos;assistant administratif
        immobilier BeWork s&apos;adapte à vos outils et process.
      </p>

      <h2>Avantages pour les agences immobilières</h2>
      <p>
        Gain de temps sur les tâches répétitives, réactivité vis-à-vis des locataires et propriétaires, coût maîtrisé.
        Un assistant externalisé évite le recrutement et permet de scaler selon le volume de dossiers.
      </p>

      <h2>Supervision et qualité</h2>
      <p>
        Équipe francophone supervisée depuis la France, plateforme de suivi en temps réel. BeWork garantit une
        collaboration fluide et des livrables de qualité pour vos dossiers immobiliers.
      </p>
    </SeoLandingPage>
  );
}
