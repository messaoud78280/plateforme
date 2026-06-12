/**
 * Offres commerciales publiques BeWork (site vitrine /tarifs).
 * Indépendant de `subscription-plans` (facturation interne / dashboard).
 */

import { formatPriceLabelFr, SUBSCRIPTION_PRICE_TAX_LABEL } from "@/lib/subscription-plans";

export { formatPriceLabelFr };

export type BeWorkPublicOfferKey =
  | "INTERVENTION_PONCTUELLE"
  | "MISSION_STRUCTUREE"
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
  priceUnit: "intervention" | "dossier_structure" | "mois" | "devis";
  positioning: string;
  tagline: string;
  includes: readonly string[];
  examples?: readonly string[];
  cta: BeWorkPublicOfferCta;
  recommended?: boolean;
};

export const BEWORK_PUBLIC_OFFERS: readonly BeWorkPublicOffer[] = [
  {
    key: "INTERVENTION_PONCTUELLE",
    name: "Intervention ponctuelle",
    priceFrom: "150",
    priceUnit: "intervention",
    positioning:
      "Pour une demande ciblée, simple et limitée : mise au propre d’un document, relance structurée, reprise d’un compte rendu simple ou aide ponctuelle sur un dossier chantier.",
    tagline: "Une porte d’entrée simple pour tester BeWork sans abonnement.",
    examples: [
      "Mise au propre d’un document chantier",
      "Relance structurée client, fournisseur ou sous-traitant",
      "Reprise d’un compte rendu simple",
      "Aide ponctuelle sur un dossier chantier",
      "Préparation d’un mail professionnel lié à un chantier",
    ],
    includes: [],
    cta: {
      label: "Demander une intervention ponctuelle",
      href: "/contact?sujet=Intervention+ponctuelle",
    },
  },
  {
    key: "MISSION_STRUCTUREE",
    name: "Mission structurée",
    priceFrom: "250",
    priceUnit: "dossier_structure",
    positioning:
      "Pour un dossier nécessitant analyse, préparation, structuration documentaire ou livrable exploitable.",
    tagline: "Pour déléguer un dossier clair avec un livrable exploitable.",
    examples: [
      "Analyse DCE / CCTP",
      "Préparation PPSPS",
      "Préparation ou reprise DOE",
      "Mémoire technique",
      "Audit devis ou dossier chantier",
      "Structuration d’un dossier travaux",
      "Compte rendu complexe avec photos, réserves et actions à suivre",
      "Relances structurées liées à un dossier",
    ],
    includes: [
      "Périmètre défini avant démarrage",
      "Livrable structuré et traçable",
      "Relecture humaine avant transmission",
      "Validation finale chez le client",
    ],
    cta: {
      label: "Obtenir un devis pour une mission",
      href: "/contact?sujet=Mission+structuree",
    },
  },
  {
    key: "RELAIS_ESSENTIEL",
    name: "Relais Travaux Essentiel",
    priceFrom: "590",
    priceUnit: "mois",
    positioning:
      "Pour les entreprises BTP qui veulent structurer leur suivi bureau-chantier sans créer immédiatement un poste interne.",
    tagline: "Pour mieux suivre devis, relances et dossiers simples sans recruter.",
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
    priceFrom: "1490",
    priceUnit: "mois",
    recommended: true,
    positioning:
      "L’offre adaptée aux entreprises qui gèrent plusieurs dossiers actifs et veulent soulager leurs conducteurs de travaux sans recruter immédiatement.",
    tagline: "Pour fiabiliser le suivi bureau-chantier quand plusieurs dossiers tournent en parallèle.",
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
    priceFrom: "2900",
    priceUnit: "mois",
    positioning:
      "Pour les entreprises multi-chantiers qui veulent externaliser une partie organisée du suivi travaux, sans recruter immédiatement.",
    tagline: "Une cellule travaux à distance pour structurer vos dossiers sans embauche.",
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

/** Offres affichées sur la grille /tarifs (hors intervention ponctuelle et mission structurée). */
export const BEWORK_TARIFS_GRID_OFFER_KEYS = [
  "RELAIS_ESSENTIEL",
  "RELAIS_PRO",
  "CELLULE_TRAVAUX",
  "SUR_MESURE",
] as const satisfies readonly BeWorkPublicOfferKey[];

export function getBeworkTarifsGridOffers(): BeWorkPublicOffer[] {
  return BEWORK_TARIFS_GRID_OFFER_KEYS.map(
    (key) => BEWORK_PUBLIC_OFFERS.find((o) => o.key === key)!,
  );
}

export const BEWORK_TARIFS_TIER_PRICING_NOTE =
  "Les interventions à 150 € HT couvrent une demande ciblée et limitée. Dès qu’une analyse, une structuration documentaire ou un livrable d’envergure est nécessaire, la mission est cadrée en dossier structuré à partir de 250 € HT.";

/** @deprecated Alias — préférer BEWORK_TARIFS_TIER_PRICING_NOTE */
export const BEWORK_MISSION_PONCTUELLE_PRICING_NOTE = BEWORK_TARIFS_TIER_PRICING_NOTE;

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
  { title: "Nous cadrons vos besoins", desc: "Volume de dossiers, chantiers, livrables et niveau de suivi attendu." },
  { title: "Nous définissons le périmètre", desc: "Périmètre clair, livrables et fréquence de reporting." },
  { title: "Vous recevez une proposition claire", desc: "Tarif ajusté au périmètre — pas de grille opaque à l’heure." },
  { title: "BeWork démarre le suivi", desc: "Méthode, traçabilité et supervision humaine dès le lancement." },
] as const;

export const BEWORK_TARIFS_FAQ = [
  {
    q: "BeWork facture-t-il à l’heure ?",
    a: "Non. BeWork fonctionne par intervention ponctuelle, mission structurée, accompagnement mensuel ou devis personnalisé. Vous achetez un périmètre clair, des livrables et un niveau de suivi, pas simplement du temps passé.",
  },
  {
    q: "Combien coûte un assistant travaux externalisé ?",
    a: "Le coût dépend du volume de dossiers, du nombre de chantiers, des livrables attendus et du niveau de suivi demandé. BeWork propose des interventions ponctuelles à partir de 150 € HT, des missions structurées à partir de 250 € HT et des accompagnements mensuels à partir de 590 € HT.",
  },
  {
    q: "Pourquoi BeWork affiche des prix « à partir de » ?",
    a: "Parce que chaque entreprise BTP a une organisation différente. Le tarif final dépend du périmètre réel : nombre de chantiers, fréquence de suivi, complexité des dossiers, livrables attendus et niveau de reporting.",
  },
  {
    q: "BeWork remplace-t-il un conducteur de travaux ?",
    a: "Non. BeWork ne remplace pas la responsabilité technique du conducteur de travaux. BeWork l’aide à tenir le suivi bureau-chantier, les relances, les documents, les comptes rendus et les dossiers administratifs.",
  },
  {
    q: "Peut-on commencer sans abonnement mensuel ?",
    a: "Oui. Une entreprise peut commencer par une intervention ponctuelle simple ou une mission structurée : analyse DCE, DOE, PPSPS, mémoire technique, compte rendu de chantier, devis ou relances.",
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
  "Interventions dès 150 € HT · missions structurées dès 250 € HT · accompagnements dès 590 € HT/mois";

export const BEWORK_MARKETING_PRICE_LINE_SHORT = "Dès 150 € HT · relais mensuel dès 590 € HT";

export function getMarketingPriceBoundsLabels(): {
  low: string;
  high: string;
  monthlyLow: string;
  interventionLow: string;
} {
  return { interventionLow: "150", low: "250", high: "2900", monthlyLow: "590" };
}

export function getMarketingAggregateOfferDescription(): string {
  const f = formatPriceLabelFr;
  return (
    `Six niveaux d’accompagnement : intervention ponctuelle (à partir de ${f("150")} € ${SUBSCRIPTION_PRICE_TAX_LABEL}), ` +
    `mission structurée (${f("250")} € ${SUBSCRIPTION_PRICE_TAX_LABEL}/dossier), ` +
    `Relais Travaux Essentiel (${f("590")} € ${SUBSCRIPTION_PRICE_TAX_LABEL}/mois), ` +
    `Relais Travaux Pro (${f("1490")} € ${SUBSCRIPTION_PRICE_TAX_LABEL}/mois — offre recommandée), ` +
    `Cellule Travaux Externalisée (${f("2900")} € ${SUBSCRIPTION_PRICE_TAX_LABEL}/mois), sur devis.`
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
  if (offer.priceUnit === "intervention") return `À partir de ${amount} € ${SUBSCRIPTION_PRICE_TAX_LABEL}`;
  if (offer.priceUnit === "dossier_structure")
    return `À partir de ${amount} € ${SUBSCRIPTION_PRICE_TAX_LABEL} / dossier structuré`;
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
