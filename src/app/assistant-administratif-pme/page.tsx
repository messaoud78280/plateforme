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

      <h2>Pourquoi une assistance travaux pour une PME ?</h2>
      <p>
        Les PME manquent souvent de temps pour structurer dossiers chantier, AO et clôture marché. Une assistance
        travaux encadrée permet de déléguer l&apos;analyse et le suivi documentaire sans charges sociales ni
        recrutement immédiat.
      </p>

      <h2>Que fait un assistant travaux pour PME ?</h2>
      <p>
        Analyse de pièces marché, relances devis et situations, comptes rendus, suivi fournisseurs, préparation DOE
        et réserves, coordination documentaire chantier — sur vos outils et selon votre périmètre.
      </p>

      <h2>Combien coûte l’accompagnement ?</h2>
      <p>
        BeWork propose des forfaits dès 590 € HT/mois. Pas de crédits ni de prix horaire opaque : niveaux
        d&apos;accompagnement publics sur{" "}
        <Link href="/tarifs" className="text-[#1d4ed8] hover:underline">
          bework.fr/tarifs
        </Link>
        , ajustés au devis selon votre volume réel.
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
