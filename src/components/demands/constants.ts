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
  { value: "STANDARD", label: "Normal" },
  { value: "PRIORITAIRE", label: "Prioritaire" },
  { value: "URGENT", label: "Urgent" },
] as const;

/** Options pour l'estimateur de crédits (sélecteur utilisateur) */
export const DEMANDE_ESTIMATION_OPTIONS = [
  { value: "1 crédit", label: "1 crédit" },
  { value: "2 à 3 crédits", label: "2 à 3 crédits" },
  { value: "À évaluer", label: "À évaluer" },
] as const;

export const EXEMPLES_DEMANDES = [
  "Réserver un hôtel à Lyon pour 2 nuits du 12 au 14 avril",
  "Rédiger un email professionnel de relance client",
  "Trouver 3 prestataires de nettoyage de bureaux à Paris",
];

/** Suggestions de missions communication (packs communication digitale) */

/** Suggestions de missions (accès rapide) */
export const MISSION_SUGGESTIONS = [
  { id: "devis", title: "Préparer un devis", description: "Client : [nom] — Prestation : [détails] — Délai souhaité : [date]", category: "Facturation / devis" },
  { id: "relance", title: "Relancer des factures", description: "Facture n° [numéro] — Client : [nom] — Échéance : [date] — Relance par email puis téléphone si besoin", category: "Facturation / devis" },
  { id: "fournisseur", title: "Rechercher un fournisseur", description: "Secteur : [activité] — Zone : [ville/région] — Critères : [budget, délais, références]", category: "Recherche" },
  { id: "classement", title: "Classer des documents", description: "Type de documents : [factures / contrats / RH] — Organisation souhaitée : [chronologique / par client / par thème]", category: "Documents" },
  { id: "deplacement", title: "Organiser un déplacement", description: "Destination : [ville] — Dates : [aller / retour] — Transport et hébergement à organiser", category: "Organisation" },
  { id: "tableau-suivi", title: "Créer un tableau de suivi", description: "Objet du suivi : [factures / projets / clients] — Période : [dates] — Informations à suivre : [montant, statut, responsable…]", category: "Administratif" },
] as const;

/** Modèles de demandes pour le guidage et la première demande */
export const DEMANDE_TEMPLATES = [
  {
    id: "devis",
    title: "Préparer un devis",
    category: "Facturation / devis",
    description: "Client : [nom] — Prestation : [détails] — Délai souhaité : [date]",
  },
  {
    id: "relance-facture",
    title: "Relancer une facture",
    category: "Facturation / devis",
    description: "Facture n° [numéro] — Client : [nom] — Échéance : [date] — Relance par email puis téléphone si besoin",
  },
  {
    id: "rdv",
    title: "Organiser un rendez-vous",
    category: "Organisation",
    description: "Type : [réunion / visite / téléphonique] — Participants : [noms] — Créneaux préférés : [dates/heures]",
  },
  {
    id: "fournisseur",
    title: "Rechercher un fournisseur",
    category: "Recherche",
    description: "Secteur : [activité] — Zone géographique : [ville/région] — Critères : [budget, délais, références]",
  },
  {
    id: "deplacement",
    title: "Organisation d'un déplacement",
    category: "Organisation",
    description: "Destination : [ville] — Dates : [aller-retour] — Hébergement et transport à réserver",
  },
] as const;
