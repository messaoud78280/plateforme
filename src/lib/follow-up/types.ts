import type { FollowUpSheetStatus, FollowUpUrgency } from "@prisma/client";

export type UrgencyLevel = FollowUpUrgency;

export type UrgencyThresholds = {
  /** Échéance dans plus de N jours → NORMAL */
  normalMinDays: number;
  /** Échéance dans ≤ N jours → À SURVEILLER */
  watchMaxDays: number;
  /** Échéance dans ≤ N heures → IMPORTANT */
  importantMaxHours: number;
  /** Échéance dans ≤ N heures → URGENT */
  urgentMaxHours: number;
  /** Retard > N heures → CRITIQUE (sinon URGENT si dépassé) */
  criticalOverdueHours: number;
};

export const DEFAULT_URGENCY_THRESHOLDS: UrgencyThresholds = {
  normalMinDays: 5,
  watchMaxDays: 5,
  importantMaxHours: 48,
  urgentMaxHours: 24,
  criticalOverdueHours: 24,
};

export type AlertRuleId =
  | "os_sans_intervention"
  | "intervention_sans_commande"
  | "livraison_non_confirmee"
  | "avenant_sans_reponse"
  | "travaux_sans_facturation"
  | "facture_echeance"
  | "document_manquant"
  | "action_depassee"
  | "trop_de_reports";

export type AlertRuleConfig = {
  id: AlertRuleId;
  label: string;
  description: string;
  enabled: boolean;
  /** Délai en heures avant / après selon la règle */
  delayHours: number;
  urgency: UrgencyLevel;
  notifyAssignee: boolean;
  notifyOwner: boolean;
};

export const DEFAULT_ALERT_RULES: AlertRuleConfig[] = [
  {
    id: "os_sans_intervention",
    label: "OS / commande sans intervention",
    description: "OS reçu depuis X h sans date d’intervention → alerte",
    enabled: true,
    delayHours: 48,
    urgency: "IMPORTANT",
    notifyAssignee: true,
    notifyOwner: false,
  },
  {
    id: "intervention_sans_commande",
    label: "Intervention sans commande fournisseur",
    description: "Intervention dans X h sans commande enregistrée → alerte",
    enabled: true,
    delayHours: 48,
    urgency: "URGENT",
    notifyAssignee: true,
    notifyOwner: false,
  },
  {
    id: "livraison_non_confirmee",
    label: "Livraison non confirmée",
    description: "Livraison demain non confirmée → alerte",
    enabled: true,
    delayHours: 24,
    urgency: "URGENT",
    notifyAssignee: true,
    notifyOwner: false,
  },
  {
    id: "avenant_sans_reponse",
    label: "Avenant sans réponse",
    description: "Avenant envoyé depuis X jours sans réponse → rappel",
    enabled: true,
    delayHours: 168,
    urgency: "IMPORTANT",
    notifyAssignee: true,
    notifyOwner: false,
  },
  {
    id: "travaux_sans_facturation",
    label: "Travaux terminés non facturés",
    description: "Travaux terminés depuis X jours sans facturation → alerte",
    enabled: true,
    delayHours: 48,
    urgency: "IMPORTANT",
    notifyAssignee: true,
    notifyOwner: true,
  },
  {
    id: "facture_echeance",
    label: "Facture à échéance",
    description: "Facture arrivée à échéance non réglée → alerte / relance",
    enabled: true,
    delayHours: 0,
    urgency: "URGENT",
    notifyAssignee: true,
    notifyOwner: true,
  },
  {
    id: "document_manquant",
    label: "Document obligatoire manquant",
    description: "Document attendu non reçu → alerte",
    enabled: true,
    delayHours: 24,
    urgency: "IMPORTANT",
    notifyAssignee: true,
    notifyOwner: false,
  },
  {
    id: "trop_de_reports",
    label: "Trop de reports",
    description: "Action reportée X fois ou plus → alerte dirigeant",
    enabled: true,
    delayHours: 3,
    urgency: "IMPORTANT",
    notifyAssignee: true,
    notifyOwner: true,
  },
  {
    id: "action_depassee",
    label: "Action dépassée",
    description: "Prochaine action non réalisée après échéance → alerte",
    enabled: true,
    delayHours: 0,
    urgency: "URGENT",
    notifyAssignee: true,
    notifyOwner: false,
  },
];

