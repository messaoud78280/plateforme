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

export const ACTION_STATUS_ACTIVE = ["À faire", "En cours", "En attente interne", "En attente client", "En attente maîtrise d’œuvre", "Bloquée"] as const;

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

export const DETAIL_TABS = [
  { id: "vue", label: "Vue d’ensemble" },
  { id: "pieces", label: "Pièces marché" },
  { id: "obligations", label: "Obligations" },
  { id: "documents", label: "Documents à remettre" },
  { id: "actions", label: "Actions et relances" },
  { id: "plans", label: "Plans et visas" },
  { id: "sous-traitants", label: "Sous-traitants" },
  { id: "situations", label: "Situations" },
  { id: "ts", label: "Travaux supplémentaires" },
  { id: "doe", label: "DOE" },
  { id: "rapports", label: "Rapports" },
  { id: "historique", label: "Historique" },
] as const;

export type DetailTabId = (typeof DETAIL_TABS)[number]["id"];
