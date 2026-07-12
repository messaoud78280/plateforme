/** Bibliothèques méthode BeWork — risques, questions, formation (recommandations à valider). */

export const TRADE_RISK_LIBRARY = [
  {
    lot: "Gros œuvre",
    title: "Plan non visé avant exécution",
    description: "Exécution sur un plan sans visa expose à reprise et litige.",
    prevention: "Bloquer le jalon tant que le visa n’est pas enregistré.",
    severity: "Critique",
  },
  {
    lot: "Gros œuvre",
    title: "Réservations oubliées avant coulage",
    description: "Réservations non confirmées avant fermeture de l’ouvrage.",
    prevention: "Checklist réservations J-2 avant coulage.",
    severity: "Critique",
  },
  {
    lot: "Gros œuvre",
    title: "Béton / fiche technique non validée",
    description: "Classe, exposition ou consistance non alignées avec le CCTP.",
    prevention: "Contrôle documentaire avant commande.",
    severity: "Élevé",
  },
  {
    lot: "Gros œuvre",
    title: "Ouvrage caché non photographié",
    description: "Preuve visuelle absente avant enfouissement.",
    prevention: "Photo obligatoire liée à l’ouvrage sensible.",
    severity: "Élevé",
  },
  {
    lot: "Gros œuvre",
    title: "Travaux supplémentaires non formalisés",
    description: "Instruction orale ou démarrage sans validation écrite.",
    prevention: "Interdire le démarrage sans trace écrite.",
    severity: "Critique",
  },
  {
    lot: "Électricité CFO/CFA",
    title: "Interface fourreaux / réservations GO",
    description: "Passages non coordonnés avec le gros œuvre.",
    prevention: "Matrice d’interfaces GO / électricité.",
    severity: "Élevé",
  },
] as const;

export const CONTEXTUAL_QUESTIONS = [
  { id: "q1", context: "document", text: "Qui valide ce document ?" },
  { id: "q2", context: "plan", text: "Quelle version / indice est en vigueur ?" },
  { id: "q3", context: "prestation", text: "Cette prestation est-elle incluse au marché ?" },
  { id: "q4", context: "instruction", text: "Existe-t-il une instruction écrite ?" },
  { id: "q5", context: "interface", text: "Qui fournit et qui pose cet élément ?" },
  { id: "q6", context: "echeance", text: "Quelle est la date limite et sa source ?" },
  { id: "q7", context: "preuve", text: "Quel document sert de preuve ?" },
  { id: "q8", context: "decision", text: "Quel est l’impact si la décision tarde ?" },
  { id: "q9", context: "ts", text: "Le devis est-il accepté par écrit ?" },
  { id: "q10", context: "st", text: "Le sous-traitant est-il agréé et dossier complet ?" },
  { id: "q11", context: "doe", text: "Le DOE contient-il déjà cette pièce ?" },
] as const;

export const TRAINING_NOTIONS = [
  {
    id: "visa",
    title: "Visa",
    definition: "Avis formalisé d’un intervenant (souvent BE/MOE) sur un document d’exécution.",
    utility: "Sécuriser la version exécutable avant intervention.",
    frequentError: "Exécuter sur un indice A alors que B est en circulation.",
    vigilance: "Tracer envoi, observations, visa et indice.",
  },
  {
    id: "os",
    title: "Ordre de service (OS)",
    definition: "Instruction écrite du pouvoir adjudicateur / MOE pour démarrer ou modifier une prestation.",
    utility: "Point de départ de délais et d’engagements.",
    frequentError: "Traiter un OS oral comme acquis.",
    vigilance: "Conserver l’OS et vérifier le délai de réponse.",
  },
  {
    id: "ts",
    title: "Travaux supplémentaires",
    definition: "Prestation hors offre initiale, à formaliser avant exécution.",
    utility: "Éviter les litiges de paiement et de périmètre.",
    frequentError: "Démarrer sans validation écrite.",
    vigilance: "Devis, validation, preuve, suivi financier administratif.",
  },
  {
    id: "doe",
    title: "DOE",
    definition: "Dossier des ouvrages exécutés — mémoire technique de l’ouvrage réalisé.",
    utility: "Réception, maintenance, responsabilité.",
    frequentError: "Constituer le DOE uniquement en fin de chantier.",
    vigilance: "Avancer pièce par pièce dès le démarrage.",
  },
  {
    id: "jalon",
    title: "Jalon",
    definition: "Point d’étape du marché (administratif ou travaux) avec prérequis.",
    utility: "Lier documents, validations et avancement.",
    frequentError: "Marquer un jalon atteint alors qu’un prérequis est bloqué.",
    vigilance: "Vérifier la chronologie et les preuves.",
  },
] as const;

export const HANDOVER_CHECKLIST_DEFAULT = [
  { title: "Offre remise et mémoire technique", category: "Offre" },
  { title: "Hypothèses de chiffrage", category: "Chiffrage" },
  { title: "Variantes retenues / exclues", category: "Négociation" },
  { title: "Prestations non comprises / limites", category: "Périmètre" },
  { title: "Points à risque et incohérences", category: "Risques" },
  { title: "Questions sans réponse", category: "Risques" },
  { title: "Engagements et réserves formulées", category: "Contractuel" },
  { title: "Calendrier contractuel", category: "Planning" },
  { title: "Documents définitifs du marché", category: "Documents" },
  { title: "Sous-traitants envisagés", category: "Organisation" },
] as const;
