import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { GeoExternalisationHubLinks } from "@/components/seo/GeoExternalisationHubLinks";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import {
  EXTERNALISATION_ADMIN_BT_PATHS,
  hreflangExternalisationAdministrativeBtpCluster,
} from "@/lib/externalisation-administrative-btp-geo";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = EXTERNALISATION_ADMIN_BT_PATHS.suisse;

export const metadata = landingPageMetadataFromPath(PAGE_PATH, { hreflangLanguages: hreflangExternalisationAdministrativeBtpCluster() });

export default function Page() {
  const faq = [
    {
      q: "BeWork peut-elle accompagner une entreprise BTP en Suisse romande ?",
      a: "Oui. La collaboration se fait à distance : demandes, pièces et suivis passent par la plateforme (ou le canal cadré). Vous gardez la validation finale sur ce qui engage.",
    },
    {
      q: "Quelles tâches peuvent être suivies à distance ?",
      a: "Dossiers chantier, documents travaux, comptes rendus, relances, statuts et suivis. Les choix techniques et engagements restent chez vous.",
    },
    {
      q: "Qui garde la responsabilité des décisions et documents ?",
      a: "Vous. BeWork prépare, structure et suit, mais ne remplace pas un bureau d’études, un maître d’œuvre ou un expert technique. Les décisions qui engagent passent par votre validation.",
    },
  ] as const;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <SeoLandingPage
      description="Assistance travaux BTP en Suisse romande : dossiers chantier structurés, relances et pièces marché."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Assistance travaux BTP — Suisse", href: PAGE_PATH },
      ]}
      h1="Assistance travaux BTP en Suisse romande : dossiers chantier clairs, sans recruter"
      intro={
        <>
          En Suisse romande, les attentes de clarté et de rigueur documentaire sont élevées. Un dossier chantier bien structuré,
          des statuts suivis et des relances propres évitent les pertes de temps et les tensions. BeWork apporte une{" "}
          <strong>assistance technique et administrative</strong> : préparation, classement, suivi — avec validation finale côté
          client.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Pourquoi externaliser une partie du suivi bureau‑chantier</h2>
      <ul>
        <li>Éviter que les documents, preuves et échanges se dispersent.</li>
        <li>Tenir les échéances et statuts sans y laisser vos soirées.</li>
        <li>Garder une traçabilité propre, utile en réception et en réserve.</li>
      </ul>

      <h2>Ce que BeWork peut gérer (sur un périmètre cadré)</h2>
      <ul>
        <li>Suivi des demandes et documents travaux (classement, checklists, diffusion)</li>
        <li>Comptes rendus et pièces chantier mis au propre</li>
        <li>Relances et suivis (clients / pièces / validations) avec traçabilité</li>
        <li>Réserves et préparation DOE (organisation, compilation progressive)</li>
      </ul>

      <h2>Comment ça fonctionne à distance</h2>
      <ul>
        <li>Demandes et pièces centralisées.</li>
        <li>Suivi des statuts, échéances et points bloquants.</li>
        <li>Validation finale côté client sur ce qui engage.</li>
      </ul>

      <div className="not-prose my-10 flex flex-wrap gap-4">
        <CalendlyBookingLink className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-bold text-white hover:bg-[#1e40af]">
          Réserver un appel découverte
        </CalendlyBookingLink>
        <Link href="/assistants-administratifs-taches" className="inline-flex rounded-lg border border-slate-200 bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-50">
          Voir les missions
        </Link>
        <Link href="/notre-facon-de-travailler" className="inline-flex rounded-lg border border-slate-200 bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-50">
          Voir la méthode
        </Link>
        <Link href="/tarifs" className="inline-flex rounded-lg border border-slate-200 bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-50">
          Voir les forfaits
        </Link>
      </div>

      <GeoExternalisationHubLinks currentHref={PAGE_PATH} />
    </SeoLandingPage>
  );
}
