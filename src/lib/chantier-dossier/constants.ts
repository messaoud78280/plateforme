import type { ChantierFileStatus, ChantierStatus } from "@prisma/client";

/** Rubriques créées automatiquement à l'ouverture d'un chantier. */
export const DEFAULT_CHANTIER_FOLDERS: { code: string; label: string; sortOrder: number }[] = [
  { code: "01", label: "Devis & avenants", sortOrder: 1 },
  { code: "02", label: "Contrats / commandes client", sortOrder: 2 },
  { code: "03", label: "Plans & pièces techniques", sortOrder: 3 },
  { code: "04", label: "Sous-traitants", sortOrder: 4 },
  { code: "05", label: "Fournisseurs / commandes / BL", sortOrder: 5 },
  { code: "06", label: "Comptes rendus chantier", sortOrder: 6 },
  { code: "07", label: "Photos chantier", sortOrder: 7 },
  { code: "08", label: "Planning", sortOrder: 8 },
  { code: "09", label: "Facturation / situations / paiements", sortOrder: 9 },
  { code: "10", label: "Réserves / réception", sortOrder: 10 },
  { code: "11", label: "DOE / fin de chantier", sortOrder: 11 },
];

export const CHANTIER_STATUS_LABELS: Record<ChantierStatus, string> = {
  ETUDE: "Étude",
  EN_COURS: "En cours",
  EN_ATTENTE: "En attente",
  RECEPTION: "Réception",
  TERMINE: "Terminé",
};

export const CHANTIER_STATUS_COLORS: Record<ChantierStatus, string> = {
  ETUDE: "bg-violet-100 text-violet-900",
  EN_COURS: "bg-blue-100 text-blue-900",
  EN_ATTENTE: "bg-amber-100 text-amber-900",
  RECEPTION: "bg-teal-100 text-teal-900",
  TERMINE: "bg-green-100 text-green-900",
};

export const CHANTIER_FILE_STATUS_LABELS: Record<ChantierFileStatus, string> = {
  RECU: "Reçu",
  A_VERIFIER: "À vérifier",
  VALIDE: "Validé",
  MANQUANT: "Manquant",
  A_RELANCER: "À relancer",
};

export const CHANTIER_FILE_STATUS_COLORS: Record<ChantierFileStatus, string> = {
  RECU: "bg-slate-100 text-slate-800",
  A_VERIFIER: "bg-amber-100 text-amber-900",
  VALIDE: "bg-green-100 text-green-900",
  MANQUANT: "bg-red-100 text-red-900",
  A_RELANCER: "bg-orange-100 text-orange-900",
};

/** Statuts affichés dans la vue « pièces manquantes ». */
export const CHANTIER_MISSING_STATUSES: ChantierFileStatus[] = ["MANQUANT", "A_RELANCER"];
