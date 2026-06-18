import Link from "next/link";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/assistant-administratif-externalise";

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

const faq = [
  {
    q: "Qu’est-ce qu’un assistant travaux externalisé avec BeWork ?",
    a: "C’est une assistance technique et administrative BTP supervisée depuis la France : analyse DCE, relances, dossiers chantier, pièces marché et suivi — sans CDI ni infrastructure à votre charge. L’IA outille l’équipe pour gagner en vitesse, sous encadrement humain.",
  },
  {
    q: "Quelles tâches peut-on externaliser tout en gardant le contrôle ?",
    a: "Typiquement : analyse et structuration de pièces marché, relances devis et factures chantier, comptes rendus, suivi de dossiers, checklists DOE/réserves, coordination écrite fournisseurs. Vous validez tout ce qui engage contractuellement ou financièrement.",
  },
  {
    q: "Comment BeWork sécurise la validation des documents avant envoi ?",
    a: "Par un circuit clair : brouillon ou proposition, repasse interne BeWork si besoin, puis validation explicite côté client sur les pièces sensibles. L’historique sur la plateforme permet de tracer qui a quoi, quand.",
  },
  {
    q: "Est-ce une alternative crédible à un recrutement interne ?",
    a: "Oui lorsque la charge est variable ou que vous voulez tester le gain de temps avant d’embaucher. BeWork est souvent plus rapide à mettre en route qu’un recrutement, avec des forfaits HT prévisibles et une montée en charge progressive.",
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
      description="Assistant travaux externalisé BeWork : analyse DCE, dossiers chantier, relances et marchés publics pour les PME BTP. Dès 590 € HT/mois. France, Belgique, Suisse, Luxembourg."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Assistant administratif externalisé", href: PAGE_PATH },
      ]}
      h1="Assistant administratif externalisé : en BTP, c’est une assistance travaux encadrée"
      intro={
        <>
          Externaliser ne signifie pas déléguer de la saisie générique : pour le bâtiment, BeWork apporte une{" "}
          <strong>assistance technique et administrative</strong> — analyse DCE, relances, dossiers chantier, appels
          d&apos;offres et suivi marché public. France, Belgique, Suisse, Luxembourg — dès 590 € HT/mois.{" "}
          <Link href="/services/externalisation-administrative-btp" className="text-[#1d4ed8] hover:underline">
            Détail du service
          </Link>
          .
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <h2>Pourquoi externaliser l’assistance travaux ?</h2>
      <p>
        La charge varie selon les chantiers : pics d&apos;appels d&apos;offres, relances, clôture DOE. Externaliser
        permet de sécuriser le rythme côté bureau sans alourdir la masse salariale, avec des forfaits HT et une équipe
        déjà opérationnelle sur le métier BTP.
      </p>

      <h2>Que fait un assistant travaux externalisé BeWork ?</h2>
      <p>
        Analyse DCE, structuration de comptes rendus, relances clients et fournisseurs, suivi de situations et dossiers
        marché public, préparation de pièces chantier et tableaux de suivi — sur le périmètre cadré avec vous.
      </p>

      <h2>Pour qui ?</h2>
      <p>
        Dirigeants et PME du bâtiment qui veulent externaliser le suivi documentaire sans recruter. Forfaits dès 590 €
        HT/mois, équipe francophone supervisée depuis la France.
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
