import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";
import { SEO_KEYWORDS_PARTENAIRE_CORE } from "@/lib/seo-keywords";

const PAGE_PATH = "/assistant-administratif-externalise";

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

const faq = [
  {
    q: "Qu’est-ce qu’un assistant administratif externalisé pour le BTP avec BeWork ?",
    a: "C’est un assistant dédié, supervisé depuis la France, qui traite vos flux administratifs et dossiers chantier sur la plateforme BeWork : relances, devis, pièces, suivi — sans CDI ni infrastructure à votre charge. L’IA outille l’équipe pour gagner en vitesse et en qualité, sous encadrement humain.",
  },
  {
    q: "Quelles tâches peut-on externaliser tout en gardant le contrôle ?",
    a: "Typiquement : préparation et relances sur devis et factures, structuration des échanges, suivi de dossiers, classement et checklists documents, coordination écrite avec fournisseurs ou interlocuteurs. Vous validez tout ce qui engage contractuellement ou financièrement.",
  },
  {
    q: "Comment BeWork sécurise la validation des documents avant envoi ?",
    a: "Par un circuit clair : brouillon ou proposition, repasse interne BeWork si besoin, puis validation explicite côté client sur les pièces sensibles. L’historique sur la plateforme permet de tracer qui a quoi, quand.",
  },
  {
    q: "Est-ce une alternative crédible à un recrutement interne ?",
    a: "Oui lorsque la charge est variable ou que vous voulez tester le gain de temps avant d’embaucher. BeWork est souvent plus rapide à mettre en route qu’un recrutement, avec des forfaits TTC prévisibles et une montée en charge progressive.",
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
      description="L'assistant administratif externalisé BeWork prend en charge devis, factures, relances et suivi de dossiers pour les PME. Dès 290 € TTC/mois. France, Belgique, Suisse, Luxembourg."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Assistant administratif externalisé", href: PAGE_PATH },
      ]}
      h1="Assistant administratif externalisé : déchargez votre entreprise"
      intro={
        <>
          Un assistant administratif externalisé permet aux PME d&apos;externaliser leur administratif sans recruter.
          Devis, factures, relances, suivi de dossiers : BeWork accompagne les dirigeants avec un assistant virtuel
          entreprise dédié. France, Belgique, Suisse, Luxembourg — dès 290 € TTC/mois.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <h2>Pourquoi choisir un assistant administratif externalisé ?</h2>
      <p>
        Externaliser votre administratif avec un assistant dédié offre plusieurs avantages : gain de temps, coût maîtrisé
        (pas de charges sociales ni recrutement), réactivité et qualité professionnelle. L&apos;assistant administratif
        externalisé travaille à distance, dans le respect de vos process et de votre secteur.
      </p>

      <h2>Que fait un assistant administratif externalisé BeWork ?</h2>
      <p>
        Nos assistants gèrent les tâches courantes : emails, devis, factures, relances clients et fournisseurs, agenda,
        suivi de dossiers, saisie et classement de documents. Ils s&apos;adaptent à votre secteur (BTP en priorité, PME,
        indépendants, services) et travaillent avec vos outils.
      </p>

      <h2>Pour qui ?</h2>
      <p>
        Dirigeants, PME, TPE, indépendants et cabinets qui souhaitent externaliser administratif PME sans recruter.
        BeWork propose des forfaits dès 290 € TTC/mois, avec une équipe francophone supervisée depuis la France.
      </p>

      <section className="not-prose" id="faq" aria-label="FAQ assistant administratif externalisé" style={{ scrollMarginTop: "6rem" }}>
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
