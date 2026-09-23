/** Programme public BeWork — pédagogie centrée sur le projet du participant. */

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
  /** Chaîne visuelle courte (Idée → IA → …) affichée dans la carte. */
  flow?: readonly string[];
};

export type ProgramDay = {
  id: "day1" | "day2";
  tabLabel: string;
  eyebrow: string;
  title: string;
  note: string;
  included: string;
  description: string;
  steps: readonly ProgramStep[];
  outcomes: readonly string[];
  closingLine: string;
  summaryFlow: readonly string[];
  summaryLabel: string;
};

export const DAY_ONE_STEPS: readonly ProgramStep[] = [
  {
    id: "cadrer",
    time: "09:00",
    module: "01",
    title: "Cadrer votre projet",
    subtitle:
      "Nous partons de votre idée, de votre besoin et de ce que vous souhaitez réellement créer.",
    actions: [
      "Définir à qui s’adresse votre projet",
      "Clarifier le problème qu’il doit résoudre",
      "Lister ses fonctions principales",
      "Séparer ce qui est prioritaire de ce qui peut attendre",
    ],
    tools: ["Votre idée", "Votre besoin", "Priorités", "Périmètre"],
    result: "Votre projet a désormais un objectif clair et un premier périmètre de travail.",
  },
  {
    id: "environnement",
    time: "09:30",
    module: "02",
    title: "Préparer votre environnement de création",
    subtitle:
      "Nous installons et configurons les outils nécessaires pour travailler sur votre projet. Chaque participant prépare son propre ordinateur et son propre environnement.",
    actions: [
      "Préparer votre ordinateur",
      "Configurer votre espace de création",
      "Mettre en place la gestion du projet",
      "Vérifier les accès nécessaires pour démarrer",
    ],
    tools: [
      "Assistant IA",
      "Environnement de création",
      "Gestion du projet",
      "Données & services",
      "Sauvegarde",
    ],
    result: "Votre environnement est prêt pour commencer à travailler sur votre projet.",
  },
  {
    id: "role-outils",
    time: "10:15",
    module: "03",
    title: "Comprendre le rôle de chaque outil",
    subtitle:
      "Avant de construire, vous comprenez à quoi servent les différentes briques de votre environnement et comment elles communiquent.",
    actions: [
      "Repérer le rôle de chaque brique",
      "Comprendre le chemin de l’idée jusqu’à la mise en ligne",
      "Savoir à quel moment utiliser chaque outil",
    ],
    tools: ["Idée", "IA", "Création", "Données", "Sauvegarde", "Mise en ligne"],
    flow: [
      "Idée",
      "IA",
      "Environnement de création",
      "Projet",
      "Données / services",
      "Sauvegarde",
      "Mise en ligne",
    ],
    result: "Vous savez désormais à quoi sert chaque outil et à quel moment l’utiliser.",
  },
  {
    id: "methode",
    time: "10:45",
    module: "04",
    title: "Organiser votre méthode de travail",
    subtitle:
      "L’IA permet d’aller très vite. Sans méthode, il est aussi très facile de partir dans tous les sens. Nous apprenons une manière simple de travailler.",
    actions: [
      "Avancer une étape à la fois",
      "Faire une seule modification avant de vérifier",
      "Tester avant de continuer",
      "Sauvegarder les étapes stables",
    ],
    tools: ["Définir", "Planifier", "Modifier", "Tester", "Valider", "Sauvegarder"],
    flow: [
      "Définir",
      "Planifier",
      "Modifier",
      "Tester",
      "Valider",
      "Sauvegarder",
      "Continuer",
    ],
    result: "Vous disposez d’une méthode claire pour avancer sans perdre le contrôle de votre projet.",
  },
  {
    id: "structurer",
    time: "11:15",
    module: "05",
    title: "Structurer votre projet",
    subtitle:
      "Création du dossier de travail et compréhension de l’organisation générale. L’objectif n’est pas d’apprendre une arborescence par cœur : c’est de savoir où se trouve chaque chose.",
    actions: [
      "Créer un espace de travail propre",
      "Repérer pages, composants, médias et données",
      "Comprendre pourquoi un projet doit rester organisé",
      "Retenir : 1 projet = 1 espace de travail propre",
    ],
    tools: ["Pages / écrans", "Composants", "Médias", "Données", "Configuration"],
    result: "Votre projet possède maintenant une structure claire dans laquelle vous pourrez vous retrouver.",
  },
  {
    id: "guider-ia",
    time: "11:45",
    module: "06",
    title: "Apprendre à guider l’IA",
    subtitle:
      "Le résultat dépend fortement de la qualité de la demande. Vous apprenez une structure simple, puis le rôle des différents types d’agents IA.",
    actions: [
      "Formuler contexte, objectif, contraintes et tâche",
      "Prévoir comment vérifier le résultat",
      "Choisir un agent rapide, de raisonnement ou de contrôle",
      "Comprendre que les outils évoluent, mais que la méthode reste",
    ],
    tools: ["Contexte", "Objectif", "Contraintes", "Tâche", "Vérification", "Agents IA"],
    result: "Vous savez mieux formuler vos demandes et choisir le bon type d’IA selon la tâche.",
  },
  {
    id: "pause",
    time: "12:30",
    module: "07",
    title: "Pause",
    subtitle: "Une heure pour souffler avant de passer à la construction de votre projet.",
    actions: [],
    tools: [],
    result: "Vous reprenez avec l’énergie nécessaire pour construire.",
    variant: "pause",
  },
  {
    id: "architecture",
    time: "13:30",
    module: "08",
    title: "Construire l’architecture de votre projet",
    subtitle:
      "Nous reprenons votre idée et la transformons en plan concret. Ne pas essayer de tout construire d’un coup : le projet est découpé en petites étapes réalisables.",
    actions: [
      "Définir pages et écrans",
      "Lister fonctionnalités et données",
      "Clarifier le parcours utilisateur",
      "Ordonner les priorités de construction",
    ],
    tools: ["Pages", "Fonctionnalités", "Données", "Parcours", "Priorités"],
    result: "Vous savez maintenant ce que vous allez construire et dans quel ordre.",
  },
  {
    id: "premiere-version",
    time: "14:15",
    module: "09",
    title: "Créer votre première version",
    subtitle:
      "La construction commence réellement. Vous travaillez directement sur votre propre projet — pas sur une démonstration générique.",
    actions: [
      "Poser la première structure",
      "Créer les premières pages et la navigation",
      "Assembler l’interface et les premiers composants",
      "Faire apparaître les premières fonctionnalités",
    ],
    tools: ["Votre projet", "Structure", "Interface", "Fonctionnalités"],
    result: "Votre idée commence à devenir quelque chose de concret et visible.",
    variant: "project",
  },
  {
    id: "connecter",
    time: "15:15",
    module: "10",
    title: "Connecter votre projet",
    subtitle:
      "Selon les besoins du projet, nous commençons à faire communiquer ses différentes parties pour qu’il ne soit plus seulement visible, mais utile.",
    actions: [
      "Relier un formulaire à une action",
      "Enregistrer ou récupérer une information",
      "Afficher un résultat dans l’interface",
      "Vérifier que les parties communiquent correctement",
    ],
    tools: ["Interface", "Fonction", "Données", "Service"],
    flow: ["Formulaire", "Application", "Données"],
    result: "Votre projet ne se contente plus d’être visible : il commence à fonctionner.",
  },
  {
    id: "tester",
    time: "16:00",
    module: "11",
    title: "Tester, corriger et améliorer",
    subtitle:
      "Une erreur fait partie du processus. Vous apprenez à la comprendre et à la corriger sans simplement demander à l’IA de « tout réparer ».",
    actions: [
      "Identifier ce qui ne fonctionne pas",
      "Expliquer le contexte et fournir l’erreur",
      "Obtenir une proposition de correction ciblée",
      "Vérifier qu’elle n’a rien cassé ailleurs",
    ],
    tools: ["Observation", "Diagnostic", "Correction", "Contrôle"],
    result: "Vous savez utiliser l’IA pour comprendre et résoudre un problème sans perdre le contrôle.",
  },
  {
    id: "sauvegarder",
    time: "16:40",
    module: "12",
    title: "Sauvegarder et préparer la suite",
    subtitle:
      "Nous sauvegardons proprement votre travail, faisons le point et préparons la continuité — notamment pour le Jour 2 du parcours complet.",
    actions: [
      "Conserver une étape stable du projet",
      "Lister ce qui a été réalisé",
      "Identifier ce qu’il reste à construire",
      "Définir les prochaines priorités",
    ],
    tools: ["Sauvegarde", "Bilan", "Priorités", "Suite"],
    result: "Votre projet est organisé, sauvegardé et prêt pour la suite.",
    variant: "close",
  },
] as const;

