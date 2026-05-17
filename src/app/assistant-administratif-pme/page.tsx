import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/assistant-administratif-pme";

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

const faq = [
  {
    q: "Une PME du BTP peut-elle externaliser une partie de son administratif sans tout déléguer ?",
    a: "Oui. BeWork fonctionne par forfaits : on cible les flux qui bloquent (devis, relances, factures, dossiers chantier) tout en laissant chez vous la décision, la signature et les arbitrages sensibles.",
  },
  {
    q: "Quels services BeWork peut-il prendre en charge pour une PME ?",
    a: "Relances et suivi de devis, préparation de mails et pièces, suivi de factures et situations, structuration de dossiers, aide à l’organisation des documents chantier, tableaux de suivi — selon le niveau de forfait et votre besoin terrain.",
  },
  {
    q: "Est-ce adapté si l’entreprise a déjà une secrétaire ou une assistante en interne ?",
    a: "Souvent oui : BeWork peut prendre la surcharge (pics d’activité, dossiers chantier lourds, relances) ou des missions spécialisées BTP pendant que votre équipe garde le quotidien interne. Le périmètre se définit ensemble.",
  },
  {
    q: "Comment limiter les retards de devis, relances et documents chantier ?",
    a: "Avec des statuts clairs, des relances planifiées et un point régulier sur les dossiers ouverts. BeWork aide à tenir le rythme côté bureau pendant que vous êtes sur chantier, avec validation avant tout envoi engageant.",
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
      description="Assistant administratif pour PME : externaliser devis, factures, relances. Assistant virtuel entreprise dès 290 € TTC/mois. France, Belgique, Suisse, Luxembourg."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Assistant administratif PME", href: PAGE_PATH },
      ]}
      h1="Assistant administratif pour PME : externaliser sans recruter"
      intro={
        <>
          Les PME peuvent externaliser leur administratif avec un assistant virtuel entreprise dédié. Devis, factures,
          relances, suivi de dossiers : BeWork accompagne les dirigeants de PME en France, Belgique, Suisse et Luxembourg.
          Assistant administratif externalisé dès 290 € TTC/mois.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <h2>Pourquoi externaliser administratif PME ?</h2>
      <p>
        Les PME manquent souvent de temps et de ressources pour gérer l&apos;administratif en interne. Un assistant
        administratif à distance permet de déléguer devis, factures, relances et suivi de dossiers sans recruter,
        sans charges sociales ni coût d&apos;infrastructure.
      </p>

      <h2>Que fait un assistant administratif pour PME ?</h2>
      <p>
        Emails, devis clients, factures, relances impayées, agenda, suivi des commandes, saisie documentaire,
        pré-comptabilité. L&apos;assistant administratif PME s&apos;adapte à votre secteur et à vos outils.
      </p>

      <h2>Combien coûte un assistant administratif pour PME ?</h2>
      <p>
        BeWork propose des forfaits dès 290 € TTC/mois (offre Structure). Externaliser administratif PME coûte jusqu&apos;à
        75 % moins cher qu&apos;un recrutement interne. Tout est inclus : équipe francophone, supervision en France.
      </p>

      <section className="not-prose" id="faq" aria-label="FAQ assistant administratif PME" style={{ scrollMarginTop: "6rem" }}>
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
