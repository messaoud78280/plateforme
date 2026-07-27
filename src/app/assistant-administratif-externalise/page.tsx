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

      <h2>Externaliser plutôt que recruter : ce qui change</h2>
      <p>
        Un recrutement engage sur la durée : charges sociales, temps de formation au poste, risque si la charge
        retombe après un pic. Un forfait BeWork s&apos;ajuste au volume réel et peut démarrer sur un périmètre
        restreint — une mission, un dossier — avant, éventuellement, de monter en charge. La réversibilité est plus
        simple qu&apos;un contrat de travail.
      </p>

      <h2>Comment démarre une mission externalisée</h2>
      <p>
        Premier échange pour cadrer le besoin et les documents disponibles, définition d&apos;un périmètre écrit (ce
        qui est pris en charge, ce qui ne l&apos;est pas), puis premier livrable sur un dossier réel pour valider la
        méthode avant d&apos;élargir. Rien n&apos;est engagé sur la durée dès le départ.
      </p>

      <h2>Le contrôle ne change pas de camp</h2>
      <p>
        Externaliser la préparation documentaire ne signifie pas perdre la main : chaque pièce sensible — prix,
        engagement contractuel, réponse à un client — repasse par une validation explicite de votre entreprise avant
        envoi.
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