export const DAY_TWO_STEPS: readonly ProgramStep[] = [
  {
    id: "reprendre",
    time: "09:00",
    module: "01",
    title: "Reprendre votre projet",
    subtitle:
      "Nous repartons exactement de ce que vous avez construit pendant le Jour 1. Même projet, même fil conducteur.",
    actions: [
      "Faire l’état des lieux de ce qui fonctionne",
      "Repérer ce qui reste à construire",
      "Identifier ce qui mérite d’être amélioré",
      "Fixer les priorités de la journée",
    ],
    tools: ["Votre projet", "État des lieux", "Priorités"],
    result: "Vous savez exactement où en est votre projet et ce qu’il reste à accomplir.",
  },
  {
    id: "renforcer-structure",
    time: "09:30",
    module: "02",
    title: "Renforcer sa structure",
    subtitle:
      "Nous vérifions l’organisation générale et corrigeons ce qui est devenu désordonné avant d’aller plus loin.",
    actions: [
      "Revoir fichiers, composants et pages",
      "Clarifier données et connexions",
      "Corriger les éléments désordonnés",
      "Faciliter les évolutions à venir",
    ],
    tools: ["Organisation", "Composants", "Données", "Connexions"],
    result: "Votre projet repose sur une structure plus propre et plus facile à faire évoluer.",
  },
  {
    id: "fonctionnalites",
    time: "10:15",
    module: "03",
    title: "Développer les fonctionnalités manquantes",
    subtitle:
      "Vous poursuivez votre propre projet. Nous ajoutons les fonctionnalités réellement nécessaires à son utilisation.",
    actions: [
      "Choisir les fonctions prioritaires pour votre besoin",
      "Les construire directement dans votre projet",
      "Vérifier qu’elles servent l’objectif réel",
    ],
    tools: ["Votre projet", "Fonctionnalités", "Besoin réel"],
    result: "Votre projet devient plus complet et plus proche de son objectif réel.",
    variant: "project",
  },
  {
    id: "fiabiliser",
    time: "11:00",
    module: "04",
    title: "Renforcer et fiabiliser le projet",
    subtitle:
      "Nous utilisons aussi l’IA comme outil de contrôle pour détecter erreurs, incohérences et points fragiles avant publication.",
    actions: [
      "Auditer les erreurs potentielles",
      "Repérer incohérences et comportements inattendus",
      "Contrôler connexions et fonctionnalités incomplètes",
      "Corriger le code fragile avant la mise en ligne",
    ],
    tools: ["Audit", "Contrôle", "Corrections", "Robustesse"],
    result: "Votre projet devient plus fiable avant sa publication.",
  },
  {
    id: "preparer-ligne",
    time: "11:45",
    module: "05",
    title: "Préparer la mise en ligne",
    subtitle:
      "Comprendre la différence entre environnement de création et environnement public, puis préparer les paramètres nécessaires.",
    actions: [
      "Distinguer création et production",
      "Préparer les paramètres de publication",
      "Vérifier que le projet est prêt à quitter votre ordinateur",
    ],
    tools: ["Environnement de création", "Environnement public", "Paramètres"],
    result: "Votre projet est prêt à quitter votre ordinateur.",
  },
  {
    id: "pause",
    time: "12:30",
    module: "06",
    title: "Pause",
    subtitle: "Une heure pour souffler avant la mise en ligne et le référencement.",
    actions: [],
    tools: [],
    result: "Vous reprenez prêt à publier.",
    variant: "pause",
  },
  {
    id: "mettre-en-ligne",
    time: "13:30",
    module: "07",
    title: "Mettre votre projet en ligne",
    subtitle:
      "Le participant déploie réellement son projet. Vous comprenez le rôle de l’hébergement, de l’adresse publique et du domaine.",
    actions: [
      "Publier le projet depuis une sauvegarde stable",
      "Comprendre hébergement et adresse publique",
      "Relier le projet à un domaine si pertinent",
      "Vérifier que le projet est accessible en ligne",
    ],
    tools: ["Sauvegarde", "Hébergement", "Adresse publique", "Mise en ligne"],
    flow: ["Projet", "Sauvegarde", "Hébergement", "Internet"],
    result: "Votre projet est accessible en ligne.",
    variant: "project",
  },
  {
    id: "seo-fondamentaux",
    time: "14:15",
    module: "08",
    title: "Préparer son référencement",
    subtitle:
      "Pour les projets destinés à être référencés : découvrir les fondamentaux SEO utiles. Aucune position dans les résultats de recherche n’est garantie.",
    actions: [
      "Travailler structure, titres et descriptions",
      "Clarifier contenus, URLs et liens",
      "Optimiser images et hiérarchie des titres",
      "Préparer les informations destinées aux moteurs",
    ],
    tools: ["Titres", "Descriptions", "Contenus", "URLs", "Images"],
    result:
      "Si votre projet s’y prête, il est mieux structuré pour être compris par les moteurs de recherche.",
  },
  {
    id: "seo-technique",
    time: "15:00",
    module: "09",
    title: "Vérifier le SEO technique",
    subtitle:
      "Contrôler les éléments techniques essentiels avant de demander l’indexation — de façon accessible aux débutants.",
    actions: [
      "Vérifier indexabilité, sitemap et robots",
      "Contrôler métadonnées et URLs",
      "Repérer liens cassés et erreurs",
      "Regarder performances et affichage mobile",
    ],
    tools: ["Indexabilité", "Sitemap", "Métadonnées", "Performance", "Mobile"],
    result: "Vous savez contrôler les principaux éléments techniques avant de demander l’indexation.",
  },
  {
    id: "suivi-visibilite",
    time: "15:45",
    module: "10",
    title: "Connecter les outils de suivi et de visibilité",
    subtitle:
      "Mettre en place les outils permettant de suivre présence, indexation, erreurs d’exploration et évolution du projet.",
    actions: [
      "Connecter les outils de suivi et d’indexation",
      "Vérifier si les moteurs voient le projet",
      "Comprendre impressions, clics et requêtes",
      "Savoir où regarder en cas d’erreur d’exploration",
    ],
    tools: ["Suivi", "Indexation", "Visibilité", "Exploration"],
    result: "Vous savez vérifier si les moteurs voient correctement votre projet.",
  },
  {
    id: "audit-final",
    time: "16:15",
    module: "11",
    title: "Auditer votre projet complet",
    subtitle:
      "Faire un véritable contrôle final. L’IA sert de second regard pour détecter les anomalies avant de continuer à évoluer.",
    actions: [
      "Contrôler desktop, mobile et navigation",
      "Vérifier liens, formulaires et connexions",
      "Regarder erreurs, performance et SEO",
      "Contrôler cohérence et accessibilité",
    ],
    tools: ["Desktop", "Mobile", "SEO", "Performance", "Accessibilité"],
    result: "Votre projet a été contrôlé dans son ensemble avant de continuer à évoluer.",
  },
  {
    id: "autonomie",
    time: "16:45",
    module: "12",
    title: "Organiser votre autonomie",
    subtitle:
      "Nous terminons par une feuille de route personnalisée pour reprendre votre projet après la formation sans repartir de zéro.",
    actions: [
      "Prioriser prochaines fonctionnalités et améliorations",
      "Organiser SEO, corrections et évolutions",
      "Consolider la méthode de travail",
      "Prévoir les audits futurs",
    ],
    tools: ["Feuille de route", "Priorités", "Méthode", "Autonomie"],
    result: "Vous savez comment reprendre votre projet après la formation sans repartir de zéro.",
    variant: "close",
  },
] as const;