export type EscalateConfig = {
  /** Heures de retard avant escalation au propriétaire / dirigeant */
  escalateToOwnerAfterHours: number;
  /** Heures de retard avant notification managers BeWork (si applicable) */
  escalateCriticalAfterHours: number;
  notifyOwnerOnUrgent: boolean;
  notifyOwnerOnCritical: boolean;
};

export const DEFAULT_ESCALATE: EscalateConfig = {
  escalateToOwnerAfterHours: 24,
  escalateCriticalAfterHours: 48,
  notifyOwnerOnUrgent: true,
  notifyOwnerOnCritical: true,
};

/** Rappels multiples par défaut (heures avant échéance) */
export const DEFAULT_REMINDER_OFFSETS_HOURS = [168, 72, 24, 2];

export const STATUS_LABELS: Record<FollowUpSheetStatus, string> = {
  NOUVEAU: "Nouveau",
  A_ANALYSER: "À analyser",
  A_PLANIFIER: "À planifier",
  PLANIFIE: "Planifié",
  COMMANDE_FOURNISSEUR: "Commande fournisseur à passer",
  COMMANDE_PASSEE: "Commande passée",
  ATTENTE_FOURNISSEUR: "En attente fournisseur",
  INTERVENTION_PREVUE: "Intervention prévue",
  EN_COURS: "En cours",
  TRAVAUX_TERMINES: "Travaux terminés",
  CR_A_RECUPERER: "Compte rendu à récupérer",
  AVENANT: "Avenant",
  A_FACTURER: "À facturer",
  FACTURE: "Facturé",
  ATTENTE_REGLEMENT: "En attente règlement",
  TERMINE: "Terminé",
  ARCHIVE: "Archivé",
};

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  NORMAL: "Normal",
  A_SURVEILLER: "À surveiller",
  IMPORTANT: "Important",
  URGENT: "Urgent",
  CRITIQUE: "Critique",
};

/** Couleurs post-it (statut métier) — toujours accompagner d’un libellé texte */
export const POSTIT_COLORS: Record<
  string,
  { bg: string; border: string; label: string; text: string }
> = {
  bleu: {
    bg: "bg-sky-50",
    border: "border-sky-300",
    text: "text-sky-950",
    label: "Nouvelle commande / OS",
  },
  jaune: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-950",
    label: "À traiter / à planifier",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-300",
    text: "text-orange-950",
    label: "Intervention / commande / attente",
  },
  violet: {
    bg: "bg-violet-50",
    border: "border-violet-300",
    text: "text-violet-950",
    label: "Avenant / validation",
  },
  vert: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-950",
    label: "Réalisé / à facturer / terminé",
  },
  rouge: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-950",
    label: "Retard / anomalie / urgence",
  },
};

export const URGENCY_STYLES: Record<
  UrgencyLevel,
  { dot: string; badge: string; border: string; bar: string }
> = {
  NORMAL: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-900",
    border: "border-emerald-200",
    bar: "border-l-emerald-500",
  },
  A_SURVEILLER: {
    dot: "bg-yellow-400",
    badge: "bg-yellow-100 text-yellow-900",
    border: "border-yellow-200",
    bar: "border-l-yellow-400",
  },
  IMPORTANT: {
    dot: "bg-orange-500",
    badge: "bg-orange-100 text-orange-900",
    border: "border-orange-200",
    bar: "border-l-orange-500",
  },
  URGENT: {
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-900",
    border: "border-red-200",
    bar: "border-l-red-500",
  },
  CRITIQUE: {
    dot: "bg-red-900",
    badge: "bg-red-950 text-white",
    border: "border-red-900",
    bar: "border-l-red-900",
  },
};

