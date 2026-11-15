import type { Metadata } from "next";
import { BtpFormationLanding } from "@/components/marketing-btp/BtpFormationLanding";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.formationModes;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

export default function FormationModesOperatoiresPage() {
  return (
    <BtpFormationLanding
      path={seo.path}
      title={seo.title}
      description={seo.description}
      eyebrow="FORMATION MODES OPÉRATOIRES"
      h1="Transmission des modes opératoires et exigences techniques."
      subtitle="Former les équipes aux méthodes d’exécution et aux exigences des ouvrages — sur chantier, au plus près de la production."
      bullets={[
        "Analyse de l’ouvrage et des prescriptions",
        "Étapes de réalisation et organisation du poste",
        "Démonstration et transmission des gestes",
        "Points de contrôle et tolérances",
        "Bilan et recommandations pour l’équipe",
      ]}
    />
  );
}
