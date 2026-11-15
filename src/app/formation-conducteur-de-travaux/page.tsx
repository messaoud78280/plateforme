import type { Metadata } from "next";
import { BtpFormationLanding } from "@/components/marketing-btp/BtpFormationLanding";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.formationConducteur;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

export default function FormationConducteurPage() {
  return (
    <BtpFormationLanding
      path={seo.path}
      title={seo.title}
      description={seo.description}
      eyebrow="FORMATION CONDUCTEUR DE TRAVAUX"
      h1="Formation pratique pour conducteurs de travaux."
      subtitle="Organisation, coordination, suivi technique et administratif des chantiers. Formation orientée terrain pour les salariés du BTP — programmes à préciser sur devis."
      bullets={[
        "Lecture de plans et pièces marché",
        "Préparation et planification de chantier",
        "Coordination des intervenants et sous-traitants",
        "Suivi qualité, délais et reporting",
        "Interfaces avec la maîtrise d’œuvre et l’entreprise",
      ]}
    />
  );
}
