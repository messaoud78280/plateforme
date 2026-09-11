/** Données programme formation — source unique pour le panneau dynamique. */

export type ProgramStep = {
  id: string;
  time: string;
  module: string;
  title: string;
  subtitle: string;
  actions: readonly string[];
  tools: readonly string[];
  result: string;
  /** Variantes de rendu (pause, climax, conclusion). */
  variant?: "default" | "pause" | "idea" | "close";
  morningTrack?: readonly string[];
  afternoonTrack?: readonly string[];
  ideaQuestions?: readonly { label: string; text: string }[];
  ideaFlow?: readonly string[];
  closingArc?: { from: string; to: string; note: string };
  badge?: string;
};

export const PROGRAM_STEPS: readonly ProgramStep[] = [
  {
    id: "decouvrir",
    time: "09:00",
    module: "01",
    title: "Découvrir",
    subtitle:
      "Comprendre ce qu’il est aujourd’hui possible de créer avec l’IA, sans jargon technique.",
    actions: [
      "Voir des réalisations concrètes",
      "Comprendre le rôle de l’IA dans le développement",
      "Voir ce qu’un non-développeur peut construire",
      "Identifier les limites à connaître",
    ],
    tools: ["Idée", "IA", "Interface", "Résultat"],
    result: "Une vision claire de ce que l’IA change réellement.",
    badge: "En découverte",
  },
  {
    id: "comprendre",
    time: "09:45",
    module: "02",
    title: "Comprendre",
    subtitle:
      "Comprendre les briques essentielles d’un projet web avant de commencer à construire.",
    actions: [
      "Comprendre ce qu’est une page",
      "Comprendre la différence entre interface et logique",
      "Voir comment un projet est organisé",
      "Comprendre ce que fait l’IA lorsqu’elle génère du code",
    ],
    tools: ["Pages", "Composants", "Données", "Navigation"],
    result: "Vous saurez vous repérer dans un projet sans devoir devenir développeur.",
    badge: "En méthode",
  },
  {
    id: "preparer",
    time: "10:15",
    module: "03",
    title: "Préparer",
    subtitle: "Installer et préparer ensemble l’environnement utilisé pendant la journée.",
    actions: [
      "Installer les outils nécessaires",
      "Ouvrir votre premier projet",
      "Connecter les services utiles",
      "Vérifier que l’environnement fonctionne",
    ],
    tools: ["Navigateur", "Éditeur de code", "Projet", "IA et services"],
    result: "Votre environnement sera prêt pour commencer à construire.",
    badge: "En pratique",
  },
  {
    id: "premiere-creation",
    time: "10:45",
    module: "04",
    title: "Première création",
    subtitle: "Passer d’une simple idée à une première interface visible.",
    actions: [
      "Décrire ce que vous voulez obtenir",
      "Transformer votre idée en instructions",
      "Générer une première interface",
      "Observer ce que l’IA a créé",
    ],
    tools: ["Idée", "Demande", "Génération", "Aperçu"],
    result: "Vous aurez créé votre première version fonctionnelle.",
    badge: "En création",
  },
  {
    id: "modifier",
    time: "11:30",
    module: "05",
    title: "Modifier",
    subtitle: "Faire évoluer une création existante sans repartir de zéro.",
    actions: [
      "Modifier un texte",
      "Changer une mise en page",
      "Ajouter ou retirer un élément",
      "Demander une amélioration précise",
    ],
    tools: ["Sélectionner", "Demander", "Comparer", "Valider"],
    result: "Vous saurez faire évoluer une première version.",
    badge: "En itération",
  },
  {
    id: "pause",
    time: "12:30",
    module: "06",
    title: "Pause",
    subtitle: "Faire une vraie coupure et prendre du recul avant l’après-midi.",
    actions: [
      "Échanger avec le groupe",
      "Revenir sur les points importants",
      "Comparer les premières réalisations",
      "Préparer la suite",
    ],
    tools: [],
    result: "Vous repartez avec une vision plus claire avant la suite.",
    variant: "pause",
    badge: "Pause",
    morningTrack: ["Comprendre", "Préparer", "Créer", "Modifier"],
    afternoonTrack: ["Construire", "Tester", "Corriger", "Aller plus loin"],
  },
  {
    id: "construire",
    time: "13:30",
    module: "07",
    title: "Construire plus loin",
    subtitle:
      "Passer d’une interface simple à quelque chose qui commence réellement à fonctionner.",
    actions: [
      "Ajouter une fonctionnalité",
      "Faire circuler des informations",
      "Construire plusieurs écrans",
      "Organiser progressivement le projet",
    ],
    tools: ["Interface", "Actions", "Données", "Navigation"],
    result: "Votre projet commencera réellement à fonctionner.",
    badge: "En construction",
  },
  {
    id: "comprendre-construction",
    time: "14:30",
    module: "08",
    title: "Comprendre ce que l’on construit",
    subtitle: "Ne pas laisser l’IA travailler dans une boîte noire.",
    actions: [
      "Lire les grandes parties du projet",
      "Repérer les éléments importants",
      "Comprendre les impacts d’une modification",
      "Apprendre à poser les bonnes questions",
    ],
    tools: ["Structure", "Fichiers", "Composants", "Logique"],
    result: "Vous comprendrez mieux ce que l’IA construit pour vous.",
    badge: "En lecture",
  },
  {
    id: "tester",
    time: "15:15",
    module: "09",
    title: "Tester & corriger",
    subtitle: "Apprendre à avancer lorsqu’un problème apparaît.",
    actions: [
      "Repérer un problème",
      "Décrire précisément ce qui ne fonctionne pas",
      "Demander une correction",
      "Tester la nouvelle version",
      "Comparer avant / après",
    ],
    tools: ["Erreur", "Diagnostic", "Correction", "Validation"],
    result: "Vous saurez utiliser l’IA pour résoudre un problème.",
    badge: "En correction",
  },
  {
    id: "votre-idee",
    time: "16:00",
    module: "10",
    title: "Votre idée",
    subtitle: "Maintenant, nous commençons à réfléchir à votre propre projet.",
    actions: [],
    tools: [],
    result: "Vous repartez avec une première vision structurée de votre propre projet.",
    variant: "idea",
    badge: "À vous",
    ideaQuestions: [
      {
        label: "Quel problème ?",
        text: "Que voulez-vous améliorer, automatiser ou créer ?",
      },
      {
        label: "Pour qui ?",
        text: "Qui utilisera votre solution ?",
      },
      {
        label: "Quelles fonctions ?",
        text: "Que doit-elle permettre de faire ?",
      },
      {
        label: "Quelle première version ?",
        text: "Quelle version simple pourrait déjà être utile ?",
      },
    ],
    ideaFlow: ["Une idée", "Un besoin clair", "Quelques fonctions", "Une première version"],
  },
  {
    id: "continuer",
    time: "16:40",
    module: "11",
    title: "Continuer après la journée",
    subtitle:
      "L’objectif n’est pas de tout apprendre en une journée, mais de savoir continuer.",
    actions: [
      "Reprendre votre projet seul",
      "Continuer à dialoguer efficacement avec l’IA",
      "Trouver une ressource",
      "Identifier ce qu’il faut apprendre ensuite",
      "Éviter de rester bloqué",
    ],
    tools: ["Observer", "Demander", "Tester", "Progresser"],
    result: "Vous aurez une méthode pour continuer à apprendre.",
    badge: "Autonomie",
  },
  {
    id: "conclusion",
    time: "17:00",
    module: "12",
    title: "Échanges / conclusion",
    subtitle: "Faire le point sur la journée et préparer la suite.",
    actions: [
      "Questions / réponses",
      "Retour sur les réalisations",
      "Points à approfondir",
      "Prochaines étapes",
    ],
    tools: [],
    result: "Vous repartez en sachant comment avancer.",
    variant: "close",
    badge: "Conclusion",
    closingArc: {
      from: "09:00 — Une idée",
      to: "17:00 — Une méthode pour commencer",
      note: "Vous ne repartez pas en sachant tout. Vous repartez en sachant comment avancer.",
    },
  },
] as const;
