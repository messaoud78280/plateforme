import Link from "next/link";
import { GeoExternalisationHubLinks } from "@/components/seo/GeoExternalisationHubLinks";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import {
  EXTERNALISATION_ADMIN_BT_PATHS,
  hreflangExternalisationAdministrativeBtpCluster,
} from "@/lib/externalisation-administrative-btp-geo";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = EXTERNALISATION_ADMIN_BT_PATHS.belgique;

export const metadata = landingPageMetadata({
  title: "Gestion administrative construction Belgique — externalisation BTP | BeWork",
  description:
    "Belgique : structurer la facturation construction, le suivi devis et les dossiers chantier sans alourdir la structure interne. BeWork en français — Wallonie, Bruxelles, entreprises du bâtiment.",
  path: PAGE_PATH,
  keywords: [
    "gestion administrative construction belgique",
    "secrétariat externalisé bâtiment belgique",
    "externalisation administrative PME belgique",
    "facturation chantier belgique",
    "organisation administrative TPE construction",
    "suivi devis BTP belgique",
  ],
  hreflangLanguages: hreflangExternalisationAdministrativeBtpCluster(),
});

export default function Page() {
  const faq = [
    {
      q: "BeWork intervient-il en Flandre ou côté néerlandophone ?",
      a: "Le pilotage opérationnel et la plateforme sont calibrés client en français. Si une partie de vos flux reste en français (mails, devis, clients), un échange au rendez-vous découverte permet de valider le périmètre ; pour un besoin 100 % néerlandophone, il vaut mieux un partenaire local dédié.",
    },
    {
      q: "Comment gérer la facturation construction avec une petite équipe tout-terrain ?",
      a: "On découpe : ce qui doit sortir vite (situations ou facturations à préparer, relances client) et ce qui peut patienter (classement, archivage). BeWork tient la suite documentaire et les relances dans le forfait — vous gardez signature et validation sur ce qui engage contractuellement.",
    },
    {
      q: "Différence France / Belgique sur le fond ?",
      a: "Le besoin humain est le même : temps au bureau vs temps chantier. Les différences viennent des interlocuteurs et des rythmes contractuels locaux — d’où cette page spécifique plutôt qu’un texte « copié ».",
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
      description="Structuration bureau pour entreprises construction en Belgique — relances et dossiers encadrés."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Externalisation administrative BTP — Belgique", href: PAGE_PATH },
      ]}
      h1="Externalisation administrative BTP en Belgique — structurer votre entreprise construction"
      intro={
        <>
          Dans la construction belge, très souvent l&apos;équipe sur le terrain avance vite mais votre «&nbsp;service
          facturation&nbsp;» fait encore quatre rôles en parallèle. Entre confirmations fournisseur, relances chantier privatif et
          demandes administrations locales, vos journées se retrouvent morcelées alors que vos marges reposent aussi sur vos
          tableaux suivis devis comme sur les délais paiement réels clients. Pour les équipes francophones, nous posons une
          couche d&apos;exécution administrative externalisée et encadrée par forfait : plus de structure sans recruter une
          personne à temps plein pour des volumes qui varient.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Facturation et suivi : la « malle aux documents » n&apos;est plus une stratégie</h2>
      <p>
        Gestion administrative construction se traduit vite en « dossiers dispersés », surtout quand vous passez chantier après
        chantier à Bruxelles ou en Wallonie tout en suivant mails en déplacement voiture chantier ou tablette. Une demande créée,
        suivie jusqu&apos;à statut fermé évite duplication factures retard ou commandes contradictoires envoyées même semaine à
        deux fournisseurs — les erreurs classiques quand plusieurs personnes partiellement impliquent le même dossier hors
        outillage dédié.
      </p>

      <h2>Secrétariat externalisé bâtiment : pas de miracle, mais un gain net sur la chaîne dossier</h2>
      <p>
        Nous éviterons slogans creux&nbsp;: vos clients gardent la même vue sur vos délais chantier tant que vous restez leur
        interlocuteur commercial visible sur le terrain. En coulisse, BeWork enchaîne relances mails, confirmations de commandes
        et dossiers retard quand vos équipes sautent plusieurs appels la même journée par surcharge chantier.
      </p>

      <h2>La relation longue durée : une facturation propre compte aussi</h2>
      <p>
        Dans beaucoup d&apos;entreprises belges construction, les chantiers se répètent — une facturation claire et des relances
        courtoises renforcent la confiance autant que la qualité d&apos;exécution. Nous calibrons vos textes de relance sur votre
        ton validé au départ, souvent un registre direct mais sans agression, très bien réceptionné localement.
      </p>

      <div className="not-prose my-10 flex flex-wrap gap-4">
        <Link href="/contact" className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-bold text-white hover:bg-[#1e40af]">
          Réserver un appel
        </Link>
        <Link
          href="/inscription"
          className="inline-flex rounded-lg border-2 border-[#1d4ed8] px-6 py-3 font-bold text-[#1d4ed8] hover:bg-[#eff6ff]"
        >
          Tester BeWork après échange commercial
        </Link>
      </div>

      <GeoExternalisationHubLinks currentHref={PAGE_PATH} />
    </SeoLandingPage>
  );
}
