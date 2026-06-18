import type { Metadata } from "next";
import Link from "next/link";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/assistant-administratif-btp";

const PAGE_META_DESCRIPTION =
  "Vous cherchez un assistant administratif BTP ? BeWork apporte une assistance technique et administrative spécialisée chantier : analyse DCE, dossiers, appels d'offres et marchés publics — sans embauche.";

const baseMetadata = landingPageMetadataFromPath(PAGE_PATH);

export const metadata: Metadata = {
  ...baseMetadata,
  description: PAGE_META_DESCRIPTION,
  openGraph: {
    ...(typeof baseMetadata.openGraph === "object" ? baseMetadata.openGraph : {}),
    description: PAGE_META_DESCRIPTION,
  },
  twitter: {
    ...(typeof baseMetadata.twitter === "object" ? baseMetadata.twitter : {}),
    description: PAGE_META_DESCRIPTION,
  },
};

const faq = [
  {
    q: "Quelle différence entre une prestation administrative généraliste et un assistant travaux BeWork ?",
    a: "Une prestation hors métier bâtiment traite le courrier et la saisie générique. Un assistant travaux BeWork est briefé sur les dossiers chantier : analyse DCE, relances, fournisseurs, documents travaux, réserves, marchés publics — avec validation avant envoi engageant.",
  },
  {
    q: "BeWork peut-il aider un conducteur de travaux au quotidien ?",
    a: "Oui, sur un périmètre cadré : préparer les suivis, structurer les comptes rendus, relancer les pièces, tenir le fil des demandes et des validations. Le conducteur de travaux garde la décision technique et la validation des points sensibles.",
  },
  {
    q: "Quelles tâches BTP peut-on déléguer concrètement ?",
    a: "Analyse DCE, suivi de devis et relances clients, préparation de documents chantier, relances fournisseurs, comptes rendus, suivi des listes de pièces (DOE, réserves) et situations marché public — toujours avec circuit de validation interne.",
  },
  {
    q: "Est-ce adapté aux artisans et petites entreprises du bâtiment ?",
    a: "Oui. Les forfaits sont conçus pour les TPE/PME qui n’ont pas une équipe bureau à plein temps : vous payez au besoin, sans recruter, avec une équipe francophone supervisée depuis la France.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function Page() {
  return (
    <SeoLandingPage
      description="Assistant travaux BTP : analyse DCE, dossiers chantier, appels d'offres et marchés publics. PME BTP France, Belgique, Suisse. Dès 590 € HT/mois."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Assistant administratif BTP", href: PAGE_PATH },
      ]}
      h1="Assistant administratif BTP : en pratique, un assistant travaux pour vos chantiers"
      intro={
        <>
          Beaucoup de dirigeants BTP cherchent un « assistant administratif » pour le bâtiment. BeWork répond avec une{" "}
          <strong>assistance technique et administrative</strong> spécialisée : analyse DCE, dossiers chantier, relances,
          appels d&apos;offres et marchés publics — pas une prestation administrative généraliste. France, Belgique,
          Suisse et Luxembourg. Dès 590 € HT/mois. Voir aussi le{" "}
          <Link href="/services/assistant-travaux" className="text-[#1d4ed8] hover:underline">
            service assistant travaux
          </Link>
          .
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <h2>Missions clés pour le BTP</h2>
      <p>
        Analyse DCE, devis chantiers, suivi sous-traitants, relances MOE/MOA, comptes rendus, situations marché public,
        coordination fournisseurs et classement des pièces. L&apos;assistant travaux BeWork s&apos;adapte à vos process
        métier.
      </p>

      <h2>Pourquoi les entreprises BTP choisissent BeWork ?</h2>
      <p>
        Expertise chantier et marchés publics, équipe francophone, coût maîtrisé. Pas de recrutement ni
        d&apos;infrastructure : prise en charge rapide, supervision en France, validation finale chez vous.
      </p>

      <h2>À qui s&apos;adresse ce service ?</h2>
      <p>
        Artisans, PME BTP, entreprises générales et titulaires de marchés publics qui veulent sécuriser le suivi
        documentaire pour se concentrer sur le terrain. Catalogue complet sur{" "}
        <Link href="/assistants-administratifs-taches" className="text-[#1d4ed8] hover:underline">
          la page missions
        </Link>
        .
      </p>

      <section className="not-prose" id="faq" aria-label="FAQ assistant administratif BTP" style={{ scrollMarginTop: "6rem" }}>
        <h2 className="mt-12 text-xl font-bold tracking-tight text-black md:text-2xl">Questions fréquentes</h2>
        <dl className="mt-5 space-y-4">
          {faq.map((item) => (
            <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <dt className="text-base font-semibold text-black">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-700">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </SeoLandingPage>
  );
}
