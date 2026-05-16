import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { GeoExternalisationHubLinks } from "@/components/seo/GeoExternalisationHubLinks";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import {
  EXTERNALISATION_ADMIN_BT_PATHS,
  hreflangExternalisationAdministrativeBtpCluster,
} from "@/lib/externalisation-administrative-btp-geo";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = EXTERNALISATION_ADMIN_BT_PATHS.france;

export const metadata = landingPageMetadata({
  title: "Externalisation administrative BTP en France | Assistante travaux & dossiers chantier — BeWork",
  description:
    "Externalisation administrative BTP en France : devis, relances, situations, DOE. Assistante travaux, sans recruter.",
  path: PAGE_PATH,
  keywords: [
    "externalisation administrative BTP France",
    "assistante travaux BTP France",
    "assistante BTP France",
    "relais travaux France",
    "dossiers chantier",
    "suivi bureau-terrain",
    "suivi devis et relances",
    "documents travaux",
  ],
  hreflangLanguages: hreflangExternalisationAdministrativeBtpCluster(),
});

export default function Page() {
  const faq = [
    {
      q: "BeWork peut-elle accompagner une entreprise BTP en France ?",
      a: "Oui. BeWork fonctionne à distance partout en France : vous transmettez vos demandes, nous préparons et suivons les dossiers, et vous validez ce qui engage votre entreprise.",
    },
    {
      q: "Quelles tâches peuvent être suivies à distance ?",
      a: "Devis et relances, situations/factures, documents travaux, comptes rendus, suivi fournisseurs/locations, réserves et préparation DOE (sur périmètre cadré).",
    },
    {
      q: "Qui garde la validation et la responsabilité ?",
      a: "Vous. BeWork prépare, structure, relance et suit, mais vous gardez la validation finale sur le prix, les choix techniques, les signatures et les engagements contractuels.",
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
      description="Externalisation administrative BTP en France : un relais travaux pour tenir vos dossiers chantier, sans recruter."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Externalisation administrative BTP — France", href: PAGE_PATH },
      ]}
      h1="Externalisation administrative BTP en France : un relais travaux pour vos dossiers chantier"
      intro={
        <>
          En France, beaucoup d’entreprises du bâtiment tiennent le terrain… mais le bureau décroche dès que le carnet se remplit.
          Le sujet n’est pas “faire du secrétariat” : c’est tenir un <strong>relais bureau‑chantier</strong> pour que les dossiers
          avancent (devis, relances, situations, documents travaux, réserves), avec une <strong>validation finale</strong> côté client.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Pourquoi externaliser une partie du suivi BTP (sans recruter)</h2>
      <ul>
        <li>Charge variable selon les chantiers et les périodes.</li>
        <li>Devis, relances, situations et documents qui doivent avancer même quand vous êtes sur site.</li>
        <li>Besoin de traçabilité (preuves, comptes rendus, réserves) pour éviter les litiges.</li>
        <li>Un cadre souple avant une éventuelle embauche interne.</li>
      </ul>

      <h2>Ce que BeWork peut gérer (version terrain)</h2>
      <ul>
        <li>Devis & relances (préparation, suivi des réponses, statuts)</li>
        <li>Situations / factures (préparation, pièces, relances courtoises)</li>
        <li>Documents travaux (classement, checklists, diffusion cadrée)</li>
        <li>Comptes rendus, réserves, préparation DOE (sur périmètre cadré)</li>
        <li>Fournisseurs & locations (confirmations, relances, livraisons)</li>
      </ul>

      <h2>Comment ça fonctionne à distance</h2>
      <ul>
        <li>Vous envoyez vos demandes et pièces (plateforme / canal cadré).</li>
        <li>BeWork analyse, prépare et suit les échéances.</li>
        <li>Vous validez ce qui engage (prix, technique, signatures, réponses sensibles).</li>
        <li>Tout reste traçable : statuts, historique, documents classés.</li>
      </ul>

      <h2>Ce que vous gardez</h2>
      <ul>
        <li>Prix, marges et décisions commerciales</li>
        <li>Choix techniques et arbitrages terrain</li>
        <li>Signatures, engagements contractuels, relation client sensible</li>
        <li>Responsabilités réglementaires locales</li>
      </ul>

      <div className="not-prose my-10 flex flex-wrap gap-4">
        <CalendlyBookingLink className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-bold text-white hover:bg-[#1e40af]">
          Réserver un appel
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
