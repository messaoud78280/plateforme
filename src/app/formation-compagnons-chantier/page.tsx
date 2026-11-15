import type { Metadata } from "next";
import { BtpFormationLanding } from "@/components/marketing-btp/BtpFormationLanding";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.formationCompagnons;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

export default function FormationCompagnonsPage() {
  return (
    <BtpFormationLanding
      path={seo.path}
      title={seo.title}
      description={seo.description}
      eyebrow="FORMATION COMPAGNONS SUR CHANTIER"
      h1="Formation des compagnons directement sur l’ouvrage."
      subtitle="Gestes professionnels, exigences techniques et qualité d’exécution — transmission pratique adaptée aux ouvrages à réaliser."
      bullets={[
        "Compréhension des plans et prescriptions",
        "Gestes professionnels et enchaînements",
        "Points de vigilance et erreurs fréquentes",
        "Contrôles simples en cours d’exécution",
        "Amélioration des méthodes de poste",
      ]}
    />
  );
}
