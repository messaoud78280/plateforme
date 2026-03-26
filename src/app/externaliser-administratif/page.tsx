import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/externaliser-administratif");

export const metadata: Metadata = {
  title: "Externaliser son administratif | BeWork — PME France, Belgique, Suisse",
  description:
    "Externaliser administratif PME : assistant virtuel pour devis, factures, relances. Sans recrutement. Dès 215 € TTC/mois. France, Belgique, Suisse, Luxembourg.",
  alternates: { canonical: pageUrl },
};

export default function Page() {
  return (
    <SeoLandingPage
      title="Externaliser son administratif"
      description="Externaliser administratif PME"
      h1="Externaliser son administratif : guide et bonnes pratiques"
      intro={
        <>
          Externaliser administratif PME permet de recentrer vos équipes sur le cœur de métier tout en sécurisant
          devis, factures et relances. BeWork propose un assistant administratif externalisé dédié, sans recrutement.
          Dès 215 € TTC/mois — France, Belgique, Suisse, Luxembourg.
        </>
      }
    >
      <h2>Pourquoi externaliser l&apos;administratif ?</h2>
      <p>
        Les tâches administratives chronophages (emails, facturation, suivi dossiers) peuvent être externalisées avec
        un assistant virtuel entreprise. Vous gagnez du temps, vous maîtrisez vos coûts et vous gardez la main sur la
        qualité grâce à une équipe supervisée en France.
      </p>

      <h2>Que peut-on externaliser ?</h2>
      <p>
        Secrétariat (agenda, courriers), facturation (devis, factures, relances), suivi de dossiers, saisie documentaire,
        pré-comptabilité. BeWork couvre l&apos;essentiel de l&apos;administratif opérationnel des PME.
      </p>

      <h2>Externaliser administratif PME : combien ça coûte ?</h2>
      <p>
        BeWork propose des forfaits dès 215€/mois (formule Standard). Pas de charges sociales, pas de recrutement :
        un forfait tout compris. Jusqu&apos;à 75 % d&apos;économie par rapport à un assistant en interne.
      </p>
    </SeoLandingPage>
  );
}
