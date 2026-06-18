import Link from "next/link";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/externaliser-administratif";

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

const faq = [
  {
    q: "Pourquoi externaliser le suivi chantier dans une entreprise BTP plutôt que tout internaliser ?",
    a: "Parce que la charge varie fortement selon les chantiers : pics de devis, appels d’offres, relances, clôture DOE. Externaliser permet de sécuriser le rythme côté bureau sans alourdir la masse salariale, avec des forfaits HT et une équipe déjà opérationnelle sur le métier.",
  },
  {
    q: "Quelles tâches peut-on déléguer en priorité ?",
    a: "Les flux chronophages et métier : analyse DCE, relances de devis et factures chantier, préparation de pièces, comptes rendus, suivi de situations marché public, structuration DOE/réserves. Ce qui engage juridiquement ou techniquement reste arbitré chez vous.",
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
      description="Externaliser l'assistance travaux BTP : analyse DCE, relances, dossiers chantier et marchés publics. Sans recrutement. Dès 590 € HT/mois. France, Belgique, Suisse, Luxembourg."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Externaliser son administratif", href: PAGE_PATH },
      ]}
      h1="Externaliser le suivi chantier : assistance travaux BTP encadrée"
      intro={
        <>
          Externaliser ne veut pas dire déléguer de la saisie générique : pour le bâtiment, BeWork apporte une{" "}
          <strong>assistance technique et administrative</strong> — analyse DCE, relances, dossiers chantier, appels
          d&apos;offres et marchés publics. Dès 590 € HT/mois — France, Belgique, Suisse, Luxembourg.{" "}
          <Link href="/services/externalisation-administrative-btp" className="text-[#1d4ed8] hover:underline">
            Voir le service
          </Link>
          .
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <h2>Pourquoi externaliser l’assistance travaux ?</h2>
      <p>
        Les dossiers chantier, AO et clôture marché public sont chronophages. Les externaliser avec une équipe
        spécialisée BTP permet de recentrer vos équipes sur le terrain tout en sécurisant délais, preuves et
        traçabilité.
      </p>

      <h2>Que peut-on externaliser ?</h2>
      <p>
        Analyse DCE, relances devis et situations, comptes rendus, suivi fournisseurs, préparation DOE et réserves,
        facturation Chorus Pro (selon périmètre), coordination documentaire chantier. BeWork couvre l&apos;assistance
        travaux opérationnelle — pas le courrier générique hors métier.
      </p>

      <h2>Combien ça coûte ?</h2>
      <p>
        Forfaits dès 590 € HT/mois, tarifs publics sur{" "}
        <Link href="/tarifs" className="text-[#1d4ed8] hover:underline">
          bework.fr/tarifs
        </Link>
        . Pas de recrutement immédiat : niveaux d&apos;accompagnement ajustés au devis selon votre volume réel.
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
