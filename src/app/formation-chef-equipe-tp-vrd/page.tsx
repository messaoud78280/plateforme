import type { Metadata } from "next";
import { BtpFormationLanding } from "@/components/marketing-btp/BtpFormationLanding";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.formationChefEquipe;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

export default function FormationChefEquipeTpVrdPage() {
  return (
    <BtpFormationLanding
      path={seo.path}
      title={seo.title}
      description={seo.description}
      eyebrow="FORMATION CHEF D’ÉQUIPE TP/VRD"
      h1="Formation chef d’équipe TP/VRD sur chantier."
      subtitle="Organisation d’équipe, implantation, production et contrôle d’exécution en travaux publics et VRD — formation pratique adaptée aux ouvrages."
      bullets={[
        "Répartition des travaux et suivi de production",
        "Lecture de plans et implantation",
        "Contrôle altimétrique et tolérances",
        "Application des modes opératoires VRD",
        "Coordination des compagnons et du matériel",
      ]}
    />
  );
}
