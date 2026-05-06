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
    "Externalisation administrative BTP en Europe francophone | Assistante travaux BeWork",
  description:
    "BeWork accompagne les entreprises du BTP francophones (France, Belgique, Suisse romande, Luxembourg) avec une assistante travaux : dossiers chantier, relances, documents travaux et suivi bureau‑terrain, sans recruter.",
  path: PAGE_PATH,
  keywords: [
    "externalisation administrative BTP europe",
    "assistante travaux europe francophone",
    "assistante BTP",
    "relais bureau-chantier",
    "dossiers chantier",
    "suivi bureau-terrain",
  ],
  hreflangLanguages: hreflangExternalisationAdministrativeBtpCluster(),
});

export default function Page() {
  const faq = [
    {
      q: "BeWork peut-elle accompagner des entreprises BTP dans plusieurs pays ?",
      a: "Oui, tant que vos échanges métier sont principalement en français. Le fonctionnement reste identique : demandes, pièces, suivis et validation finale côté client.",
    },
    {
      q: "Qu’est-ce qui change selon le pays ?",
      a: "Surtout la tonalité, les interlocuteurs et vos habitudes de dossier. Nous ne prétendons pas couvrir toutes les obligations réglementaires locales : vous restez responsable et vous validez ce qui engage.",
    },
    {
      q: "Comment démarrer avec BeWork à distance ?",
      a: "On cadre votre périmètre, vos canaux et votre circuit de validation. Puis vous envoyez vos demandes : BeWork prépare, suit et vous remonte les points à valider.",
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
      description="Europe francophone : un relais bureau‑chantier à distance pour tenir dossiers, relances et documents travaux."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Externalisation administrative BTP — Europe", href: PAGE_PATH },
      ]}
      h1="Externalisation administrative BTP en Europe francophone : assistante travaux à distance"
      intro={
        <>
          BeWork accompagne les entreprises du BTP francophones (France, Belgique, Suisse romande, Luxembourg) avec une{" "}
          <strong>assistante travaux</strong> : un relais bureau‑chantier pour tenir les dossiers, les relances, les documents
          travaux et la traçabilité — sans recruter immédiatement. Le mot-clé “externalisation administrative BTP” reflète la
          recherche ; la réalité, c’est un <strong>suivi opérationnel</strong> orienté chantier.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Le besoin commun (quel que soit le pays)</h2>
      <ul>
        <li>Tenir les dossiers chantier et les demandes côté bureau.</li>
        <li>Garder des statuts, échéances et points bloquants visibles.</li>
        <li>Préparer des livrables propres (documents, comptes rendus, réserves, DOE) sur périmètre cadré.</li>
        <li>Vous laisser valider ce qui engage (prix, technique, signatures, engagements).</li>
      </ul>

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
            className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-colors hover:bg-slate-50"
          >
            <span className="text-xl font-bold text-black">{c.title}</span>
            <span className="mt-3 block text-sm font-medium leading-snug text-black">{c.line}</span>
            <span className="mt-5 inline-flex text-sm font-bold text-[#1d4ed8]">
              Page dédiée <span aria-hidden className="ml-1 translate-x-0 transition-transform group-hover:translate-x-1">→</span>
            </span>
          </Link>
        ))}
      </div>

      <h2>Ce que BeWork peut gérer (liste courte)</h2>
      <ul>
        <li>Devis & relances (préparation, statuts, prochaines actions)</li>
        <li>Situations / factures (préparation, pièces, relances courtoises)</li>
        <li>Documents travaux, comptes rendus, réserves, DOE (sur périmètre cadré)</li>
        <li>Fournisseurs / locations (confirmations, relances, livraisons)</li>
      </ul>

      <h2>Comment ça fonctionne</h2>
      <ul>
        <li>Demandes transmises + pièces centralisées.</li>
        <li>Suivi des statuts et échéances, relances si nécessaire.</li>
        <li>Validation finale côté client sur ce qui engage.</li>
        <li>Traçabilité : historique et documents classés.</li>
      </ul>

      <div className="not-prose my-10 flex flex-wrap gap-4">
        <Link href="/contact" className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-bold text-white hover:bg-[#1e40af]">
          Réserver un appel
        </Link>
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
