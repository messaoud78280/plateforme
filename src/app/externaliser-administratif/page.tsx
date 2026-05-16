import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";
import { SEO_KEYWORDS_PARTENAIRE_CORE } from "@/lib/seo-keywords";

const PAGE_PATH = "/externaliser-administratif";

export const metadata = landingPageMetadata({
  title: "Externaliser son administratif | Partenaire externalisé PME & BTP | BeWork",
  description:
    "Externaliser l’administratif : devis, factures, relances et dossiers sans recruter. Partenaire cadré, forfaits TTC.",
  path: PAGE_PATH,
  keywords: [
    ...SEO_KEYWORDS_PARTENAIRE_CORE,
    "externaliser son administratif",
    "comment externaliser administratif",
    "sans recrutement",
  ],
});

const faq = [
  {
    q: "Pourquoi externaliser l’administratif dans une entreprise BTP plutôt que tout internaliser ?",
    a: "Parce que la charge varie fortement selon les chantiers : pics de devis, relances, documents. Externaliser permet de sécuriser le rythme côté bureau sans alourdir la masse salariale, avec des forfaits TTC et une équipe déjà opérationnelle.",
  },
  {
    q: "Quelles tâches administratives peut-on déléguer en priorité ?",
    a: "Les flux répétitifs et chronophages : relances de devis et factures, préparation de pièces, suivi de dossiers, structuration d’échanges, coordination écrite. Ce qui engage juridiquement ou techniquement reste arbitré chez vous.",
  },
  {
    q: "L’externalisation convient-elle aux artisans du bâtiment et aux petites structures ?",
    a: "Oui, c’est même un usage fréquent : peu ou pas de bureau à temps plein, dirigeant sur le terrain. BeWork cadre le périmètre (forfait, missions) pour que la délégation reste lisible et maîtrisée.",
  },
  {
    q: "Comment garder le contrôle sur les documents et décisions importantes ?",
    a: "Par un principe simple : BeWork prépare et propose ; vous validez avant envoi les points sensibles. La plateforme conserve l’historique des demandes et des versions, ce qui limite les erreurs et clarifie les responsabilités.",
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
      description="Externaliser administratif PME : assistant virtuel pour devis, factures, relances. Sans recrutement. Dès 290 € TTC/mois. France, Belgique, Suisse, Luxembourg."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Externaliser son administratif", href: PAGE_PATH },
      ]}
      h1="Externaliser son administratif : tuto et bonnes pratiques"
      intro={
        <>
          Externaliser administratif PME permet de recentrer vos équipes sur le cœur de métier tout en sécurisant
          devis, factures et relances. BeWork propose un assistant administratif externalisé dédié, sans recrutement.
          Dès 290 € TTC/mois — France, Belgique, Suisse, Luxembourg.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <h2>Pourquoi externaliser l&apos;administratif ?</h2>
      <p>
        Les tâches administratives chronophages (emails, facturation, suivi dossiers) peuvent être externalisées avec
        un assistant virtuel entreprise. Vous gagnez du temps, vous maîtrisez vos coûts et vous gardez la main sur la
        qualité grâce à une équipe supervisée en France.
      </p>

      <h2>Que peut-on externaliser ?</h2>
      <p>
        Secrétariat (agenda, courriers), facturation (devis, factures, relances), suivi de dossiers, saisie documentaire,
        pré-comptabilité. BeWork couvre l&apos;essentiel de l&apos;administratif opérationnel des PME.
      </p>

      <h2>Externaliser administratif PME : combien ça coûte ?</h2>
      <p>
        BeWork propose des forfaits dès 290 € TTC/mois (offre Structure). Pas de charges sociales, pas de recrutement :
        un forfait tout compris. Jusqu&apos;à 75 % d&apos;économie par rapport à un assistant en interne.
      </p>

      <section className="not-prose" id="faq" aria-label="FAQ externaliser son administratif" style={{ scrollMarginTop: "6rem" }}>
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
