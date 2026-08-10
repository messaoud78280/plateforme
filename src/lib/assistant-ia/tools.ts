/**
 * ASSISTANT-IA-V1 — catalogue d’outils métier BTP (sans exécution LLM).
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
  /** Capacités futures (affichage détail). */
  capabilities: string[];
  /** Sources possibles. */
  sources: string[];
  /** Étapes workflow descriptives. */
  workflow: string[];
  /** Icône Lucide (nom). */
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
    subtitle: "Marchés privés BTP — lecture structurée, obligations, points à examiner.",
  },
  {
    id: "chantier",
    title: "Chantier & documents",
    subtitle: "Synthèses chantier, comptes rendus, DOE et courriers métier.",
  },
];

export const ASSISTANT_IA_TOOLS: AssistantIaTool[] = [
  {
    id: "analyser-marche-prive",
    family: "marches",
    title: "Analyser un marché privé",
    description:
      "Déposez les pièces du marché et obtenez une lecture structurée des exigences importantes.",
    capabilities: [
      "Synthétiser les pièces (contrat, devis accepté, CCTP, conditions particulières…)",
      "Repérer le périmètre, les prestations et les exclusions",
      "Identifier les délais et pièces à fournir",
      "Faire ressortir les points à vérifier avant engagement",
    ],
    sources: [
      "Documents du chantier (GED)",
      "PDF importé (sélection explicite)",
      "Pièces déjà classées dans BeWork",
    ],
    workflow: [
      "Choisissez les documents du marché",
      "Lancez l’analyse",
      "Vérifiez la synthèse et les points à examiner",
      "Transformez-les en actions BeWork (tâche, agenda, fiche…)",
    ],
    icon: "FileSearch",
  },
  {
    id: "obligations-delais",
    family: "marches",
    title: "Obligations & délais",
    description:
      "Repérez automatiquement les engagements, échéances, documents attendus et validations.",
    capabilities: [
      "Lister obligations, responsables et échéances",
      "Relier chaque point à sa source documentaire",
      "Proposer des actions (tâche, agenda, À traiter, fiche de suivi)",
      "Toujours sous validation humaine avant création",
    ],
    sources: ["Pièces marché sélectionnées", "Planning / ordre de service si présent", "GED chantier"],
    workflow: [
      "Sélectionnez les pièces concernées",
      "Extraire obligations & délais",
      "Vérifiez le tableau (obligation · responsable · échéance · source)",
      "Validez les actions à créer dans BeWork",
    ],
    icon: "ListChecks",
  },
  {
    id: "risques-marche",
    family: "marches",
    title: "Risques du marché",
    description: "Faites ressortir les clauses qui demandent une attention particulière.",
    capabilities: [
      "Points à examiner : délais, pénalités, responsabilités, paiement",
      "Travaux supplémentaires, réception, réserves",
      "Documents contractuels à surveiller",
      "Aide à la décision — pas un avis juridique",
    ],
    sources: ["Contrat / marché privé", "Conditions particulières", "CCTP / annexes"],
    workflow: [
      "Sélectionnez les pièces à examiner",
      "Repérage des points sensibles",
      "Revue des catégories (délais, paiement, réception…)",
      "Partagez ou transformez en actions de suivi",
    ],
    icon: "ShieldAlert",
  },
  {
    id: "travaux-supplementaires",
    family: "marches",
    title: "Travaux supplémentaires & avenants",
    description:
      "Comparez les travaux demandés avec le périmètre initial et préparez les éléments justificatifs.",
    capabilities: [
      "Comparer demande / CR / devis au périmètre initial",
      "Repérer les éléments potentiellement hors marché",
      "Préparer justificatifs pour avenant ou courrier",
      "Validation utilisateur avant tout envoi ou création",
    ],
    sources: [
      "Marché / devis accepté initial",
      "Compte rendu, message ou demande client",
      "Devis complémentaires",
    ],
    workflow: [
      "Choisissez le marché de référence et la demande",
      "Comparaison périmètre vs demande",
      "Revue des écarts et justificatifs",
      "Préparez avenant / courrier (brouillon à valider)",
    ],
    icon: "GitCompare",
  },
  {
    id: "synthese-dossier",
    family: "chantier",
    title: "Synthétiser un dossier",
    description: "Obtenez l’essentiel d’un chantier avant démarrage ou avant une réunion.",
    capabilities: [
      "Objet des travaux et intervenants",
      "Contraintes, délais, documents importants",
      "Livraisons et points ouverts",
      "Prochaines actions suggérées",
    ],
    sources: ["Dossier chantier BeWork", "Documents GED sélectionnés", "Fiches de suivi / planning"],
    workflow: [
      "Choisissez le chantier et les documents",
      "Génération de la synthèse",
      "Vérifiez les points ouverts",
      "Partagez ou créez des actions",
    ],
    icon: "FolderOpen",
  },
  {
    id: "cr-vers-actions",
    family: "chantier",
    title: "Compte rendu → Actions",
    description: "Transformez un compte rendu en tâches, échéances et responsables.",
    capabilities: [
      "Extraire décisions et actions du CR",
      "Proposer tâche, agenda, À traiter, réserve, commande, avenant",
      "L’utilisateur valide chaque création",
      "Aucune création silencieuse",
    ],
    sources: ["Compte rendu (PDF / texte)", "Message ou note chantier", "Document GED"],
    workflow: [
      "Importez ou collez le compte rendu",
      "Propositions d’actions",
      "Cochez ce qui doit être créé",
      "Validez — BeWork enregistre uniquement le validé",
    ],
    icon: "ClipboardList",
  },
  {
    id: "controler-doe",
    family: "chantier",
    title: "Contrôler un DOE",
    description: "Vérifiez les pièces disponibles et identifiez ce qui manque avant transmission.",
    capabilities: [
      "Comparer GED et liste attendue",
      "Statuts : présent / manquant / à vérifier",
      "Relances ciblées avant transmission",
      "Traçabilité pour la réception / solde",
    ],
    sources: ["GED BeWork", "Liste DOE attendue", "Pièces classées du chantier"],
    workflow: [
      "Choisissez le chantier et la liste attendue",
      "Contrôle de présence",
      "Revue des manquants",
      "Relancez ou complétez avant envoi",
    ],
    icon: "PackageCheck",
  },
  {
    id: "rediger-courrier",
    family: "chantier",
    title: "Rédiger un courrier",
    description: "Préparez un brouillon professionnel à partir du contexte du chantier.",
    capabilities: [
      "Relance, demande de validation, travaux supplémentaires",
      "Réserve, demande de document, retard, réponse client",
      "Brouillon à vérifier avant envoi",
      "Jamais d’envoi automatique",
    ],
    sources: ["Contexte chantier sélectionné", "Documents liés", "Notes / CR"],
    workflow: [
      "Choisissez le type de courrier et le chantier",
      "Brouillon proposé",
      "Relisez et corrigez",
      "Copiez ou exportez — envoi manuel",
    ],
    icon: "PenLine",
  },
];

export function getAssistantIaTool(id: string): AssistantIaTool | undefined {
  return ASSISTANT_IA_TOOLS.find((t) => t.id === id);
}

export function toolsByFamily(family: AssistantIaFamily): AssistantIaTool[] {
  return ASSISTANT_IA_TOOLS.filter((t) => t.family === family);
}
