export const DEMANDE_CATEGORIES = [
  { value: "Gestion d'emails", label: "Gestion d'emails" },
  { value: "Recherche d'informations", label: "Recherche d'informations" },
  { value: "Organisation / agenda", label: "Organisation / agenda" },
  { value: "Réservation", label: "Réservation" },
  { value: "Rédaction", label: "Rédaction" },
  { value: "Mise en forme", label: "Mise en forme" },
  { value: "Suivi administratif", label: "Suivi administratif" },
  { value: "Autre", label: "Autre" },
] as const;

export const DEMANDE_PRIORITIES = [
  { value: "STANDARD", label: "Standard" },
  { value: "PRIORITAIRE", label: "Prioritaire" },
  { value: "URGENT", label: "Urgent" },
] as const;

export const EXEMPLES_DEMANDES = [
  "Réserver un hôtel à Lyon pour 2 nuits du 12 au 14 avril",
  "Rédiger un email professionnel de relance client",
  "Trouver 3 prestataires de nettoyage de bureaux à Paris",
];
