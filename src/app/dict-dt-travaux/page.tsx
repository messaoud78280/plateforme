import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/dict-dt-travaux";

export const metadata = landingPageMetadata({
  title: "DICT / DT : dossier, délais, suivi (BTP) | BeWork",
  description:
    "DICT / DT : préparation du dossier, suivi des accusés, relances et classement. Démarches chantier cadrées pendant que vous restez sur le terrain. Forfaits TTC.",
  path: PAGE_PATH,
  keywords: ["DICT BTP", "déclaration travaux", "dossier DT chantier", "démarches administratives BTP"],
});

export default function Page() {
  const faq = [
    {
      q: "DICT et DT : c’est quoi la différence ?",
      a: "La DT (déclaration de projet de travaux) intervient en amont, la DICT (intention de commencement) avant les travaux. Dans tous les cas, le suivi administratif (pièces, délais, accusés) est déterminant.",
    },
    {
      q: "Qu’est-ce qui se délègue sans risque ?",
      a: "Constitution du dossier, suivi des accusés de réception, relances, classement des réponses, mise à jour d’un tableau par chantier. Les décisions techniques et engagements restent chez vous.",
    },
    {
      q: "Pourquoi c’est un sujet SEO rentable ?",
      a: "Parce que les recherches DT/DICT sont très intentionnelles : l’entreprise a un chantier, une date et une contrainte. Un process solide évite les retards et les risques.",
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
      description="DICT / DT : préparation du dossier, suivi des accusés, relances et classement. Démarches chantier cadrées pendant que vous restez sur le terrain. Forfaits TTC."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "DICT / DT", href: PAGE_PATH },
      ]}
      h1="DICT / DT : préparer le dossier et tenir le suivi, sans perdre du temps terrain"
      intro={
        <>
          DT/DICT génèrent des pièces, des délais et des échanges. Ce n’est pas “du secrétariat” : c’est un flux à
          piloter. BeWork structure la préparation, le suivi et le classement pour éviter les retards et garder un dossier
          propre par chantier.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Le vrai problème : le suivi, pas la connaissance</h2>
      <p>
        Beaucoup d’entreprises savent quoi faire, mais manquent de temps pour suivre les accusés, relancer, archiver et
        transmettre les réponses. C’est là que les retards se créent.
      </p>

      <h2>Le process simple</h2>
      <p>
        Tableau par chantier, pièces standardisées, calendrier (dates butoirs) et relances. Vous validez les points
        sensibles, l’administratif reste tenu dans le temps.
      </p>

      <h2>Résultat : moins de risques, planning mieux tenu</h2>
      <p>
        Un dossier DT/DICT propre réduit les blocages et sécurise la coordination. Vous restez sur l’ouvrage, le dossier
        reste à jour.
      </p>
    </SeoLandingPage>
  );
}

