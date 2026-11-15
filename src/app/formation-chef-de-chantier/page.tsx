import type { Metadata } from "next";
import { BtpFormationLanding } from "@/components/marketing-btp/BtpFormationLanding";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.formationChefChantier;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

export default function FormationChefChantierPage() {
  return (
    <BtpFormationLanding
      path={seo.path}
      title={seo.title}
      description={seo.description}
      eyebrow="FORMATION CHEF DE CHANTIER"
      h1="Formation chef de chantier orientée exécution."
      subtitle="Organisation quotidienne, contrôles d’exécution, coordination des lots et sécurité de production — formation pratique pour les entreprises du BTP."
      bullets={[
        "Organisation du poste et des équipes",
        "Contrôle d’exécution et non-conformités",
        "Interfaces entre corps d’état",
        "Approvisionnements et moyens",
        "Reporting terrain et points bloquants",
      ]}
    />
  );
}
