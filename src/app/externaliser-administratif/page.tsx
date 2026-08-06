import Link from "next/link";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/externaliser-administratif";

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

const faq = [
  {
    q: "Pourquoi structurer le suivi chantier via une plateforme plutôt que tout internaliser à la main ?",
    a: "Parce que la charge varie fortement selon les chantiers : pics de devis, appels d’offres, relances, clôture DOE. Une plateforme interne BeWork sécurise le rythme côté bureau sans alourdir la masse salariale — vos équipes pilotent ; BeWork configure et fait évoluer.",
  },
  {
    q: "Quelles capacités prioriser dans la plateforme ?",
    a: "Les flux chronophages et métier : analyse DCE, relances de devis et factures chantier, préparation de pièces, comptes rendus, suivi de situations marché public, structuration DOE/réserves. Ce qui engage juridiquement ou techniquement reste arbitré chez vous.",
  },
  {
    q: "La plateforme convient-elle aux artisans du bâtiment et aux petites structures ?",
    a: "Oui, c’est même un usage fréquent : peu ou pas de bureau à temps plein, dirigeant sur le terrain. BeWork cadre le périmètre au déploiement pour que l’usage reste lisible et maîtrisé.",
  },
  {
    q: "Comment garder le contrôle sur les documents et décisions importantes ?",
    a: "Par un principe simple : la plateforme aide à préparer et organiser ; vous validez avant envoi les points sensibles. L’historique des demandes et des versions limite les erreurs et clarifie les responsabilités. BeWork n’exécute pas à votre place.",
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
      description="Structurer l’admin chantier BTP sans recruter : plateforme interne BeWork pour DCE, relances, dossiers et marchés publics. Vos équipes utilisent ; BeWork configure."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Externaliser son administratif", href: PAGE_PATH },
      ]}
      h1="Structurer le suivi chantier : plateforme interne BTP BeWork"
      intro={
        <>
          Structurer l&apos;administratif ne veut pas dire faire faire à votre place : BeWork déploie une{" "}
          <strong>plateforme interne</strong> — analyse DCE, relances, dossiers chantier, appels d&apos;offres et
          marchés publics. Vos équipes utilisent ; BeWork configure, déploie et fait évoluer. France, Belgique, Suisse,
          Luxembourg.{" "}
          <Link href="/services/externalisation-administrative-btp" className="text-[#1d4ed8] hover:underline">
            Voir le service
          </Link>
          .
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <h2>Pourquoi une plateforme plutôt qu&apos;un bureau improvisé ?</h2>
      <p>
        Les dossiers chantier, AO et clôture marché public sont chronophages. Les structurer dans un environnement
        métier permet de recentrer vos équipes sur le terrain tout en sécurisant délais, preuves et traçabilité — sans
        confondre éditeur de plateforme et prestataire exécutant.
      </p>

      <h2>Que couvre la plateforme ?</h2>
      <p>
        Analyse DCE, relances devis et situations, comptes rendus, suivi fournisseurs, préparation DOE et réserves,
        facturation Chorus Pro (selon périmètre), coordination documentaire chantier. BeWork équipe l&apos;assistance
        travaux opérationnelle — pas le courrier générique hors métier.
      </p>

      <h2>Comment ça se tarifie ?</h2>
      <p>
        Tarification sur étude selon modules, volume et formule — détail de la méthode sur{" "}
        <Link href="/tarifs" className="text-[#1d4ed8] hover:underline">
          bework.fr/tarifs
        </Link>
        . Pas de recrutement immédiat : le périmètre s&apos;ajuste à votre organisation réelle.
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