export function colorKeyForStatus(status: FollowUpSheetStatus): string {
  switch (status) {
    case "NOUVEAU":
    case "A_ANALYSER":
      return "bleu";
    case "A_PLANIFIER":
    case "PLANIFIE":
      return "jaune";
    case "COMMANDE_FOURNISSEUR":
    case "COMMANDE_PASSEE":
    case "ATTENTE_FOURNISSEUR":
    case "INTERVENTION_PREVUE":
    case "EN_COURS":
      return "orange";
    case "AVENANT":
      return "violet";
    case "TRAVAUX_TERMINES":
    case "CR_A_RECUPERER":
    case "A_FACTURER":
    case "FACTURE":
    case "ATTENTE_REGLEMENT":
    case "TERMINE":
      return "vert";
    case "ARCHIVE":
      return "vert";
    default:
      return "jaune";
  }
}

/** Suggestions de prochaine action après « Marquer comme fait » */
export const NEXT_ACTION_SUGGESTIONS: Record<
  string,
  { label: string; nextStatus?: FollowUpSheetStatus; dueInDays: number }[]
> = {
  NOUVEAU: [
    { label: "Analyser le dossier / OS", dueInDays: 1 },
    { label: "Programmer l’intervention", nextStatus: "A_PLANIFIER", dueInDays: 2 },
  ],
  A_ANALYSER: [
    { label: "Programmer l’intervention", nextStatus: "A_PLANIFIER", dueInDays: 2 },
  ],
  A_PLANIFIER: [
    { label: "Confirmer la date d’intervention", nextStatus: "PLANIFIE", dueInDays: 1 },
    { label: "Passer la commande fournisseur", nextStatus: "COMMANDE_FOURNISSEUR", dueInDays: 1 },
  ],
  PLANIFIE: [
    { label: "Passer la commande fournisseur", nextStatus: "COMMANDE_FOURNISSEUR", dueInDays: 1 },
    { label: "Préparer l’intervention", nextStatus: "INTERVENTION_PREVUE", dueInDays: 1 },
  ],
  COMMANDE_FOURNISSEUR: [
    { label: "Confirmer la commande fournisseur", nextStatus: "COMMANDE_PASSEE", dueInDays: 1 },
  ],
  COMMANDE_PASSEE: [
    { label: "Suivre livraison fournisseur", nextStatus: "ATTENTE_FOURNISSEUR", dueInDays: 2 },
  ],
  ATTENTE_FOURNISSEUR: [
    { label: "Préparer l’intervention", nextStatus: "INTERVENTION_PREVUE", dueInDays: 1 },
  ],
  INTERVENTION_PREVUE: [
    { label: "Réaliser l’intervention", nextStatus: "EN_COURS", dueInDays: 0 },
    { label: "Récupérer le compte rendu", nextStatus: "CR_A_RECUPERER", dueInDays: 1 },
  ],
  EN_COURS: [
    { label: "Clôturer les travaux", nextStatus: "TRAVAUX_TERMINES", dueInDays: 0 },
  ],
  TRAVAUX_TERMINES: [
    { label: "Récupérer le compte rendu", nextStatus: "CR_A_RECUPERER", dueInDays: 1 },
    { label: "Préparer la facturation", nextStatus: "A_FACTURER", dueInDays: 2 },
  ],
  CR_A_RECUPERER: [
    { label: "Préparer la facturation", nextStatus: "A_FACTURER", dueInDays: 2 },
  ],
  AVENANT: [
    { label: "Relancer validation client", dueInDays: 3 },
  ],
  A_FACTURER: [
    { label: "Émettre la facture", nextStatus: "FACTURE", dueInDays: 2 },
  ],
  FACTURE: [
    { label: "Suivre le règlement", nextStatus: "ATTENTE_REGLEMENT", dueInDays: 30 },
  ],
  ATTENTE_REGLEMENT: [
    { label: "Clôturer le dossier", nextStatus: "TERMINE", dueInDays: 7 },
  ],
};

export const QUICK_STATUS_TRANSITIONS: { status: FollowUpSheetStatus; label: string }[] = [
  { status: "COMMANDE_PASSEE", label: "Commande passée" },
  { status: "EN_COURS", label: "En cours" },
  { status: "TRAVAUX_TERMINES", label: "Travaux terminés" },
  { status: "A_FACTURER", label: "À facturer" },
];

