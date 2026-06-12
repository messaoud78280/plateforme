import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/assistant-administratif-btp";

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

const faq = [
  {
    q: "Quelle différence entre une assistante administrative généraliste et un assistant BTP avec BeWork ?",
    a: "Une assistante administrative classique traite le courant (courriels, facturation générique). Un assistant BTP BeWork est briefé sur les dossiers chantier : devis, relances, fournisseurs, documents travaux, réserves, plannings — avec un relais bureau‑chantier et des outils adaptés au rythme du terrain.",
  },
  {
    q: "BeWork peut-il aider un conducteur de travaux au quotidien ?",
    a: "Oui, sur un périmètre cadré : préparer les suivis, structurer les comptes rendus, relancer les pièces, tenir le fil des demandes et des validations. Le conducteur de travaux garde la décision technique et la validation des points sensibles.",
  },
  {
    q: "Quelles tâches BTP peut-on déléguer concrètement ?",
    a: "Suivi de devis et relances clients, préparation de documents chantier, relances fournisseurs et locations, aide à la structuration des comptes rendus, suivi des listes de pièces (DOE, dossiers, réserves) selon le besoin — toujours avec circuit de validation interne.",
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
      description="Assistant administratif pour le BTP : devis chantiers, suivi sous-traitants, relances factures. PME BTP France, Belgique, Suisse. Dès 590 € HT/mois."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Assistant administratif BTP", href: PAGE_PATH },
      ]}
      h1="Assistant administratif pour le BTP : devis, chantiers, relances"
      intro={
        <>
          Les entreprises du BTP peuvent externaliser leur administratif avec un assistant dédié : devis chantiers,
          suivi des sous-traitants, relances factures fournisseurs. BeWork accompagne les PME BTP en France, Belgique,
          Suisse et Luxembourg. Dès 590 € HT/mois.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <h2>Missions clés pour le BTP</h2>
      <p>
        Devis chantiers, suivi des sous-traitants, relances factures, mise à jour des plannings, coordination avec
        les fournisseurs, archivage des pièces. Notre assistant administratif BTP s&apos;adapte à vos process et
        à votre métier.
      </p>

      <h2>Pourquoi les entreprises BTP choisissent BeWork ?</h2>
      <p>
        Réactivité, équipe francophone, coût maîtrisé. Pas de recrutement ni d&apos;infrastructure : l&apos;assistant
        externalisé bénéficie d&apos;une prise en charge rapide. Supervision en France pour une qualité et une réactivité optimales.
      </p>

      <h2>À qui s&apos;adresse ce service ?</h2>
      <p>
        Artisans, PME BTP, entreprises de construction et de rénovation qui souhaitent déléguer l&apos;administratif
        pour se concentrer sur les chantiers. BeWork propose des forfaits adaptés au volume de tâches.
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
