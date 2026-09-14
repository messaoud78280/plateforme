/** Programme public BeWork — contenu pédagogique sans recette technique propriétaire. */

export type ProgramStepVariant = "default" | "pause" | "project" | "close";

export type ProgramStep = {
  id: string;
  time: string;
  module: string;
  title: string;
  subtitle: string;
  actions: readonly string[];
  tools: readonly string[];
  result: string;
  variant?: ProgramStepVariant;
};

export type ProgramDay = {
  id: "day1" | "day2";
  tabLabel: string;
  eyebrow: string;
  title: string;
  note: string;
  included: string;
  steps: readonly ProgramStep[];
};

export const DAY_ONE_STEPS: readonly ProgramStep[] = [
  {
    id: "decouvrir",
    time: "09:00",
    module: "01",
    title: "Découvrir les possibilités",
    subtitle: "Voir concrètement ce que l’IA permet aujourd’hui de créer.",
    actions: [
      "Observer plusieurs réalisations concrètes",
      "Comprendre ce qui devient accessible sans savoir coder",
      "Identifier les usages adaptés à votre activité",
    ],
    tools: ["Idées", "Exemples", "Interfaces", "Résultats"],
    result: "Vous aurez une vision claire des possibilités et de leurs limites.",
  },
  {
    id: "comprendre",
    time: "09:45",
    module: "02",
    title: "Comprendre la méthode",
    subtitle: "Comprendre comment une idée devient progressivement un projet.",
    actions: [
      "Clarifier le besoin à résoudre",
      "Décomposer une idée en fonctions simples",
      "Avancer par étapes plutôt que tout demander d’un coup",
    ],
    tools: ["Besoin", "Priorités", "Fonctions", "Étapes"],
    result: "Vous saurez transformer une idée floue en premier plan d’action.",
  },
  {
    id: "preparer",
    time: "10:15",
    module: "03",
    title: "Préparer son environnement",
    subtitle: "Installer et configurer ce qui sera utilisé pendant la journée.",
    actions: [
      "Préparer votre ordinateur",
      "Ouvrir votre espace de création",
      "Vérifier les accès nécessaires",
      "Faire un premier essai accompagné",
    ],
    tools: ["Navigateur", "Espace de création", "Votre projet", "IA & services"],
    result: "Tout sera prêt pour commencer à créer.",
  },
  {
    id: "premiere-version",
    time: "10:45",
    module: "04",
    title: "Créer une première version",
    subtitle: "Passer de l’idée à un premier résultat visible et manipulable.",
    actions: [
      "Décrire le résultat attendu",
      "Lancer une première création",
      "Observer ce qui a été produit",
      "Repérer ce qui doit déjà évoluer",
    ],
    tools: ["Idée", "Demande claire", "Première version", "Aperçu"],
    result: "Vous aurez créé une première version fonctionnelle.",
  },
  {
    id: "modifier",
    time: "11:30",
    module: "05",
    title: "Modifier et améliorer",
    subtitle: "Faire évoluer ce que vous venez de créer sans repartir de zéro.",
    actions: [
      "Modifier un texte ou une organisation",
      "Faire évoluer l’interface",
      "Ajouter ou retirer un élément",
      "Comparer les différentes versions",
    ],
    tools: ["Sélection", "Modification", "Comparaison", "Validation"],
    result: "Vous saurez améliorer progressivement une première version.",
  },
  {
    id: "pause",
    time: "12:30",
    module: "06",
    title: "Pause",
    subtitle: "Échanger et prendre du recul avant la suite de la journée.",
    actions: [
      "Faire une vraie coupure",
      "Échanger avec le groupe",
      "Revenir sur les premiers apprentissages",
    ],
    tools: [],
    result: "Vous reprenez avec une vision plus claire de la suite.",
    variant: "pause",
  },
  {
    id: "fonctionnalites",
    time: "13:30",
    module: "07",
    title: "Ajouter de vraies fonctionnalités",
    subtitle: "Faire évoluer le premier projet pour le rendre réellement utile.",
    actions: [
      "Ajouter une action utile",
      "Construire un parcours simple",
      "Faire évoluer plusieurs écrans",
      "Vérifier que l’ensemble reste cohérent",
    ],
    tools: ["Interface", "Actions", "Informations", "Navigation"],
    result: "Votre première création commencera réellement à fonctionner.",
  },
  {
    id: "comprendre-projet",
    time: "14:30",
    module: "08",
    title: "Comprendre son projet",
    subtitle: "Savoir ce qui se passe sans devoir devenir développeur.",
    actions: [
      "Repérer les grandes parties du projet",
      "Comprendre l’impact d’une modification",
      "Identifier ce qui relève de l’interface ou du fonctionnement",
    ],
    tools: ["Écrans", "Contenus", "Fonctions", "Parcours"],
    result: "Vous pourrez mieux guider les évolutions de votre projet.",
  },
  {
    id: "tester",
    time: "15:15",
    module: "09",
    title: "Tester et corriger",
    subtitle: "Apprendre à débloquer un problème avec l’aide de l’IA.",
    actions: [
      "Reproduire précisément un problème",
      "Expliquer ce qui ne fonctionne pas",
      "Demander une correction ciblée",
      "Tester de nouveau avant de valider",
    ],
    tools: ["Observation", "Diagnostic", "Correction", "Validation"],
    result: "Vous saurez avancer méthodiquement lorsqu’un problème apparaît.",
  },
  {
    id: "votre-idee",
    time: "16:00",
    module: "10",
    title: "Travailler sur votre idée",
    subtitle: "Appliquer la méthode à un besoin concret qui vous concerne.",
    actions: [
      "Préciser le problème à résoudre",
      "Identifier les futurs utilisateurs",
      "Choisir les fonctions essentielles",
      "Définir une première version réaliste",
    ],
    tools: ["Votre idée", "Votre besoin", "Vos priorités", "Votre projet"],
    result: "Vous repartirez avec une première vision structurée de votre projet.",
    variant: "project",
  },
  {
    id: "autonomie",
    time: "16:40",
    module: "11",
    title: "Devenir plus autonome",
    subtitle: "Savoir comment continuer après la formation.",
    actions: [
      "Organiser les prochaines étapes",
      "Savoir quoi demander et quoi vérifier",
      "Continuer à tester sans rester bloqué",
      "Progresser sans vouloir tout construire immédiatement",
    ],
    tools: ["Observer", "Demander", "Tester", "Progresser"],
    result: "Vous aurez une méthode claire pour continuer seul.",
  },
  {
    id: "bilan",
    time: "17:00",
    module: "12",
    title: "Bilan et prochaines étapes",
    subtitle: "Faire le point et préparer la suite de votre apprentissage.",
    actions: [
      "Revenir sur les réalisations de la journée",
      "Répondre aux dernières questions",
      "Identifier les points à approfondir",
      "Définir la prochaine étape utile",
    ],
    tools: [],
    result: "Vous repartez en sachant comment commencer et continuer.",
    variant: "close",
  },
] as const;

