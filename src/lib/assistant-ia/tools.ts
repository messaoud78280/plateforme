/**
 * ASSISTANT-IA-V1A — catalogue d’outils métier BTP (sans exécution LLM).
 * Marchés privés + chantier. L’IA proposera ; l’utilisateur valide.
 */

export type AssistantIaFamily = "marches" | "chantier";

export type AssistantIaToolId =
  | "analyser-marche-prive"
  | "obligations-delais"
  | "risques-marche"
  | "travaux-supplementaires"
  | "synthese-dossier"
  | "cr-vers-actions"
  | "controler-doe"
  | "rediger-courrier";

export type AssistantIaTool = {
  id: AssistantIaToolId;
  family: AssistantIaFamily;
  title: string;
  description: string;
  /** Mis en avant sur le hub (ex. analyse marché privé). */
  featured?: boolean;
  featuredLabel?: string;
  /** Capacités / extractions futures. */
  capabilities: string[];
  /** Sources typiques marchés privés / chantier. */
  sources: string[];
  /** Étapes workflow descriptives. */
  workflow: string[];
  /** Actions BeWork futures (aperçu uniquement). */
  futureActions: string[];
  icon:
    | "FileSearch"
    | "ListChecks"
    | "ShieldAlert"
    | "GitCompare"
    | "FolderOpen"
    | "ClipboardList"
    | "PackageCheck"
    | "PenLine";
};

export const ASSISTANT_IA_FAMILIES: {
  id: AssistantIaFamily;
  title: string;
  subtitle: string;
}[] = [
  {
    id: "marches",
    title: "Marchés & contrats",
    subtitle: "Marchés privés BTP — exigences, obligations, points à examiner, avenants.",
  },
  {
    id: "chantier",
    title: "Chantier & documents",
    subtitle: "Synthèses, comptes rendus, DOE et courriers métier.",
  },
];

const FUTURE_ACTIONS_DEFAULT = [
  "Tâche",
  "Agenda",
  "À traiter",
  "Fiche de suivi",
  "Avenant",
];

