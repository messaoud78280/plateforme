import Link from "next/link";
import { GeoExternalisationHubLinks } from "@/components/seo/GeoExternalisationHubLinks";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import {
  EXTERNALISATION_ADMIN_BT_PATHS,
  hreflangExternalisationAdministrativeBtpCluster,
} from "@/lib/externalisation-administrative-btp-geo";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = EXTERNALISATION_ADMIN_BT_PATHS.suisse;

export const metadata = landingPageMetadata({
  title:
    "Assistant administratif entreprise bâtiment Suisse (Romandie) — optimisation dossiers chantier | BeWork",
  description:
    "Romandie & PME bâtiment : optimisation organisation administrative chantier — devis, facturation, dossiers précis sous statuts suivis. Forfait TTC francophone depuis pilotage français encadré.",
  path: PAGE_PATH,
  keywords: [
    "assistant administratif entreprise bâtiment suisse",
    "optimisation gestion PME construction",
    "organisation administrative chantier suisse romande",
    "externalisation administrative BTP romandie",
    "conducteur projet administratif",
    "précision délais dossier construction",
  ],
  hreflangLanguages: hreflangExternalisationAdministrativeBtpCluster(),
});

export default function Page() {
  const faq = [
    {
      q: "Travaillez-vous hors Suisse ou uniquement depuis la plateforme ?",
      a: "L’interface et le pilotage fonctionnent en mode collaboratif hors site : votre équipe crée ou commente depuis votre canton. La coordination passe par français écrit comme dans vos flux habituelles mails clients romands après validation périmètre.",
    },
    {
      q: "Peut-on intégrer BeWork même avec un faible nombre « admin » internally ?",
      a: "C’est précisément le cas où un forfait externalisé compresse les oublis : une PME très maigre bureau gagne vite quand dossiers multiples stop d’être partagées entre quatre rôles partiels chantier même personne physique.",
    },
    {
      q: "Pourquoi insister précision sous angle suisse Romand ?",
      a: "Parce que le marché montre forte attente dossiers lisibles même pour AO privées et fournisseur — petits retards relatifs mails mal numérotés peuvent coûter heures facturables chantier corriger — notre valeur est alignement documentaire jusqu’aux statuts clôturés.",
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
      description="PME bâtiment en Suisse romande : dossiers chantier structurés, relances maîtrisées, forfaits clairs."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Externalisation administrative BTP — Suisse", href: PAGE_PATH },
      ]}
      h1="Externalisation administrative BTP en Suisse romande — optimisation sans bruit inutile"
      intro={
        <>
          Dans beaucoup de chantiers romands vos marges reposent également sur dossiers précis envoyés vite — clients et bailleurs
          privés détestent mails flous ou pièces manquantes. BeWork prend ce volet bureaucratique relatif à vos demandes chantier —
          suivis situations de travaux envoyés après validation vos chiffres, relances mails calibrées, coordination fournisseur
          documentée jusqu&apos;à statut final quand vos équipes chantier restent mieux utilisées physique terrain.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Gestion administrative PME construction : précision avant volume</h2>
      <p>
        Une petite équipe très efficace sur les ouvrages peut souffrir d&apos;une désorganisation dossier — mails mélangés, urgences
        non arbitrées — et cela se paye vite en retards d&apos;encaissement ou en versions contradictoires de documents chez vos
        fournisseurs en Suisse alémanique ou frontalier. Nous standardisons vos demandes (intitulés, numérotation) pour limiter les
        doublons même quand le carnet charge plusieurs pays francophones.
      </p>

      <h2>Conducteur projet invisible quand dossier admin prend sa place</h2>
      <p>
        Dans structure intermédiaire entre artisan et grande TCE vos cadres projet parfois rêvent passer moins trois heures
        relances téléphone confirmations fournisseur. BeWork prend relais documentaire défini vos règles — vous évite micro-coupures
        attention technique nécessitant jugement chantier immédiat.
      </p>

      <h2>ROI lisible même mentalité très analytique locales</h2>
      <p>
        Nous formulons valeur en heures chantier retrouvées et risque erreur diminuée plutôt qu&apos; slogans abstraction — aligné avec
        la culture performance souvent forte chez vos donneurs d&apos;ordre romands même secteur privatif hors grands conglomerats.
      </p>

      <div className="not-prose my-10 flex flex-wrap gap-4">
        <Link href="/contact" className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-bold text-white hover:bg-[#1e40af]">
          Réserver un appel découverte
        </Link>
        <Link
          href="/contact"
          className="inline-flex rounded-lg border-2 border-black px-6 py-3 font-bold text-black hover:bg-slate-100"
        >
          Diagnostic offert (faisabilité administrative)
        </Link>
      </div>

      <GeoExternalisationHubLinks currentHref={PAGE_PATH} />
    </SeoLandingPage>
  );
}