export const DAY_TWO_STEPS: readonly ProgramStep[] = [
  {
    id: "reprendre-projet",
    time: "09:00",
    module: "01",
    title: "Reprendre son projet",
    subtitle: "Faire le point sur la première version et choisir les priorités du jour.",
    actions: [
      "Relire ce qui a déjà été réalisé",
      "Identifier les points solides et les blocages",
      "Choisir un objectif réaliste pour la journée",
    ],
    tools: ["Projet existant", "Priorités", "Plan d’action"],
    result: "Vous saurez exactement où concentrer vos efforts.",
  },
  {
    id: "structurer-idee",
    time: "09:45",
    module: "02",
    title: "Structurer son idée",
    subtitle: "Organiser les écrans, les fonctions et les usages du projet.",
    actions: [
      "Clarifier le parcours principal",
      "Regrouper les fonctions utiles",
      "Écarter ce qui peut attendre",
    ],
    tools: ["Parcours", "Écrans", "Fonctions", "Priorités"],
    result: "Votre projet disposera d’une structure plus claire et plus réaliste.",
  },
  {
    id: "construire-plus-loin",
    time: "10:30",
    module: "03",
    title: "Construire plus loin",
    subtitle: "Développer une partie importante au-delà de la première interface.",
    actions: [
      "Choisir une évolution prioritaire",
      "Construire une nouvelle partie",
      "L’intégrer au projet existant",
    ],
    tools: ["Projet", "Nouvelle fonction", "Aperçu", "Validation"],
    result: "Votre projet gagnera en profondeur sans perdre sa cohérence.",
  },
  {
    id: "relier-elements",
    time: "11:30",
    module: "04",
    title: "Relier les éléments",
    subtitle: "Comprendre comment les différentes parties travaillent ensemble.",
    actions: [
      "Faire circuler une information",
      "Relier plusieurs écrans",
      "Vérifier les enchaînements importants",
    ],
    tools: ["Informations", "Actions", "Écrans", "Parcours"],
    result: "Les différentes parties du projet fonctionneront mieux ensemble.",
  },
  {
    id: "pause",
    time: "12:30",
    module: "05",
    title: "Pause",
    subtitle: "Prendre du recul avant la phase de construction approfondie.",
    actions: ["Échanger sur les avancées", "Vérifier les priorités de l’après-midi"],
    tools: [],
    result: "Vous reprenez avec un objectif clair pour l’après-midi.",
    variant: "pause",
  },
  {
    id: "fonctions-utiles",
    time: "13:30",
    module: "06",
    title: "Créer des fonctionnalités utiles",
    subtitle: "Ajouter ce qui apporte une vraie valeur à votre projet.",
    actions: [
      "Construire une fonction prioritaire",
      "Prévoir ses différents états",
      "Vérifier qu’elle répond au besoin initial",
    ],
    tools: ["Fonction", "Contenu", "États", "Résultat"],
    result: "Votre projet fera davantage que présenter une simple interface.",
  },
  {
    id: "ameliorer-experience",
    time: "14:30",
    module: "07",
    title: "Améliorer l’expérience",
    subtitle: "Rendre le projet plus clair, fluide et agréable à utiliser.",
    actions: [
      "Simplifier ce qui paraît confus",
      "Renforcer la hiérarchie visuelle",
      "Améliorer les retours après une action",
    ],
    tools: ["Lisibilité", "Navigation", "Retours", "Cohérence"],
    result: "Le projet sera plus simple à comprendre et à utiliser.",
  },
  {
    id: "tester-utilisateur",
    time: "15:15",
    module: "08",
    title: "Tester comme un utilisateur",
    subtitle: "Parcourir le projet pour repérer les incohérences et les oublis.",
    actions: [
      "Suivre les parcours importants",
      "Tester les cas normaux et les blocages",
      "Lister les corrections prioritaires",
    ],
    tools: ["Scénarios", "Observation", "Anomalies", "Corrections"],
    result: "Vous aurez une liste claire des améliorations réellement utiles.",
  },
  {
    id: "finaliser",
    time: "16:00",
    module: "09",
    title: "Finaliser son projet",
    subtitle: "Corriger, harmoniser et consolider la version construite.",
    actions: [
      "Traiter les corrections prioritaires",
      "Harmoniser les écrans",
      "Vérifier une dernière fois les fonctions clés",
    ],
    tools: ["Corrections", "Cohérence", "Contrôle", "Version finale"],
    result: "Vous disposerez d’une version plus aboutie et plus fiable.",
    variant: "project",
  },
  {
    id: "apres-formation",
    time: "16:40",
    module: "10",
    title: "Préparer l’après-formation",
    subtitle: "Organiser la suite pour continuer avec davantage d’autonomie.",
    actions: [
      "Prioriser les évolutions futures",
      "Préparer une méthode de test",
      "Savoir quand demander de l’aide",
    ],
    tools: ["Feuille de route", "Priorités", "Méthode", "Autonomie"],
    result: "Vous saurez comment poursuivre sans vous disperser.",
  },
  {
    id: "bilan-final",
    time: "17:00",
    module: "11",
    title: "Bilan final",
    subtitle: "Présenter le résultat et définir les prochaines étapes.",
    actions: [
      "Présenter ce qui a été réalisé",
      "Mesurer le chemin parcouru",
      "Choisir la prochaine évolution du projet",
    ],
    tools: [],
    result: "Vous repartez avec un projet plus abouti et une suite clairement organisée.",
    variant: "close",
  },
] as const;

export const PROGRAM_DAYS: readonly ProgramDay[] = [
  {
    id: "day1",
    tabLabel: "Jour 1 · 7 h",
    eyebrow: "Les fondamentaux",
    title: "Apprendre à commencer",
    note: "Découvrir, préparer, créer, modifier, tester et continuer.",
    included: "Inclus dans les deux parcours",
    steps: DAY_ONE_STEPS,
  },
  {
    id: "day2",
    tabLabel: "Jour 2 · +7 h",
    eyebrow: "Aller plus loin",
    title: "Construire plus loin",
    note: "Approfondir votre projet, ses fonctions et son expérience.",
    included: "Inclus dans le parcours 14 h",
    steps: DAY_TWO_STEPS,
  },
] as const;

/** Alias temporaire pour les imports historiques internes. */
export const PROGRAM_STEPS = DAY_ONE_STEPS;
