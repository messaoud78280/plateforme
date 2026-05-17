import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/avenant-chantier";

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

export default function Page() {
  const faq = [
    {
      q: "Pourquoi les avenants créent des litiges ?",
      a: "Parce qu’ils sont exécutés avant d’être validés. Sans accord écrit et traçabilité, la discussion revient au moment de facturer.",
    },
    {
      q: "Quel est le process minimal ?",
      a: "Demande → chiffrage → validation écrite → exécution → archivage + facturation. Le gain est énorme pour peu de structure.",
    },
    {
      q: "Que fait BeWork ?",
      a: "Prépare les documents, suit les validations, relance, classe et met à jour le dossier. Vous validez le fond (prix/technique/engagement).",
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
      description="Avenant chantier : process administratif (demande, chiffrage, validation, preuve, archivage) pour sécuriser vos marges et éviter les litiges. Forfaits TTC."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Avenant chantier", href: PAGE_PATH },
      ]}
      h1="Avenant chantier : le process administratif pour sécuriser votre chiffre d’affaires"
      intro={
        <>
          Les travaux supplémentaires sont normaux. Le litige ne l’est pas. BeWork met en place un cadre simple pour
          chiffrer, faire valider et archiver les avenants, afin de sécuriser votre marge et votre encaissement.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Le risque : “on verra à la fin”</h2>
      <p>
        Sur le chantier, on avance. Mais sans validation écrite, l’avenant devient une discussion. La solution est
        administrative : un process court, répété, traçable.
      </p>

      <h2>Les pièces à standardiser</h2>
      <p>
        Modèle d’avenant, checklist pièces (photos, métrés, plans), dossier par chantier. L’objectif : gagner du temps et
        éviter les oublis.
      </p>

      <h2>Pilotage : vous décidez, le dossier est tenu</h2>
      <p>
        BeWork tient le dossier (préparation, relances, classement). Vous validez les points engageants. Résultat : moins
        de litiges, plus de CA sécurisé.
      </p>
    </SeoLandingPage>
  );
}

