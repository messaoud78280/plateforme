import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/assistant-administratif-distance";

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

const faq = [
  {
    q: "Comment fonctionne une assistante BTP à distance avec BeWork ?",
    a: "Vous déposez vos demandes sur la plateforme (messagerie, tâches, pièces) : l’assistant traite à distance, documente l’avancement et rend des livrables clairs. Idéal quand vous êtes sur chantier : le bureau suit sans dépendre d’un présentiel.",
  },
  {
    q: "Quelles tâches peuvent être gérées sans présence sur chantier ?",
    a: "Préparation de relances et mails, structuration de dossiers, suivi de devis et factures, classement de pièces, tableaux de suivi, coordination écrite fournisseurs — tout ce qui ne nécessite pas une présence physique sur site.",
  },
  {
    q: "Comment transmettre les demandes à BeWork ?",
    a: "Via la plateforme BeWork (tâches et échanges), en joignant notes, PDF, captures ou liens vers vos outils selon ce que vous autorisez. L’essentiel est un brief court : objectif, deadline, niveau de validation attendu.",
  },
  {
    q: "Le client garde-t-il la validation finale sur les documents ?",
    a: "Oui. BeWork prépare, structure et relance ; vous validez avant envoi tout ce qui engage votre entreprise : prix, formulation contractuelle, engagement technique ou réponse sensible au client final.",
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
      description="Assistant administratif à distance pour PME et indépendants. Devis, factures, relances, suivi dossiers. Plateforme supervisée depuis la France. Dès 590 € HT/mois."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Assistant administratif à distance", href: PAGE_PATH },
      ]}
      h1="Assistant administratif à distance : même qualité qu&apos;en interne"
      intro={
        <>
          L&apos;assistant administratif à distance BeWork travaille depuis notre plateforme, supervisée depuis la France.
          Devis, factures, relances, agenda : vous déléguez l&apos;administratif sans recruter. Pour PME et indépendants
          en France, Belgique, Suisse et Luxembourg. Dès 590 € HT/mois.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <h2>Comment fonctionne un assistant administratif à distance ?</h2>
      <p>
        Vous envoyez vos tâches via la plateforme BeWork, votre assistant les traite à distance et vous livre les résultats.
        Messagerie intégrée, suivi des tâches en temps réel et historique complet. Aucun déplacement requis :
        l&apos;assistant administratif à distance s&apos;adapte à votre rythme.
      </p>

      <h2>Avantages pour les indépendants et PME</h2>
      <p>
        Gain de temps, flexibilité, coût maîtrisé. Un assistant virtuel entreprise à distance évite le recrutement et
        les charges associées. Vous payez un forfait clair selon votre périmètre — pas de prix horaire ni de crédits.
      </p>

      <h2>Qualité et supervision</h2>
      <p>
        Direction et supervision en France, assistants francophones Bac+5 formés à l&apos;IA. Même fuseau horaire,
        même niveau d&apos;exigence. BeWork garantit une collaboration fluide et professionnelle.
      </p>

      <section className="not-prose" id="faq" aria-label="FAQ assistant administratif à distance" style={{ scrollMarginTop: "6rem" }}>
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
