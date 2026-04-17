import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/assistant-administratif-pme";

export const metadata = landingPageMetadata({
  title: "Assistant administratif PME | Externaliser l'administratif | BeWork",
  description:
    "Assistant administratif pour PME : externaliser devis, factures, relances. Assistant virtuel entreprise dès 290 € TTC/mois. France, Belgique, Suisse, Luxembourg.",
  path: PAGE_PATH,
  keywords: ["assistant administratif PME", "assistant virtuel entreprise", "externaliser administratif", "secrétariat externalisé"],
});

export default function Page() {
  return (
    <SeoLandingPage
      description="Assistant administratif pour PME : externaliser devis, factures, relances. Assistant virtuel entreprise dès 290 € TTC/mois. France, Belgique, Suisse, Luxembourg."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Assistant administratif PME", href: PAGE_PATH },
      ]}
      h1="Assistant administratif pour PME : externaliser sans recruter"
      intro={
        <>
          Les PME peuvent externaliser leur administratif avec un assistant virtuel entreprise dédié. Devis, factures,
          relances, suivi de dossiers : BeWork accompagne les dirigeants de PME en France, Belgique, Suisse et Luxembourg.
          Assistant administratif externalisé dès 290 € TTC/mois.
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
        BeWork propose des forfaits dès 290 € TTC/mois (offre Structure). Externaliser administratif PME coûte jusqu&apos;à
        75 % moins cher qu&apos;un recrutement interne. Tout est inclus : équipe francophone, supervision en France.
      </p>
    </SeoLandingPage>
  );
}
