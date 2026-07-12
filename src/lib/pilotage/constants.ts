/** Constantes métier Pilotage travaux — libellés FR pour UI et validation. */

export const PILOTAGE_LIST_PATH = "/dashboard/pilotage-travaux";

export const PILOTAGE_STATUS_LABELS: Record<string, string> = {
  A_PREPARER: "À préparer",
  EN_COURS: "En cours",
  SOUS_SURVEILLANCE: "Sous surveillance",
  BLOQUE: "Bloqué",
  TERMINE: "Terminé",
  ARCHIVE: "Archivé",
};

export const PILOTAGE_STATUS_COLORS: Record<string, string> = {
  A_PREPARER: "bg-slate-100 text-slate-700 ring-slate-200",
  EN_COURS: "bg-blue-50 text-blue-800 ring-blue-200",
  SOUS_SURVEILLANCE: "bg-amber-50 text-amber-800 ring-amber-200",
  BLOQUE: "bg-red-50 text-red-800 ring-red-200",
  TERMINE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  ARCHIVE: "bg-slate-100 text-slate-500 ring-slate-200",
};

export const PRIORITY_COLORS: Record<string, string> = {
  Basse: "bg-slate-100 text-slate-600 ring-slate-200",
  Normale: "bg-blue-50 text-blue-700 ring-blue-200",
  Haute: "bg-amber-50 text-amber-800 ring-amber-200",
  Critique: "bg-red-50 text-red-800 ring-red-200",
};

export const SERVICE_LEVEL_LABELS: Record<string, string> = {
  ESSENTIEL: "Pilotage Essentiel",
  RENFORCE: "Pilotage Renforcé",
  COMPLET: "Pilotage Complet BeWork",
};

export const ACTION_STATUS_ACTIVE = [
  "À faire",
  "En cours",
  "En attente interne",
  "En attente client",
  "En attente maîtrise d’œuvre",
  "Bloquée",
] as const;

export const OBLIGATION_OPEN = ["À analyser", "À préparer", "En cours", "Envoyée", "En attente", "En retard"] as const;

export const DOC_MISSING_STATUSES = ["Manquant", "À préparer", "À corriger", "Expiré"] as const;

export const VISA_PENDING = ["Envoyé pour visa", "En attente de visa", "Observations reçues", "À corriger", "Renvoyé"] as const;

export const MARKET_DOC_TYPES = [
  "Acte d'engagement",
  "CCAP",
  "CCTP",
  "DPGF",
  "BPU",
  "DQE",
  "Plans",
  "Planning",
  "Mémoire technique",
  "Notification",
  "Ordre de service",
  "Avenant",
  "PPSPS",
  "Plan d'installation de chantier",
  "Fiche technique",
  "Autre",
] as const;

/** Navigation principale cockpit (prioritaire) */
export const DETAIL_PRIMARY_TABS = [
  { id: "vue", label: "Vue d’ensemble", icon: "overview" },
  { id: "a-traiter", label: "À traiter", icon: "inbox" },
  { id: "blocages", label: "Blocages", icon: "alert" },
  { id: "documents", label: "Documents", icon: "doc" },
  { id: "plans", label: "Plans et visas", icon: "plan" },
  { id: "calendrier", label: "Calendrier", icon: "calendar" },
  { id: "doe", label: "DOE", icon: "doe" },
] as const;

/** Menu Plus */
export const DETAIL_MORE_TABS = [
  { id: "pieces", label: "Pièces marché" },
  { id: "obligations", label: "Obligations" },
  { id: "actions", label: "Actions et relances" },
  { id: "jalons", label: "Jalons" },
  { id: "sous-traitants", label: "Sous-traitants" },
  { id: "situations", label: "Situations" },
  { id: "ts", label: "Travaux supplémentaires" },
  { id: "rapports", label: "Rapports" },
  { id: "historique", label: "Historique" },
] as const;

export const DETAIL_TABS = [
  { id: "vue", label: "Vue d’ensemble" },
  { id: "a-traiter", label: "À traiter" },
  { id: "blocages", label: "Blocages" },
  { id: "pieces", label: "Pièces marché" },
  { id: "obligations", label: "Obligations" },
  { id: "documents", label: "Documents à remettre" },
  { id: "actions", label: "Actions et relances" },
  { id: "plans", label: "Plans et visas" },
  { id: "calendrier", label: "Calendrier" },
  { id: "jalons", label: "Jalons" },
  { id: "sous-traitants", label: "Sous-traitants" },
  { id: "situations", label: "Situations" },
  { id: "ts", label: "Travaux supplémentaires" },
  { id: "doe", label: "DOE" },
  { id: "rapports", label: "Rapports" },
  { id: "historique", label: "Historique" },
] as const;

export type DetailTabId = (typeof DETAIL_TABS)[number]["id"];

export const DEFAULT_MILESTONES = [
  { title: "Notification du marché", category: "Administratif", sortOrder: 10 },
  { title: "Préparation / OS", category: "Administratif", sortOrder: 20 },
  { title: "Installation de chantier", category: "Sécurité", sortOrder: 30 },
  { title: "Études d’exécution", category: "Technique", sortOrder: 40 },
  { title: "Fondations", category: "Travaux", sortOrder: 50 },
  { title: "Gros œuvre", category: "Travaux", sortOrder: 60 },
  { title: "Hors d’eau", category: "Travaux", sortOrder: 70 },
  { title: "Réception", category: "Réception", sortOrder: 80 },
  { title: "DOE", category: "DOE", sortOrder: 90 },
  { title: "Levée de réserves / DGD", category: "Réception", sortOrder: 100 },
] as const;
