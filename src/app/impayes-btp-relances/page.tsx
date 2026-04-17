import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/impayes-btp-relances";

export const metadata = landingPageMetadata({
  title: "Impayés BTP : relances cadrées et trésorerie | BeWork",
  description:
    "Impayés BTP : organisation des relances (J+5/J+15/J+30), suivi des encaissements, preuves et reporting. Pilotage administratif encadré, forfaits TTC.",
  path: PAGE_PATH,
  keywords: ["impayés BTP", "relance facture artisan", "trésorerie chantier", "encaissement BTP"],
});

export default function Page() {
  const faq = [
    {
      q: "Comment relancer une facture impayée sans dégrader la relation ?",
      a: "Relance courte, factuelle, traçable, avec un calendrier régulier. L’idée est d’obtenir une date d’encaissement et de documenter les échanges.",
    },
    {
      q: "Quelles preuves garder ?",
      a: "Devis/bon pour accord, facture, accusés d’envoi, échanges (mail/appel), situations si besoin. Le classement par chantier évite les pertes d’information.",
    },
    {
      q: "Qu’est-ce que BeWork fait concrètement ?",
      a: "Suivi des encaissements, relances cadrées selon vos consignes, mise à jour d’un tableau, et remontée des cas sensibles pour validation (mise en demeure, juridique).",
    },
  ] as const;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <SeoLandingPage
      description="Impayés BTP : organisation des relances (J+5/J+15/J+30), suivi des encaissements, preuves et reporting. Pilotage administratif encadré, forfaits TTC."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Impayés BTP", href: PAGE_PATH },
      ]}
      h1="Impayés BTP : relances cadrées pour sécuriser la trésorerie"
      intro={
        <>
          Les impayés ne viennent pas seulement du client : ils viennent souvent d’un suivi irrégulier. BeWork met en
          place un pilotage administratif de relances (calendrier, preuves, reporting) pour sécuriser vos encaissements
          sans transformer chaque facture en conflit.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Le calendrier simple : J+5 / J+15 / J+30</h2>
      <p>
        Une relance efficace est régulière et documentée. J+5 : rappel amiable. J+15 : relance plus structurée. J+30 :
        relance ferme avec cadrage (date, pièces, escalade). Les sujets sensibles restent validés par vous.
      </p>

      <h2>Traçabilité : ce qui fait gagner du temps</h2>
      <p>
        Un tableau “facture → échéance → relance → réponse → prochaine action” + un dossier pièces par chantier. C’est
        ce socle qui évite de “tout refaire” à chaque impayé.
      </p>

      <h2>Pilotage BeWork : suivi, pas disponibilité illimitée</h2>
      <p>
        Vous achetez un cadre : un niveau de suivi, des prestations réalisées et des indicateurs. L’objectif est simple :
        des encaissements plus réguliers, une trésorerie moins tendue et moins de stress côté dirigeant.
      </p>
    </SeoLandingPage>
  );
}

