import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/situation-travaux-btp";

export const metadata = landingPageMetadata({
  title: "Situation de travaux BTP : structurer et envoyer sans retard | BeWork",
  description:
    "Situation de travaux BTP : organisation, pièces, fréquence, modèle et suivi pour facturer au fil de l’eau. Pilotage administratif encadré, forfaits TTC.",
  path: PAGE_PATH,
  keywords: ["situation de travaux BTP", "facturation chantier", "avancement travaux", "administratif BTP"],
});

export default function Page() {
  const faq = [
    {
      q: "Pourquoi les situations de travaux sont-elles critiques ?",
      a: "Elles alignent avancement, facturation et encaissement. Une situation en retard crée des décalages de trésorerie et des discussions client.",
    },
    {
      q: "Qu’est-ce qui se délègue ?",
      a: "Préparer le modèle, centraliser les pièces, relancer pour les infos manquantes, mettre en forme et classer. Vous validez le fond et la partie technique.",
    },
    {
      q: "BeWork remplace-t-il votre expertise chantier ?",
      a: "Non. BeWork tient le dossier et le suivi administratif. Les décisions techniques et la responsabilité chantier restent chez vous.",
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
      description="Situation de travaux BTP : organisation, pièces, fréquence, modèle et suivi pour facturer au fil de l’eau. Pilotage administratif encadré, forfaits TTC."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Situation de travaux BTP", href: PAGE_PATH },
      ]}
      h1="Situation de travaux BTP : structurer, envoyer, relancer — sans perdre de temps"
      intro={
        <>
          Les situations de travaux servent votre trésorerie. Le problème n’est pas la technique : c’est la préparation,
          la mise en forme, l’envoi et le suivi. BeWork structure ce flux pour éviter les retards et les oublis, dans un
          cadre de validation clair.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Un rituel simple pour éviter les retards</h2>
      <p>
        Un point hebdomadaire (ou bimensuel) : pièces, avancement, montants à facturer, documents à envoyer. Une fois le
        rituel posé, l’administratif arrête de “rattraper” le chantier.
      </p>

      <h2>Le dossier type</h2>
      <p>
        Modèle de situation, avenants/validations, photos si nécessaire, preuves d’envoi, échéancier et relances. Le
        dossier est propre, traçable et facilement partageable.
      </p>

      <h2>Résultat : facturation plus régulière, trésorerie plus stable</h2>
      <p>
        Une situation à jour facilite la facturation au fil de l’eau et les relances. Vous sécurisez vos encaissements
        sans sacrifier le terrain.
      </p>
    </SeoLandingPage>
  );
}

