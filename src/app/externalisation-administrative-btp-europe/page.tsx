import Link from "next/link";
import { GeoExternalisationHubLinks } from "@/components/seo/GeoExternalisationHubLinks";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import {
  EXTERNALISATION_ADMIN_BT_PATHS,
  EXTERNALISATION_ADMIN_BT_NAV,
  hreflangExternalisationAdministrativeBtpCluster,
} from "@/lib/externalisation-administrative-btp-geo";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = EXTERNALISATION_ADMIN_BT_PATHS.europe;

export const metadata = landingPageMetadata({
  title:
    "Externalisation administrative BTP en Europe francophone — France, Belgique, Suisse, Luxembourg | BeWork",
  description:
    "Hub Europe : même besoin bureau sur les chantiers, réalités locales différentes. BeWork aide artisans, conducteurs de travaux et entreprises du bâtiment en France, Belgique, Romandie et Luxembourg — forfaits TTC, équipe francophone.",
  path: PAGE_PATH,
  keywords: [
    "externalisation administrative BTP europe",
    "prestataire administratif europe francophone",
    "organisation bureau BTP multicountry",
    "administratif construction France Belgique",
    "sous-traitance administrative Suisse Luxembourg",
    "conducteur travaux externalisation",
    "assistant administratif bâtiment",
  ],
  hreflangLanguages: hreflangExternalisationAdministrativeBtpCluster(),
});

export default function Page() {
  const faq = [
    {
      q: "Pourquoi une page « Europe » alors que tout est en français ?",
      a: "Parce que le français partagé n’efface pas le contexte légal, commercial et culturel du pays où vous intervenez — et parce que Google relie mieux vos pages pays quand elles parlent leur propre tonalité métier tout en gardant une base commune.",
    },
    {
      q: "BeWork fonctionne dans tous ces pays depuis un seul point de pilotage ?",
      a: "Oui pour le fonctionnement traité après validation au rendez-vous découverte : les demandes, relances et suivis passent par la plateforme, avec équipe francophone encadrée. Les envois juridiquement sensibles sont validés comme vous en avez décidé.",
    },
    {
      q: "Je suis frontalier ou j’ai des chantiers hors France : est-ce encore pertinent ?",
      a: "Le plus souvent oui lorsque vos échanges métier sont en français. La page pays la plus proche décrit mieux vos contraintes ; la suite se confirme en échange lors du diagnostic.",
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
      description="Pilotage administratif encadré pour le BTP en Europe francophone : France, Belgique, Romandie, Luxembourg."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Externalisation administrative BTP — Europe", href: PAGE_PATH },
      ]}
      h1="Externalisation administrative BTP en Europe francophone"
      intro={
        <>
          Dans tous les marchés où le BTP bat fort, vous retrouvez le même paradoxe&nbsp;: vos marges sont sur le chantier ou
          dans la signature du devis, mais votre disponibilité se fait bouffer par la facturation, les relances, les dossiers à
          clôturer et la coordination fournisseur. À Bruxelles comme à Lausanne, au Luxembourg comme à Marseille, une heure au
          bureau n&apos;est pas une heure&nbsp;terrain — nous venons prendre cette couche là, dans un cadre clair avec forfait{" "}
          <Link href="/tarifs" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            TTC mensuel
          </Link>
          .
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Quatre façons différentes d&apos;attraper votre administratif chantier</h2>
      <p>
        En France vous parlez volontiers de backlog de devis côté artisan ; en Belgique les structures ont souvent un rôle
        admin plus léger avant de devoir passer à deux salariés en interne ; en Suisse romande le souci dominant est plus
        souvent calibration des délais et du niveau d&apos;exigence des donneurs d&apos;ordre ; au Luxembourg vous mixez petite
        structure et forte croissance. Vous retrouvez le même mot fin&nbsp;: du temps hors chantier rendu au terrain.
      </p>

      <h2>Pages locales : parlez votre contexte métier sans déformation</h2>
      <p>
        À la place des énormes clones « géo » génériques, nous avons choisi quatre textes différents, plus ce hub européen pour le
        positionnement macro. Sélectionnez le pays qui reflète vos habitudes de dossier et vos clients principaux&nbsp;:
      </p>
      <div className="not-prose my-10 grid gap-5 sm:grid-cols-2">
        {EXTERNALISATION_ADMIN_BT_NAV.filter((c) => c.key !== "europe").map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-2xl border-2 border-[#1d4ed8]/20 bg-[#eff6ff] p-8 transition-colors hover:bg-white"
          >
            <span className="text-xl font-bold text-black">{c.title}</span>
            <span className="mt-3 block text-sm font-medium leading-snug text-black">{c.line}</span>
            <span className="mt-5 inline-flex text-sm font-bold text-[#1d4ed8]">
              Page dédiée <span aria-hidden className="ml-1 translate-x-0 transition-transform group-hover:translate-x-1">→</span>
            </span>
          </Link>
        ))}
      </div>

      <h2>Ce que BeWork prend en commun sur ces marchés francophones</h2>
      <ul>
        <li>
          Structuration demandes (devis, factures, situ, relances) dans des statuts suivis jusqu&apos;à clôture, pas perdus dans
          la boîte mail.
        </li>
        <li>Fil conducteur dossiers chantier : délais vus depuis le chantier comme priorités métier réelles.</li>
        <li>Validation vos envois avant envois sensibles lorsque vos règles l&apos;imposent.</li>
      </ul>

      <h2>Universal pour convertir&nbsp;: temps, chantiers, sérénité</h2>
      <p>
        Le résultat recherché reste lisible quel que soit le pays&nbsp;: plus de devis suivis jusqu&apos;à statut réel et plus de
        dossiers avancés quand votre journée chantier prend le dessus. Le ton change un peu&nbsp;; le gain métier lui ne change
        pas&nbsp;: rentabilité, cash et image pro.
      </p>

      <p className="not-prose rounded-xl bg-[#0f172a] p-10 text-white">
        <span className="block text-xl font-bold">Réserver un appel ou demander un diagnostic</span>
        <span className="mt-2 block font-medium opacity-95">
          À la fois pour vérifier l&apos;adéquation de pays et vos volumes dossiers chantier.
        </span>
        <Link
          href="/contact"
          className="not-prose mt-6 inline-flex rounded-lg bg-[#1d4ed8] px-8 py-3.5 text-base font-bold text-white hover:bg-[#1e40af]"
        >
          Réserver un appel
        </Link>
      </p>

      <GeoExternalisationHubLinks currentHref={PAGE_PATH} />
    </SeoLandingPage>
  );
}