export const PROGRAM_DAYS: readonly ProgramDay[] = [
  {
    id: "day1",
    tabLabel: "Jour 1 · 7 h",
    eyebrow: "De l’idée au premier projet fonctionnel",
    title: "De votre idée à votre première version fonctionnelle.",
    note: "Nous partons de votre projet et commençons réellement à le construire.",
    included: "Inclus dans les deux parcours",
    description:
      "Nous commençons par votre projet. Vous préparez votre environnement de création, comprenez le rôle des différents outils, apprenez à organiser votre travail et à guider correctement l’IA. Puis nous transformons votre idée en architecture et commençons réellement à la construire. À la fin de la journée, votre projet a commencé à prendre forme.",
    steps: DAY_ONE_STEPS,
    outcomes: [
      "préparé votre environnement",
      "organisé votre méthode de travail",
      "structuré votre idée",
      "créé l’architecture de votre projet",
      "commencé à le construire",
      "réalisé ses premières connexions",
      "appris à tester et corriger",
      "sauvegardé proprement votre travail",
    ],
    closingLine: "Votre projet existe. Vous savez maintenant comment le faire avancer.",
    summaryLabel: "Jour 1 — Construire",
    summaryFlow: [
      "Votre idée",
      "Environnement",
      "Méthode",
      "Architecture",
      "Création",
      "Connexions",
      "Tests",
      "Première version",
    ],
  },
  {
    id: "day2",
    tabLabel: "Jour 2 · +7 h",
    eyebrow: "Du projet à sa mise en ligne",
    title: "De votre première version à un projet publié et contrôlé.",
    note: "Reprendre le même projet : renforcer, publier, référencer et auditer.",
    included: "Parcours complet 14 h",
    description:
      "Le Jour 2 reprend directement le projet construit pendant le Jour 1. Nous améliorons, publions et contrôlons la version en ligne — avec les bases du référencement lorsque le projet s’y prête.",
    steps: DAY_TWO_STEPS,
    outcomes: [
      "repris un projet existant",
      "diagnostiqué et priorisé les améliorations",
      "corrigé et enrichi des fonctionnalités",
      "adapté l’affichage aux principaux écrans",
      "préparé la publication",
      "mis le projet en ligne",
      "appliqué les bases du référencement si pertinentes",
      "contrôlé la version publiée",
      "organisé les prochaines évolutions",
    ],
    closingLine:
      "Vous ne repartez pas avec un exercice. Vous repartez avec votre projet publié et une méthode pour continuer.",
    summaryLabel: "Jour 2 — Finaliser · Publier · Contrôler",
    summaryFlow: [
      "Première version",
      "Diagnostic",
      "Amélioration",
      "Publication",
      "Visibilité (si pertinent)",
      "Contrôle",
      "Feuille de route",
      "Projet en ligne",
    ],
  },
] as const;

/** Alias temporaire pour les imports historiques internes. */
export const PROGRAM_STEPS = DAY_ONE_STEPS;
