/**
 * Offres commerciales publiques BeWork (site vitrine /tarifs).
 * Indépendant de `subscription-plans` (facturation interne / dashboard).
 */

import { formatPriceLabelFr, SUBSCRIPTION_PRICE_TAX_LABEL } from "@/lib/subscription-plans";

export { formatPriceLabelFr };

export type BeWorkPublicOfferKey =
  | "MISSION_PONCTUELLE"
  | "RELAIS_ESSENTIEL"
  | "RELAIS_PRO"
  | "CELLULE_TRAVAUX"
  | "SUR_MESURE";

export type BeWorkPublicOfferCta = {
  label: string;
  href: string;
  /** Lien Calendly (composant dédié) plutôt qu’un Link Next. */
  calendly?: boolean;
};

export type BeWorkPublicOffer = {
  key: BeWorkPublicOfferKey;
  name: string;
  /** Montant HT numérique sans espaces ; null = sur devis. */
  priceFrom: string | null;
  priceUnit: "dossier" | "mois" | "devis";
  positioning: string;
  tagline: string;
  includes: readonly string[];
  examples?: readonly string[];
  cta: BeWorkPublicOfferCta;
  recommended?: boolean;
};

export const BEWORK_PUBLIC_OFFERS: readonly BeWorkPublicOffer[] = [
  {
    key: "MISSION_PONCTUELLE",
    name: "Mission ponctuelle",
    priceFrom: "250",
    priceUnit: "dossier",
    positioning: "Pour traiter un besoin précis, sans abonnement.",
    tagline: "Pour déléguer un dossier précis sans engagement mensuel.",
    examples: [
      "Compte rendu de chantier",
      "Analyse DCE / CCTP",
      "Préparation PPSPS",
      "Préparation DOE",
      "Mémoire technique",
      "Audit devis ou dossier chantier",
      "Relances clients, fournisseurs ou sous-traitants",
      "Structuration d’un dossier travaux",
    ],
    includes: [
      "Périmètre défini pour un dossier ou une mission",
      "Livrables structurés et traçables",
      "Relecture humaine avant transmission",
      "Validation finale chez vous",
    ],
    cta: {
      label: "Commencer par une mission ponctuelle",
      href: "/contact?sujet=Mission+ponctuelle",
    },
  },
  {
    key: "RELAIS_ESSENTIEL",
    name: "Relais Travaux Essentiel",
    priceFrom: "790",
    priceUnit: "mois",
    positioning:
      "Pour les artisans structurés, petites entreprises BTP et dirigeants débordés qui veulent reprendre le contrôle du suivi administratif et chantier sans recruter.",
    tagline: "Pour reprendre le contrôle du suivi bureau-chantier sans créer un poste interne.",
    includes: [
      "Suivi devis et relances",
      "Classement documentaire chantier",
      "Préparation de mails clients / fournisseurs",
      "Tableau de suivi simple",
      "Alertes sur les pièces manquantes ou relances à prévoir",
      "Synthèse régulière de l’avancement",
    ],
    cta: { label: "Demander un devis", href: "/contact?sujet=Relais+Travaux+Essentiel" },
  },
  {
    key: "RELAIS_PRO",
    name: "Relais Travaux Pro",
    priceFrom: "1900",
    priceUnit: "mois",
    recommended: true,
    positioning:
      "Pour les PME BTP, conducteurs de travaux, chargés d’affaires et entreprises qui gèrent plusieurs dossiers en parallèle.",
    tagline: "Pour soulager vos conducteurs de travaux et fiabiliser le suivi bureau-chantier.",
    includes: [
      "Suivi régulier des dossiers chantier",
      "Comptes rendus structurés",
      "Analyse DCE / CCTP / pièces marché",
      "Préparation et suivi DOE / PPSPS",
      "Relances clients, fournisseurs, sous-traitants",
      "Reporting hebdomadaire",
      "Priorisation des urgences",
      "Traçabilité des demandes et documents",
    ],
    cta: { label: "Réserver un appel", href: "/contact", calendly: true },
  },
  {
    key: "CELLULE_TRAVAUX",
    name: "Cellule Travaux Externalisée",
    priceFrom: "3500",
    priceUnit: "mois",
    positioning:
      "Pour entreprises générales, PME multi-chantiers, titulaires de marchés publics ou privés, structures qui veulent externaliser une partie organisée du suivi travaux.",
    tagline: "Une cellule travaux à distance pour structurer vos dossiers sans recruter immédiatement.",
    includes: [
      "Suivi multi-chantiers",
      "Centralisation documentaire",
      "Reporting régulier",
      "Suivi des réserves",
      "Préparation des livrables administratifs et techniques",
      "Suivi DOE, PPSPS, situations, comptes rendus",
      "Coordination documentaire entre direction, chantier, clients, fournisseurs et sous-traitants",
      "Supervision humaine renforcée",
    ],
    cta: {
      label: "Parler de votre organisation",
      href: "/contact?sujet=Cellule+Travaux+Externalisee",
    },
  },
  {
    key: "SUR_MESURE",
    name: "Offre sur mesure",
    priceFrom: null,
    priceUnit: "devis",
    positioning:
      "Pour groupes, volumes importants, agences multi-sites, marchés publics récurrents ou besoins spécifiques.",
    tagline: "Pour les organisations qui veulent externaliser durablement une partie du suivi travaux.",
    includes: [
      "Process dédié",
      "Volume important de dossiers",
      "Multi-agences ou multi-chantiers",
      "Reporting personnalisé",
      "Workflow adapté à l’organisation interne",
      "Accompagnement long terme",
    ],
    cta: { label: "Construire une offre sur mesure", href: "/contact?sujet=Offre+sur+mesure" },
  },
] as const;

