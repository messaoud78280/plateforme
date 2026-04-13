import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/relance-devis-btp");

export const metadata: Metadata = {
  title: "Relance devis BTP : signer plus de chantiers | BeWork",
  description:
    "Relance devis BTP : méthode J+2 / J+7 / J+14, scripts et suivi pour augmenter les signatures sans harceler. Pilotage administratif encadré. Forfaits TTC.",
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
};

export default function Page() {
  const faq = [
    {
      q: "Quand relancer un devis ?",
      a: "Un scénario simple : J+2 (réception), J+7 (proposition de créneau), J+14 (cadrage planning/validité). L’essentiel est la régularité et la traçabilité.",
    },
    {
      q: "Relancer par mail ou par téléphone ?",
      a: "Les deux. Un appel débloque vite, un email laisse une trace. Le bon mix dépend du client, mais le suivi doit être noté (date, réponse, prochaine action).",
    },
    {
      q: "Qu’est-ce qui se délègue ?",
      a: "Préparer les messages, relancer selon vos consignes, tenir le tableau de suivi et remonter les validations. Vous gardez la décision sur le prix, la technique et les concessions.",
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
      title="Relance devis BTP"
      description="Relance devis BTP : signer plus de chantiers"
      h1="Relance devis BTP : une méthode simple pour signer plus de chantiers"
      intro={
        <>
          Un devis non relancé est souvent un chantier perdu. BeWork met en place un suivi structuré (relances, statuts,
          traçabilité) pour augmenter les signatures sans y passer vos soirées — dans un cadre encadré, avec validation
          sur les points sensibles.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>La méthode “J+2 / J+7 / J+14”</h2>
      <p>
        J+2 : vérifier la réception et détecter un point bloquant. J+7 : proposer un créneau d’appel/visite et cadrer la
        prochaine étape. J+14 : relance plus ferme (planning, validité, capacité). Le but : obtenir une réponse claire
        (oui/non/date).
      </p>

      <h2>Ce qu’il faut suivre (sinon vous relancez dans le vide)</h2>
      <p>
        Date d’envoi, montant, décision attendue, prochaine relance, canal, réponse et action suivante. Un suivi minimal
        suffit : la régularité fait la performance.
      </p>

      <h2>BeWork : pilotage administratif, pas “secrétariat”</h2>
      <p>
        Nous tenons le suivi, préparons les relances, mettons à jour les statuts et vous remontons les validations. Vous
        gardez la décision commerciale et technique. Résultat : plus de chantiers sécurisés, moins d’oublis, une relation
        client plus professionnelle.
      </p>
    </SeoLandingPage>
  );
}

