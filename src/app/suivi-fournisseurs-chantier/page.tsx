import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { landingPageMetadata } from "@/lib/seo-landing-metadata";

const PAGE_PATH = "/suivi-fournisseurs-chantier";

export const metadata = landingPageMetadata({
  title: "Suivi fournisseurs chantier : commandes, relances, preuves | BeWork",
  description:
    "Suivi fournisseurs chantier : commande → confirmation → livraison → preuve. Process simple, relances et tableau de suivi pour éviter les retards. Forfaits TTC.",
  path: PAGE_PATH,
  keywords: ["suivi fournisseurs chantier", "commande matériaux BTP", "livraison chantier", "relance fournisseur"],
});

export default function Page() {
  const faq = [
    {
      q: "Pourquoi le suivi fournisseurs est un sujet “administratif” rentable ?",
      a: "Parce qu’un retard de livraison peut immobiliser une équipe. Un process simple et traçable évite des jours perdus et des tensions planning.",
    },
    {
      q: "Quel process simple mettre en place ?",
      a: "Commande avec infos complètes → confirmation écrite → relance avant date → preuve de livraison archivée. Le tableau de suivi est la clé.",
    },
    {
      q: "Que peut déléguer une entreprise BTP ?",
      a: "Relances, confirmations, mise à jour du tableau, classement des bons de livraison. Vous arbitrez seulement en cas de blocage (urgence, substitution, surcoût).",
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
      description="Suivi fournisseurs chantier : commande → confirmation → livraison → preuve. Process simple, relances et tableau de suivi pour éviter les retards. Forfaits TTC."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Suivi fournisseurs chantier", href: PAGE_PATH },
      ]}
      h1="Suivi fournisseurs chantier : commandes, relances et preuves (sans y passer la journée)"
      intro={
        <>
          Retards fournisseurs = planning qui dérape. BeWork met en place un suivi administratif simple (confirmations,
          relances, preuves, tableau) pour sécuriser la logistique, limiter les jours perdus et rendre votre organisation
          plus fiable.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Commande → confirmation → livraison → preuve</h2>
      <p>
        À chaque commande : référence, quantité, lieu, date. Obtenir une confirmation écrite. Relancer en amont de la date
        et archiver la preuve (bon, email). Ce process simple évite beaucoup de “surprises”.
      </p>

      <h2>Le tableau de suivi</h2>
      <p>
        Par chantier : fournisseur, commande, date prévue, statut, relance, réception, document. L’objectif n’est pas une
        usine à gaz : c’est la régularité.
      </p>

      <h2>Délégation : l’administratif tient, vous arbitrez</h2>
      <p>
        BeWork suit, relance, classe et met à jour. Vous intervenez seulement pour les décisions (urgence, changement,
        surcoût). Résultat : moins de retards, plus de maîtrise.
      </p>
    </SeoLandingPage>
  );
}