export const BEWORK_REPOSITIONING_POINTS = [
  "Moins d’oublis dans les dossiers",
  "Des relances mieux suivies",
  "Des documents mieux structurés",
  "Des conducteurs de travaux moins saturés",
  "Une meilleure traçabilité",
  "Une supervision humaine avant transmission",
  "Une validation finale qui reste chez l’entreprise",
] as const;

export const BEWORK_PRICING_CRITERIA = [
  "Nombre de chantiers suivis",
  "Volume de dossiers à traiter",
  "Types de livrables attendus",
  "Fréquence des points de suivi",
  "Urgence des demandes",
  "Complexité des pièces marché",
  "Niveau de reporting attendu",
  "Nombre d’interlocuteurs à coordonner",
] as const;

export const BEWORK_SCOPE_TAKEOVER = [
  "Devis et relances",
  "Analyse DCE / CCTP / pièces marché",
  "Comptes rendus de chantier",
  "PPSPS",
  "DOE",
  "Mémoires techniques",
  "Situations de travaux",
  "Suivi fournisseurs",
  "Suivi sous-traitants",
  "Suivi réserves",
  "Classement documentaire chantier",
  "Préparation mails et tableaux de suivi",
  "Reporting administratif et opérationnel",
] as const;

export const BEWORK_CLIENT_KEEPS = [
  "La validation finale",
  "Les choix techniques",
  "Les prix, marges et arbitrages commerciaux",
  "Les décisions chantier",
  "Les engagements contractuels",
  "La signature des documents engageants",
] as const;

export const BEWORK_TARIFS_PROCESS_STEPS = [
  { title: "Vous réservez un appel", desc: "Premier échange pour comprendre votre organisation et vos priorités." },
  { title: "Nous identifions vos besoins réels", desc: "Volume de dossiers, chantiers, livrables et niveau de suivi attendu." },
  { title: "Nous définissons le périmètre de mission", desc: "Périmètre clair, livrables et fréquence de reporting." },
  { title: "Vous recevez une proposition claire", desc: "Tarif ajusté au périmètre — pas de grille opaque au crédit ou à l’heure." },
  { title: "BeWork démarre le suivi selon les priorités validées", desc: "Méthode, traçabilité et supervision humaine dès le lancement." },
] as const;

