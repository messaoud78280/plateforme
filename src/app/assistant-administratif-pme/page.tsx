import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bework.fr";

export const metadata: Metadata = {
  title: "Assistant administratif PME | Externaliser l'administratif | BeWork",
  description:
    "Assistant administratif pour PME : externaliser devis, factures, relances. Assistant virtuel entreprise dès 215€/mois. France, Belgique, Suisse, Luxembourg.",
  alternates: { canonical: `${BASE_URL}/assistant-administratif-pme` },
};

export default function Page() {
  return (
    <SeoLandingPage
      title="Assistant administratif PME"
      description="Externaliser administratif PME"
      h1="Assistant administratif pour PME : externaliser sans recruter"
      intro={
        <>
          Les PME peuvent externaliser leur administratif avec un assistant virtuel entreprise dédié. Devis, factures,
          relances, suivi de dossiers : BeWork accompagne les dirigeants de PME en France, Belgique, Suisse et Luxembourg.
          Assistant administratif externalisé dès 215€/mois.
        </>
      }
    >
      <h2>Pourquoi externaliser administratif PME ?</h2>
      <p>
        Les PME manquent souvent de temps et de ressources pour gérer l&apos;administratif en interne. Un assistant
        administratif à distance permet de déléguer devis, factures, relances et suivi de dossiers sans recruter,
        sans charges sociales ni coût d&apos;infrastructure.
      </p>

      <h2>Que fait un assistant administratif pour PME ?</h2>
      <p>
        Emails, devis clients, factures, relances impayées, agenda, suivi des commandes, saisie documentaire,
        pré-comptabilité. L&apos;assistant administratif PME s&apos;adapte à votre secteur et à vos outils.
      </p>

      <h2>Combien coûte un assistant administratif pour PME ?</h2>
      <p>
        BeWork propose des forfaits dès 215€/mois (formule Standard). Externaliser administratif PME coûte jusqu&apos;à
        75 % moins cher qu&apos;un recrutement interne. Tout est inclus : équipe francophone, supervision en France.
      </p>
    </SeoLandingPage>
  );
}
