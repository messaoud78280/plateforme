/**
 * Vocabulaire UX BeWork — libellés communs (français clair, BTP).
 * Une action = un verbe. Ne pas inventer de synonymes parallèles.
 */

export const UX_ACTIONS = {
  create: "Créer",
  add: "Ajouter",
  edit: "Modifier",
  save: "Enregistrer",
  cancel: "Annuler",
  close: "Fermer",
  open: "Ouvrir",
  view: "Voir",
  search: "Rechercher",
  filter: "Filtrer",
  resetFilters: "Réinitialiser les filtres",
  send: "Envoyer",
  share: "Partager",
  download: "Télécharger",
  upload: "Déposer",
  validate: "Valider",
  approve: "Approuver",
  refuse: "Refuser",
  archive: "Archiver",
  delete: "Supprimer",
  revoke: "Révoquer",
  duplicate: "Dupliquer",
  assign: "Assigner",
  relaunch: "Relancer",
  confirm: "Confirmer",
} as const;

/** Distinctions obligatoires — ne pas confondre dans l’UI. */
export const UX_ACTION_DISTINCTIONS = {
  archive: "Retirer de la vue active sans effacer. Récupérable.",
  delete: "Suppression définitive. Action irréversible.",
  send: "Transmission à un destinataire (message, email, export).",
  share: "Donner un accès ou un lien à un tiers.",
  validate: "Confirmer un contenu métier sous responsabilité humaine.",
} as const;

export const UX_STATUS = {
  toDo: "À faire",
  pending: "En attente",
  toCheck: "À vérifier",
  toValidate: "À valider",
  validated: "Validé",
  blocking: "Bloquant",
  urgent: "Urgent",
  relaunched: "Relancé",
  received: "Reçu",
  missing: "Manquant",
  compliant: "Conforme",
  toClarify: "À préciser",
  toReformulate: "À reformuler",
  riskDetected: "Risque détecté",
  obsolete: "Obsolète",
  confidential: "Confidentiel",
  draft: "Brouillon",
  inForce: "En vigueur",
} as const;

export const UX_EMPTY = {
  generic: {
    title: "Aucun élément pour le moment",
    description: "Dès qu’une donnée est enregistrée, elle apparaît ici.",
  },
  search: {
    title: "Aucun résultat",
    description: "Modifiez la recherche ou réinitialisez les filtres.",
  },
  clients: {
    title: "Aucun client",
    description: "Créez un compte entreprise pour démarrer le suivi.",
  },
  projects: {
    title: "Aucun chantier",
    description: "Créez un dossier chantier pour classer devis, plans et DOE.",
  },
  missions: {
    title: "Aucune mission",
    description: "Créez une mission pour cadrer le besoin et l’échéance.",
  },
  documents: {
    title: "Aucun document",
    description: "Déposez un fichier (PDF, image, Office) pour le classer.",
  },
} as const;

export const UX_ERRORS = {
  generic: "Une erreur est survenue. Réessayez ou contactez BeWork.",
  network: "Connexion interrompue. Vérifiez le réseau puis réessayez.",
  forbidden: "Vous n’avez pas l’autorisation pour cette action.",
  notFound: "Élément introuvable ou déjà retiré.",
  validation: "Complétez les champs obligatoires avant d’enregistrer.",
  irreversible: "Cette action est définitive. Vérifiez avant de confirmer.",
} as const;

export const UX_WARNINGS = {
  demoData: "Démonstration — données fictives",
  testEnv: "Environnement de test",
  unsaved: "Modifications non enregistrées",
  confidential: "Document confidentiel",
  obsoleteDoc: "Document obsolète — ne pas utiliser pour exécution",
  externalShare: "Partage externe — vérifier les destinataires",
  irreversible: "Action irréversible",
} as const;

export const UX_CONFIRM = {
  delete: "Supprimer définitivement ? Cette action ne peut pas être annulée.",
  archive: "Archiver cet élément ? Il disparaîtra de la vue active.",
  revoke: "Révoquer l’accès ? Les destinataires ne pourront plus ouvrir le lien.",
  leaveUnsaved: "Quitter sans enregistrer ? Les modifications seront perdues.",
} as const;

/** Verbes interdits / à éviter (jargon informatique). */
export const UX_AVOID_TERMS = [
  "submit",
  "payload",
  "endpoint",
  "token",
  "render",
  "fetch",
  "sync",
  "trigger",
  "workflow",
  "pipeline",
] as const;
