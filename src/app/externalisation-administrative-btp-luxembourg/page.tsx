import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { GeoExternalisationHubLinks } from "@/components/seo/GeoExternalisationHubLinks";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import {
  EXTERNALISATION_ADMIN_BT_PATHS,
  hreflangExternalisationAdministrativeBtpCluster,
} from "@/lib/externalisation-administrative-btp-geo";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = EXTERNALISATION_ADMIN_BT_PATHS.luxembourg;

export const metadata = landingPageMetadataFromPath(PAGE_PATH, { hreflangLanguages: hreflangExternalisationAdministrativeBtpCluster() });

export default function Page() {
  const faq = [
    {
      q: "BeWork peut-elle accompagner une entreprise BTP au Luxembourg ?",
      a: "Oui, notamment quand vos échanges métier sont en français (clients, équipes, dossiers). On cadre le périmètre au démarrage et vous gardez la validation finale sur ce qui engage.",
    },
    {
      q: "Quelles tâches peuvent être suivies à distance ?",
      a: "Suivi devis/relances, documents travaux, situations/factures, dossiers chantier, relances et coordination multi‑interlocuteurs. Vous validez les points sensibles.",
    },
    {
      q: "Qui garde la responsabilité des documents et validations ?",
      a: "Votre entreprise. BeWork prépare, structure et suit, mais vous gardez la validation finale (prix, technique, signatures, engagements) et les responsabilités réglementaires locales.",
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
      description="Externalisation administrative BTP au Luxembourg : relais bureau‑chantier pour dossiers et relances, sans recruter."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Externalisation administrative BTP — Luxembourg", href: PAGE_PATH },
      ]}
      h1="Externalisation administrative BTP au Luxembourg : un relais bureau‑chantier traçable"
      intro={
        <>
          Au Luxembourg, la coordination peut vite se complexifier : multi‑interlocuteurs, rythmes soutenus, dossiers qui passent
          du bureau au terrain (et inversement). BeWork vous aide à tenir le suivi côté bureau : documents, relances, statuts,
          points bloquants — avec un cadre clair et une validation finale côté client.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Pourquoi externaliser une partie du suivi bureau‑chantier</h2>
      <ul>
        <li>Charge variable : vous avez besoin d’un relais, pas forcément d’une embauche immédiate.</li>
        <li>Documents et relances doivent avancer même quand le terrain accélère.</li>
        <li>Traçabilité utile quand plusieurs interlocuteurs interviennent sur le même dossier.</li>
      </ul>

      <h2>Ce que BeWork peut gérer (liste courte)</h2>
      <ul>
        <li>Devis & relances (préparation, statuts, prochaines actions)</li>
        <li>Situations / factures : préparation, pièces, relances courtoises</li>
        <li>Documents travaux et dossiers : classement, checklists, diffusion cadrée</li>
        <li>Suivi réserves et préparation DOE (sur périmètre cadré)</li>
        <li>Fournisseurs / locations : confirmations, relances, livraisons</li>
      </ul>

      <h2>Comment ça fonctionne à distance</h2>
      <ul>
        <li>Demandes et pièces transmises via la plateforme (ou canal cadré).</li>
        <li>Suivi des statuts, échéances et points bloquants.</li>
        <li>Validation finale côté client sur ce qui engage.</li>
      </ul>

      <div className="not-prose my-10 flex flex-wrap gap-4">
        <CalendlyBookingLink className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-bold text-white hover:bg-[#1e40af]">
          Réserver un appel avec BeWork
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
