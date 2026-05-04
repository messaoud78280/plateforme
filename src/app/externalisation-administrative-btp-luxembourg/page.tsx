import Link from "next/link";
import { GeoExternalisationHubLinks } from "@/components/seo/GeoExternalisationHubLinks";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import {
  EXTERNALISATION_ADMIN_BT_PATHS,
  hreflangExternalisationAdministrativeBtpCluster,
} from "@/lib/externalisation-administrative-btp-geo";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = EXTERNALISATION_ADMIN_BT_PATHS.luxembourg;

export const metadata = landingPageMetadata({
  title:
    "Externalisation administrative entreprise Luxembourg — support PME construction & chantier | BeWork",
  description:
    "Luxembourg : soutien administratif pour PME bâtiment en croissance — relances clients, dossiers chantier multi-pays francophones sans alourdir l’effectif interne.",
  path: PAGE_PATH,
  keywords: [
    "externalisation administrative entreprise Luxembourg",
    "support administratif PME Luxembourg",
    "gestion administrative croissance chantier",
    "prestataire administratif bâtiment",
    "secrétariat externalisé PME LU",
    "coordination dossiers chantier transfrontalier",
  ],
  hreflangLanguages: hreflangExternalisationAdministrativeBtpCluster(),
});

export default function Page() {
  const faq = [
    {
      q: "Nous avons chantiers frontalier allemand/français mélangés : votre modèle passe ?",
      a: "L’essentiel est que vos consignes relances mails et dossiers restent français pour notre équipe francophone après validation périmètre ; les validations sensibles chantier suivent vos règles internes. Le détail des langues mails sortants se paramètre lorsque vous activez validations.",
    },
    {
      q: "Une PME luxembourgeoise vise forte croissance : pourquoi éviter première embauche admin interne trop tôt ?",
      a: "Parce que le palier RH fige vite budget là où un forfait encadré aligne niveau dossier chantier suivis au contrat évolutible plus tard — utile lorsque vos marges projet pas encore amortissent siège léger Luxembourg.",
    },
    {
      q: "Combien vite sommes nous opérationnels ?",
      a: "Objectif trois à cinq jours ouvrés post validation contrat onboarding — vos premières demandes apparaissent sur plateforme avec statuts dès vos accès attribués.",
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
      description="PME luxembourgeoises du bâtiment : dossiers chantier et relances structurées, sans surcharge RH."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Externalisation administrative BTP — Luxembourg", href: PAGE_PATH },
      ]}
      h1="Externalisation administrative BTP au Luxembourg — croître sans noyer votre agenda back-office"
      intro={
        <>
          Dans économie luxembourgeoise dynamique, petites équipes chantier absorbent souvent à la fois clientèle locale et dossiers
          transfrontaliers. À mesure vos volumes montent vite, mails fournisseur et validations devis retardent vos signatures
          commerciales car vous passez quatre heures hebdomadaires sur tableurs relances incomplets. Notre service relève plutôt
          rôle tiers administratif chantier suivis dossiers fermés jusqu&apos;à statut final — dans forfait TTC sans salaire RH
          supplémentaire immédiat.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Support administratif lorsque quatre personnes portent sept casquettes au bureau</h2>
      <p>
        La croissance produit vite une équipe très plate&nbsp;: le même profil enchaîne chantier, téléphone puis mails fournisseur,
        sans dossier commun — d&apos;où les relances doublonnées trois jours d&apos;affilée. Une demande assignée, suivie jusqu&apos;à
        clôture évite cette dispersion&nbsp;: tableau de statuts aligné avec vos priorités commerciales.
      </p>

      <h2>Trésorerie et image pro&nbsp;: des relances humaines, pas des mails robots</h2>
      <p>
        Vos clients PME attendent souvent une réactivité «&nbsp;côté patron&nbsp;». Quand tout retarde administrativement, ils voient une
        structure encore amateur. BeWork prend en charge mails et relances dans une tonalité sérieuse prévalidée avec vous — sans
        modèles froids qui nuisent aux petites structures très relationnelles du Luxembourg.
      </p>

      <h2>Un flux français pour dossiers LU et voisins européens</h2>
      <p>
        Pas de double saisie systématique&nbsp;: nous préparons pièces et brouillons de mails&nbsp;; vous validez ce qui engage. Cela évite le
        chaos où plusieurs boîtes mail suivent le même dossier frontalier avec des filtres différents.
      </p>

      <div className="not-prose my-10 flex flex-wrap gap-4">
        <Link href="/contact" className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-bold text-white hover:bg-[#1e40af]">
          Réserver un appel avec BeWork
        </Link>
        <Link
          href="/tarifs"
          className="inline-flex rounded-lg border-2 border-[#1d4ed8] px-6 py-3 font-bold text-[#1d4ed8] hover:bg-[#eff6ff]"
        >
          Tester le cadre tarifaire
        </Link>
      </div>

      <GeoExternalisationHubLinks currentHref={PAGE_PATH} />
    </SeoLandingPage>
  );
}
