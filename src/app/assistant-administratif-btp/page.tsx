import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/assistant-administratif-btp");

export const metadata: Metadata = {
  title: "Assistant administratif BTP | Devis, suivi chantiers | BeWork",
  description:
    "Assistant administratif pour le BTP : devis chantiers, suivi sous-traitants, relances factures. PME BTP France, Belgique, Suisse. Dès 215 € TTC/mois.",
  alternates: { canonical: pageUrl },
};

export default function Page() {
  return (
    <SeoLandingPage
      title="Assistant administratif BTP"
      description="Assistant administratif pour le BTP"
      h1="Assistant administratif pour le BTP : devis, chantiers, relances"
      intro={
        <>
          Les entreprises du BTP peuvent externaliser leur administratif avec un assistant dédié : devis chantiers,
          suivi des sous-traitants, relances factures fournisseurs. BeWork accompagne les PME BTP en France, Belgique,
          Suisse et Luxembourg. Dès 215 € TTC/mois.
        </>
      }
    >
      <h2>Missions clés pour le BTP</h2>
      <p>
        Devis chantiers, suivi des sous-traitants, relances factures, mise à jour des plannings, coordination avec
        les fournisseurs, archivage des pièces. Notre assistant administratif BTP s&apos;adapte à vos process et
        à votre métier.
      </p>

      <h2>Pourquoi les entreprises BTP choisissent BeWork ?</h2>
      <p>
        Réactivité, équipe francophone, coût maîtrisé. Pas de recrutement ni d&apos;infrastructure : l&apos;assistant
        externalisé est opérationnel rapidement. Supervision en France pour une qualité et une réactivité optimales.
      </p>

      <h2>À qui s&apos;adresse ce service ?</h2>
      <p>
        Artisans, PME BTP, entreprises de construction et de rénovation qui souhaitent déléguer l&apos;administratif
        pour se concentrer sur les chantiers. BeWork propose des forfaits adaptés au volume de tâches.
      </p>
    </SeoLandingPage>
  );
}