export const ASSISTANT_IA_TOOLS: AssistantIaTool[] = [
  {
    id: "analyser-marche-prive",
    family: "marches",
    title: "Analyser un marché privé",
    description:
      "Identifiez rapidement les exigences, les prestations, les exclusions et les points importants du marché.",
    featured: true,
    featuredLabel: "Recommandé pour vos marchés",
    capabilities: [
      "Prestations principales",
      "Exclusions",
      "Obligations",
      "Délais",
      "Documents attendus",
      "Points contractuels à vérifier",
      "Travaux supplémentaires potentiels",
    ],
    sources: [
      "Documents du chantier",
      "Contrat / marché",
      "CCTP",
      "Devis accepté",
      "Plans",
      "Conditions particulières",
      "Comptes rendus",
    ],
    workflow: [
      "Choisissez les documents",
      "Lancez l’analyse",
      "Vérifiez les résultats",
      "Transformez les éléments utiles en actions BeWork",
    ],
    futureActions: FUTURE_ACTIONS_DEFAULT,
    icon: "FileSearch",
  },
  {
    id: "obligations-delais",
    family: "marches",
    title: "Obligations & délais",
    description:
      "Repérez les engagements, les échéances, les pièces attendues et les validations importantes.",
    capabilities: [
      "Engagements et échéances",
      "Pièces à fournir",
      "Validations attendues",
      "Proposition d’actions sous validation humaine",
    ],
    sources: [
      "Contrat / marché",
      "Devis accepté",
      "Planning",
      "Ordre de service",
      "Conditions particulières",
    ],
    workflow: [
      "Choisissez les documents",
      "Lancez l’analyse",
      "Vérifiez le tableau obligations / délais",
      "Validez les actions à créer dans BeWork",
    ],
    futureActions: ["Tâche", "Agenda", "À traiter", "Fiche de suivi"],
    icon: "ListChecks",
  },
  {
    id: "risques-marche",
    family: "marches",
    title: "Risques du marché",
    description:
      "Faites ressortir les clauses et points contractuels qui nécessitent votre attention.",
    capabilities: [
      "Points à examiner (délais, pénalités, responsabilités, paiement)",
      "Réception et réserves",
      "Documents contractuels à surveiller",
      "Aide à la décision — pas un avis juridique",
    ],
    sources: ["Contrat / marché", "Conditions particulières", "CCTP", "Annexes"],
    workflow: [
      "Choisissez les documents",
      "Repérage des points sensibles",
      "Revue des points à examiner",
      "Partagez ou créez un suivi",
    ],
    futureActions: ["Tâche", "À traiter", "Fiche de suivi"],
    icon: "ShieldAlert",
  },
  {
    id: "travaux-supplementaires",
    family: "marches",
    title: "Travaux supplémentaires & avenants",
    description:
      "Comparez les demandes reçues avec le périmètre initial et préparez les éléments justificatifs.",
    capabilities: [
      "Comparer demande / CR / devis au périmètre initial",
      "Repérer les éléments potentiellement hors marché",
      "Préparer justificatifs pour avenant ou courrier",
      "Validation avant toute création ou envoi",
    ],
    sources: [
      "Marché / devis accepté initial",
      "Compte rendu ou demande client",
      "Devis complémentaires",
      "Plans",
    ],
    workflow: [
      "Choisissez le marché de référence et la demande",
      "Comparaison périmètre vs demande",
      "Revue des écarts",
      "Préparez avenant / courrier (brouillon à valider)",
    ],
    futureActions: ["Avenant", "Tâche", "Courrier", "À traiter"],
    icon: "GitCompare",
  },
  {
    id: "synthese-dossier",
    family: "chantier",
    title: "Synthétiser un dossier",
    description:
      "Retrouvez l’essentiel d’un chantier avant un démarrage, une réunion ou une intervention.",
    capabilities: [
      "Objet des travaux et intervenants",
      "Contraintes et délais",
      "Documents importants",
      "Points ouverts et prochaines actions",
    ],
    sources: [
      "Dossier chantier",
      "Documents GED",
      "Comptes rendus",
      "Planning",
      "Fiches de suivi",
    ],
    workflow: [
      "Choisissez le chantier et les documents",
      "Génération de la synthèse",
      "Vérifiez les points ouverts",
      "Partagez ou créez des actions",
    ],
    futureActions: FUTURE_ACTIONS_DEFAULT,
    icon: "FolderOpen",
  },
  {
    id: "cr-vers-actions",
    family: "chantier",
    title: "Compte rendu → Actions",
    description: "Transformez un compte rendu en tâches, échéances et actions à valider.",
    capabilities: [
      "Extraire décisions et actions du CR",
      "Proposer tâche, agenda, À traiter, réserve…",
      "Validation case par case",
      "Aucune création silencieuse",
    ],
    sources: ["Compte rendu", "Note chantier", "Message", "Document GED"],
    workflow: [
      "Importez ou collez le compte rendu",
      "Propositions d’actions",
      "Cochez ce qui doit être créé",
      "Validez — BeWork enregistre uniquement le validé",
    ],
    futureActions: ["Tâche", "Agenda", "À traiter", "Fiche de suivi"],
    icon: "ClipboardList",
  },
  {
    id: "controler-doe",
    family: "chantier",
    title: "Contrôler un DOE",
    description: "Vérifiez les documents disponibles et identifiez les pièces manquantes.",
    capabilities: [
      "Comparer GED et liste attendue",
      "Statuts : présent / manquant / à vérifier",
      "Relances avant transmission",
      "Traçabilité réception / solde",
    ],
    sources: ["GED BeWork", "Liste DOE attendue", "Pièces classées du chantier"],
    workflow: [
      "Choisissez le chantier et la liste attendue",
      "Contrôle de présence",
      "Revue des manquants",
      "Relancez ou complétez avant envoi",
    ],
    futureActions: ["À traiter", "Tâche", "Relance"],
    icon: "PackageCheck",
  },
  {
    id: "rediger-courrier",
    family: "chantier",
    title: "Rédiger un courrier BTP",
    description:
      "Préparez un brouillon professionnel à partir du contexte du chantier (relance, validation, avenant, réserve, document).",
    capabilities: [
      "Relance",
      "Demande de validation",
      "Travaux supplémentaires",
      "Réserve",
      "Demande de document",
      "Brouillon à vérifier — jamais d’envoi automatique",
    ],
    sources: ["Contexte chantier", "Documents liés", "Notes / CR", "Marché"],
    workflow: [
      "Choisissez le type de courrier et le chantier",
      "Brouillon proposé",
      "Relisez et corrigez",
      "Copiez ou exportez — envoi manuel",
    ],
    futureActions: ["Courrier", "Tâche", "À traiter"],
    icon: "PenLine",
  },
];

export function getAssistantIaTool(id: string): AssistantIaTool | undefined {
  return ASSISTANT_IA_TOOLS.find((t) => t.id === id);
}

export function toolsByFamily(family: AssistantIaFamily): AssistantIaTool[] {
  return ASSISTANT_IA_TOOLS.filter((t) => t.family === family);
}
