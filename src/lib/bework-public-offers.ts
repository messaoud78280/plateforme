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
  "Dossiers chantier mieux structurés",
  "Relances MOE, MOA et fournisseurs mieux suivies",
  "Documents et preuves centralisés",
  "Conducteurs de travaux moins saturés",
  "Réserves suivies jusqu’à leur levée",
  "DOE préparé au fil de l’eau",
  "Facturation mieux anticipée",
  "Supervision humaine avant transmission",
  "Validation finale conservée par l’entreprise",
] as const;

export const BEWORK_PRICING_CRITERIA = [
  "Nombre d’utilisateurs",
  "Modules activés",
  "Niveau de personnalisation",
  "Workflows et droits d’accès",
  "Usages d’intelligence artificielle",
  "Intégrations avec vos outils",
  "Volume de données et documents",
  "Niveau d’accompagnement souhaité",
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
  "L’usage quotidien de la plateforme par vos équipes",
  "La validation finale des documents",
  "Les choix techniques",
  "Les prix, marges et arbitrages commerciaux",
  "Les décisions chantier",
  "Les engagements contractuels et signatures",
] as const;

export const BEWORK_TARIFS_PROCESS_STEPS = [
  { title: "Vous demandez une étude", desc: "Premier échange pour comprendre votre organisation et vos priorités." },
  { title: "Nous diagnostiquons", desc: "Métiers, processus, outils existants et besoins de configuration." },
  { title: "Nous cadrons le périmètre", desc: "Modules, workflows, rôles, IA et niveau d’accompagnement." },
  { title: "Vous recevez une proposition", desc: "Mise en place initiale + abonnement mensuel. Vous recevez une proposition claire correspondant au périmètre retenu." },
  { title: "Déploiement et formation", desc: "Configuration, tests, formation — puis vos équipes pilotent au quotidien." },
] as const;

export const BEWORK_TARIFS_FAQ = [
  {
    q: "BeWork exécute-t-il nos missions quotidiennes ?",
    a: "Non. BeWork conçoit, déploie et fait évoluer votre plateforme. Ce sont vos collaborateurs autorisés qui l’utilisent au quotidien pour vos marchés, chantiers, documents et validations.",
  },
  {
    q: "Comment est calculé le tarif ?",
    a: "Le tarif dépend du nombre d’utilisateurs, des modules, du niveau de personnalisation, des usages IA, des intégrations et du niveau d’accompagnement. Aucune grille publique fixe n’est affichée : chaque proposition suit une étude de votre organisation.",
  },
  {
    q: "Que comprend l’abonnement mensuel ?",
    a: "L’accès à la plateforme, l’hébergement, la maintenance, la sécurité, le support et l’évolution progressive selon votre formule. Il ne donne pas droit à des développements spécifiques illimités.",
  },
  {
    q: "Les développements spécifiques sont-ils inclus ?",
    a: "Les adaptations courantes peuvent être intégrées selon votre formule. Les développements spécifiques importants font l’objet d’un cadrage et d’une proposition distincte.",
  },
  {
    q: "BeWork remplace-t-il un conducteur de travaux ?",
    a: "Non. BeWork ne se substitue pas à vos salariés dans l’analyse finale, la conduite des travaux ou les décisions contractuelles. La plateforme assiste ; vos professionnels valident.",
  },
  {
    q: "Qui valide les analyses produites par l’IA ?",
    a: "La validation reste sous la responsabilité des professionnels de votre entreprise. Les documents sont traités pour fournir les fonctionnalités demandées, selon les engagements de confidentialité et les paramètres des fournisseurs techniques.",
  },
  {
    q: "BeWork convient-il aux marchés publics ?",
    a: "Oui. La plateforme peut aider à structurer les pièces, analyser les DCE, préparer les mémoires techniques et suivre les documents chantier. La validation finale et les engagements restent chez l’entreprise.",
  },
] as const;

export const BEWORK_MARKETING_PRICE_LINE =
  "Interventions dès 150 € HT · missions structurées dès 250 € HT · accompagnements dès 590 € HT/mois";

export const BEWORK_MARKETING_PRICE_LINE_SHORT = "Dès 150 € HT · accompagnement mensuel dès 590 € HT";

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
