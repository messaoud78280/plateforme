export const DEMANDE_CATEGORIES = [
  { value: "Administratif", label: "Administratif" },
  { value: "Facturation / devis", label: "Facturation / devis" },
  { value: "Recherche", label: "Recherche" },
  { value: "Documents", label: "Documents" },
  { value: "Réservation", label: "Réservation" },
  { value: "Organisation", label: "Organisation" },
  { value: "Marketing / contenu", label: "Marketing / contenu" },
  { value: "Autre", label: "Autre" },
] as const;

export const DEMANDE_PRIORITIES = [
  { value: "STANDARD", label: "Normale" },
  { value: "PRIORITAIRE", label: "Prioritaire" },
  { value: "URGENT", label: "Urgente" },
] as const;

/** Options pour l'estimateur d'actions (sélecteur utilisateur) */
export const DEMANDE_ESTIMATION_OPTIONS = [
  { value: "1 action", label: "1 action" },
  { value: "2 à 3 actions", label: "2 à 3 actions" },
  { value: "À évaluer", label: "À évaluer" },
] as const;

export const EXEMPLES_DEMANDES = [
  "Réserver un hôtel à Lyon pour 2 nuits du 12 au 14 avril",
  "Rédiger un email professionnel de relance client",
  "Trouver 3 prestataires de nettoyage de bureaux à Paris",
];
