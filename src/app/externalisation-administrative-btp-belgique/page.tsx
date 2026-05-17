import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { GeoExternalisationHubLinks } from "@/components/seo/GeoExternalisationHubLinks";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import {
  EXTERNALISATION_ADMIN_BT_PATHS,
  hreflangExternalisationAdministrativeBtpCluster,
} from "@/lib/externalisation-administrative-btp-geo";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = EXTERNALISATION_ADMIN_BT_PATHS.belgique;

export const metadata = landingPageMetadataFromPath(PAGE_PATH, { hreflangLanguages: hreflangExternalisationAdministrativeBtpCluster() });

export default function Page() {
  const faq = [
    {
      q: "BeWork peut-elle accompagner une entreprise BTP en Belgique ?",
      a: "Oui, pour les entreprises francophones (Wallonie / Bruxelles, ou flux métier en français). On cadre le périmètre au démarrage et vous gardez la validation finale sur ce qui engage.",
    },
    {
      q: "Quelles tâches peuvent être suivies à distance ?",
      a: "Devis et relances, situations/factures, documents chantier, comptes rendus, suivi des demandes, réserves et préparation DOE (sur périmètre cadré), avec traçabilité.",
    },
    {
      q: "BeWork remplace-t-elle une assistante salariée locale ?",
      a: "Non. BeWork est un relais bureau‑chantier cadré, utile quand la charge varie ou avant une embauche. Un poste interne reste pertinent si le besoin est constant au quotidien.",
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
      description="Externalisation administrative BTP en Belgique : un relais travaux pour tenir vos dossiers chantier (flux francophones)."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Externalisation administrative BTP — Belgique", href: PAGE_PATH },
      ]}
      h1="Externalisation administrative BTP en Belgique : un relais bureau‑chantier pour vos dossiers"
      intro={
        <>
          En Belgique, beaucoup d’équipes avancent vite sur le terrain, mais le suivi bureau‑chantier se fragmente : devis non
          relancés, situations qui traînent, documents introuvables, demandes client oubliées. Pour les entreprises francophones,
          BeWork pose un <strong>relais travaux</strong> cadré (suivi, traçabilité, relances), sans recruter trop tôt.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Pourquoi externaliser une partie du suivi BTP (sans embauche immédiate)</h2>
      <ul>
        <li>Charge variable selon les chantiers et la saison.</li>
        <li>Besoin de réactivité (devis, relances, documents) sans y passer les soirées.</li>
        <li>Traçabilité : statuts, échanges, documents classés.</li>
      </ul>

      <h2>Ce que BeWork peut gérer (côté dossiers chantier)</h2>
      <ul>
        <li>Suivi devis & relances (statuts, prochaines actions)</li>
        <li>Situations/factures : préparation, envois, relances courtoises</li>
        <li>Documents travaux et dossiers : classement, checklists, diffusion cadrée</li>
        <li>Comptes rendus, réserves, préparation DOE (sur périmètre cadré)</li>
        <li>Fournisseurs / locations : confirmations, relances, livraisons</li>
      </ul>

      <h2>Comment ça fonctionne à distance</h2>
      <ul>
        <li>Vous transmettez demandes et pièces (plateforme / canal prévu).</li>
        <li>BeWork prépare, suit et vous remonte les points à valider.</li>
        <li>Vous gardez la validation finale sur ce qui engage (prix, technique, signatures).</li>
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