export const BEWORK_TARIFS_FAQ = [
  {
    q: "Combien coûte un assistant travaux externalisé ?",
    a: "Le coût dépend du volume de dossiers, du nombre de chantiers, des livrables attendus et du niveau de suivi demandé. BeWork propose des missions ponctuelles à partir de 250 € HT et des accompagnements mensuels à partir de 790 € HT.",
  },
  {
    q: "Pourquoi BeWork affiche des prix « à partir de » ?",
    a: "Parce que chaque entreprise BTP a une organisation différente. Le tarif final dépend du périmètre réel : nombre de chantiers, fréquence de suivi, complexité des dossiers, livrables attendus et niveau de reporting.",
  },
  {
    q: "BeWork fonctionne-t-il avec un système de crédits ?",
    a: "Non, les offres commerciales BeWork sont présentées par mission, par niveau d’accompagnement ou sur devis. Le client achète un périmètre clair, des livrables et un niveau de suivi, pas des crédits.",
  },
  {
    q: "BeWork remplace-t-il un conducteur de travaux ?",
    a: "Non. BeWork ne remplace pas la responsabilité technique du conducteur de travaux. BeWork l’aide à tenir le suivi bureau-chantier, les relances, les documents, les comptes rendus et les dossiers administratifs.",
  },
  {
    q: "Peut-on commencer sans abonnement mensuel ?",
    a: "Oui. Une entreprise peut commencer par une mission ponctuelle : analyse DCE, DOE, PPSPS, mémoire technique, compte rendu de chantier, devis ou relances.",
  },
  {
    q: "Qui valide les documents avant envoi ?",
    a: "Le client garde toujours la validation finale. BeWork prépare, structure, suit et alerte, mais les engagements contractuels, les prix, les choix techniques et les signatures restent chez l’entreprise.",
  },
  {
    q: "BeWork convient-il aux marchés publics ?",
    a: "Oui. BeWork peut aider à structurer les pièces, analyser les DCE, préparer les mémoires techniques, suivre les documents chantier et organiser les livrables. La validation finale reste toujours chez l’entreprise.",
  },
] as const;

export const BEWORK_MARKETING_PRICE_LINE =
  "Accompagnements dès 790 € HT/mois · missions ponctuelles dès 250 € HT";

export const BEWORK_MARKETING_PRICE_LINE_SHORT = "Dès 790 € HT/mois · missions dès 250 € HT";

export function getMarketingPriceBoundsLabels(): {
  low: string;
  high: string;
  monthlyLow: string;
} {
  return { low: "250", high: "3500", monthlyLow: "790" };
}

export function getMarketingAggregateOfferDescription(): string {
  const f = formatPriceLabelFr;
  return (
    `Cinq niveaux d’accompagnement : mission ponctuelle (à partir de ${f("250")} € ${SUBSCRIPTION_PRICE_TAX_LABEL}/dossier), ` +
    `Relais Travaux Essentiel (${f("790")} € ${SUBSCRIPTION_PRICE_TAX_LABEL}/mois), ` +
    `Relais Travaux Pro (${f("1900")} € ${SUBSCRIPTION_PRICE_TAX_LABEL}/mois — offre recommandée), ` +
    `Cellule Travaux Externalisée (${f("3500")} € ${SUBSCRIPTION_PRICE_TAX_LABEL}/mois), sur devis.`
  );
}

/** Phrase courte pour schema / layout. */
export function formatMarketingPublicPriceFromHt(): string {
  const { monthlyLow } = getMarketingPriceBoundsLabels();
  return `à partir de ${formatPriceLabelFr(monthlyLow)} € ${SUBSCRIPTION_PRICE_TAX_LABEL}/mois`;
}

export function formatOfferPriceLabel(offer: BeWorkPublicOffer): string {
  if (offer.priceFrom === null) return "Sur devis";
  const amount = formatPriceLabelFr(offer.priceFrom);
  if (offer.priceUnit === "dossier") return `À partir de ${amount} € ${SUBSCRIPTION_PRICE_TAX_LABEL} / dossier`;
  if (offer.priceUnit === "mois") return `À partir de ${amount} € ${SUBSCRIPTION_PRICE_TAX_LABEL} / mois`;
  return "Sur devis";
}

/** Mapping JSON-LD OfferCatalog (prix numériques uniquement si définis). */
export function beworkOffersForJsonLd(): readonly {
  name: string;
  price: string;
  description: string;
  tagline: string;
}[] {
  return BEWORK_PUBLIC_OFFERS.filter((o) => o.priceFrom !== null).map((o) => ({
    name: o.name,
    price: o.priceFrom!,
    description: o.positioning,
    tagline: o.tagline,
  }));
}
