import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bework.fr";

export const metadata: Metadata = {
  title: "Assistant administratif à distance | BeWork",
  description:
    "Assistant administratif à distance pour PME et indépendants. Devis, factures, relances, suivi dossiers. Plateforme supervisée depuis la France. Dès 215€/mois.",
  alternates: { canonical: `${BASE_URL}/assistant-administratif-distance` },
};

export default function Page() {
  return (
    <SeoLandingPage
      title="Assistant administratif à distance"
      description="Assistant administratif à distance"
      h1="Assistant administratif à distance : même qualité qu&apos;en interne"
      intro={
        <>
          L&apos;assistant administratif à distance BeWork travaille depuis notre plateforme, supervisée depuis la France.
          Devis, factures, relances, agenda : vous déléguez l&apos;administratif sans recruter. Pour PME et indépendants
          en France, Belgique, Suisse et Luxembourg. Dès 215€/mois.
        </>
      }
    >
      <h2>Comment fonctionne un assistant administratif à distance ?</h2>
      <p>
        Vous envoyez vos tâches via la plateforme BeWork, votre assistant les traite à distance et vous livre les résultats.
        Messagerie intégrée, suivi des tâches en temps réel et historique complet. Aucun déplacement requis :
        l&apos;assistant administratif à distance s&apos;adapte à votre rythme.
      </p>

      <h2>Avantages pour les indépendants et PME</h2>
      <p>
        Gain de temps, flexibilité, coût maîtrisé. Un assistant virtuel entreprise à distance évite le recrutement et
        les charges associées. Vous payez un forfait tout compris et réglez uniquement les actions consommées.
      </p>

      <h2>Qualité et supervision</h2>
      <p>
        Direction et supervision en France, assistants francophones Bac+5 formés à l&apos;IA. Même fuseau horaire,
        même niveau d&apos;exigence. BeWork garantit une collaboration fluide et professionnelle.
      </p>
    </SeoLandingPage>
  );
}
