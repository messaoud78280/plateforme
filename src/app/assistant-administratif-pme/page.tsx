import Link from "next/link";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/assistant-administratif-pme";

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

const faq = [
  {
    q: "Une PME du BTP peut-elle externaliser une partie du suivi chantier sans tout déléguer ?",
    a: "Oui. BeWork fonctionne par forfaits : on cible les flux qui bloquent (analyse DCE, relances, dossiers chantier, marchés publics) tout en laissant chez vous la décision, la signature et les arbitrages sensibles.",
  },
  {
    q: "Quels services BeWork peut-il prendre en charge pour une PME ?",
    a: "Analyse DCE, relances et suivi de devis, comptes rendus, situations marché public, structuration de dossiers, aide à l’organisation des pièces chantier, tableaux de suivi — selon le niveau de forfait et votre besoin terrain.",
  },
  {
    q: "Est-ce adapté si l’entreprise a déjà une personne bureau en interne ?",
    a: "Souvent oui : BeWork peut prendre la surcharge (pics d’activité, dossiers chantier lourds, appels d’offres) ou des missions spécialisées BTP pendant que votre équipe garde le quotidien interne. Le périmètre se définit ensemble.",
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
      description="Assistant travaux pour PME BTP : analyse DCE, relances, dossiers chantier et marchés publics. Assistance encadrée dès 590 € HT/mois. France, Belgique, Suisse, Luxembourg."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Assistant administratif PME", href: PAGE_PATH },
      ]}
      h1="Assistant administratif PME : pour le BTP, une assistance travaux structurée"
      intro={
        <>
          Les PME du bâtiment cherchent souvent un « assistant administratif ». BeWork répond avec une{" "}
          <strong>assistance technique et administrative</strong> : analyse DCE, relances, dossiers chantier et suivi
          marché public — sans recruter. France, Belgique, Suisse et Luxembourg. Dès 590 € HT/mois.{" "}
          <Link href="/assistants-administratifs-taches" className="text-[#1d4ed8] hover:underline">
            Voir le catalogue missions
          </Link>
          .
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <h2>Le point de bascule pour une PME du bâtiment</h2>
      <p>
        Tant qu&apos;il y a un ou deux chantiers, le dirigeant ou le conducteur de travaux absorbe l&apos;administratif
        entre deux visites. Dès que plusieurs chantiers et appels d&apos;offres se chevauchent, les relances prennent
        du retard, les pièces s&apos;égarent et les dossiers de candidature se préparent dans l&apos;urgence. C&apos;est
        ce point de bascule que BeWork vient soulager, sans attendre d&apos;avoir la taille critique pour recruter un
        poste bureau à temps plein.
      </p>

      <h2>Un périmètre qui grandit avec vous</h2>
      <p>
        Une mission ponctuelle sur un dossier d&apos;appel d&apos;offres, puis un accompagnement mensuel si le besoin
        se confirme : le niveau de forfait s&apos;ajuste au nombre de chantiers et de dossiers réellement suivis, pas
        à un abonnement figé.
      </p>

      <h2>Le comparatif avec une embauche</h2>
      <p>
        Un poste administratif ou assistant travaux en interne implique salaire chargé, recrutement, formation et un
        temps plein même sur les mois plus calmes. Un forfait BeWork se limite au périmètre cadré, sans les charges
        fixes d&apos;une embauche — utile pour tester le gain de temps avant de décider d&apos;internaliser ou non.
        Niveaux publics sur{" "}
        <Link href="/tarifs" className="text-[#1d4ed8] hover:underline">
          bework.fr/tarifs
        </Link>
        .
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
