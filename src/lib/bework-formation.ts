/**
 * Positionnement BeWork — formation pratique « créer avec l’IA ».
 * Aucun outil, stack, prompt ou workflow technique détaillé ici.
 */

/** Source unique des parcours — 7 h / 14 h. */
export const TRAINING_OFFERS = {
  essential: {
    id: "essential",
    days: 1,
    hours: 7,
    price: 300,
    label: "1 jour",
    title: "Apprendre à commencer",
    description:
      "Une journée complète pour comprendre la méthode, préparer votre environnement, créer une première version, apprendre à modifier, tester et corriger.",
    promise: "Vous repartez en sachant comment commencer.",
    ctaLabel: "Choisir 1 journée",
    benefits: [
      "Parcours complet du Jour 1",
      "Mise en pratique guidée",
      "Première création fonctionnelle",
      "Méthode pour tester et corriger",
      "Plan pour continuer après la journée",
    ],
  },
  complete: {
    id: "complete",
    days: 2,
    hours: 14,
    price: 600,
    label: "2 jours",
    title: "Construire plus loin",
    description:
      "Le parcours du Jour 1, puis une deuxième journée pour pratiquer davantage, approfondir votre projet et gagner en autonomie.",
    promise: "Vous avez le temps de construire, tester, corriger et aller plus loin.",
    ctaLabel: "Choisir 2 journées",
    badge: "Recommandé pour aller plus loin",
    benefits: [
      "Tout le parcours 7 h",
      "Une journée supplémentaire de pratique",
      "Projet plus approfondi",
      "Fonctionnalités supplémentaires",
      "Tests, corrections et accompagnement renforcé",
    ],
  },
} as const;

export type TrainingOfferId = keyof typeof TRAINING_OFFERS;
export type TrainingOffer = (typeof TRAINING_OFFERS)[TrainingOfferId];

/** Prix Jour 1 (alias historique — préférer TRAINING_OFFERS). */
export const BEWORK_SESSION_PRICE_EUR = TRAINING_OFFERS.essential.price;
/** Prix parcours 14 h. */
export const BEWORK_COMPLETE_PRICE_EUR = TRAINING_OFFERS.complete.price;
/** Prolongation Jour 2 après inscription 7 h. */
export const BEWORK_EXTENSION_PRICE_EUR = TRAINING_OFFERS.essential.price;

/** Source commune des modes de participation, indépendante du parcours choisi. */
export const TRAINING_MODALITIES = {
  onsite: {
    id: "onsite",
    name: "Présentiel",
    badge: "Recommandé",
    description:
      "Une expérience directe, en petit groupe, avec un accompagnement attentif tout au long de la pratique.",
  },
  remote: {
    id: "remote",
    name: "Visio",
    badge: "Sessions dédiées",
    description:
      "Le même parcours pédagogique à distance, lors de sessions prévues pour faciliter les échanges et le partage d’écran.",
  },
} as const;

/** Constante facilement modifiable — non affichée tant que non figée. */
export const BEWORK_SESSION_MAX_PARTICIPANTS: number | null = null;

export const BEWORK_FORMATION_TAGLINE =
  "Apprenez à créer vos propres sites, applications et outils numériques avec l’intelligence artificielle — sans prérequis en programmation.";

export const DEMO_PROJECTS = [
  {
    slug: "messagerie",
    title: "Messagerie interne",
    description: "Centralisez les échanges d’une équipe dans votre propre interface.",
    accent: "#7c3aed",
  },
  {
    slug: "agenda",
    title: "Agenda professionnel",
    description:
      "Organisez rendez-vous, interventions, réunions ou tâches dans un agenda adapté à votre activité.",
    accent: "#2563eb",
  },
  {
    slug: "reservation",
    title: "Système de réservation",
    description:
      "Permettez à vos clients de sélectionner une prestation, une date et d’envoyer leur demande.",
    accent: "#0d9488",
  },
  {
    slug: "crm",
    title: "CRM / suivi commercial",
    description:
      "Suivez prospects, clients, opportunités et prochaines actions dans votre propre outil.",
    accent: "#ea580c",
  },
  {
    slug: "dashboard",
    title: "Tableau de bord",
    description:
      "Transformez vos données en une interface claire pour suivre votre activité.",
    accent: "#4f46e5",
  },
  {
    slug: "espace-client",
    title: "Espace client",
    description:
      "Créez un espace privé dans lequel vos clients retrouvent informations, documents ou suivi.",
    accent: "#059669",
  },
  {
    slug: "documents",
    title: "Gestion de documents",
    description:
      "Classez et retrouvez les informations importantes dans une interface adaptée à votre métier.",
    accent: "#6366f1",
  },
  {
    slug: "site",
    title: "Site professionnel",
    description:
      "Construisez une véritable présence en ligne adaptée à votre entreprise et à vos objectifs.",
    accent: "#1d4ed8",
  },
] as const;

export const DEMO_INTERACTIVE_SLUGS = [
  "messagerie",
  "agenda",
  "reservation",
  "crm",
  "dashboard",
  "documents",
  "espace-client",
] as const;

export type DemoInteractiveSlug = (typeof DEMO_INTERACTIVE_SLUGS)[number];

export const FORMATION_DAY_STEPS = [
  {
    title: "Imaginer",
    text: "Transformer un besoin en projet concret.",
  },
  {
    title: "Structurer",
    text: "Comprendre comment présenter correctement son idée.",
  },
  {
    title: "Construire",
    text: "Voir le projet prendre forme.",
  },
  {
    title: "Tester",
    text: "Comprendre ce qui fonctionne et ce qui doit évoluer.",
  },
  {
    title: "Améliorer",
    text: "Affiner le résultat progressivement.",
  },
  {
    title: "Continuer",
    text: "Être capable de poursuivre après la journée.",
  },
] as const;

/** Sélecteur interactif métiers — exemples sans détail technique. */
export const METIER_SELECTOR = [
  {
    id: "artisan",
    label: "Artisan",
    ideas: ["Devis", "Planning", "Clients", "Interventions"],
  },
  {
    id: "independant",
    label: "Indépendant",
    ideas: ["Espace client", "Rendez-vous", "Portfolio", "Suivi"],
  },
  {
    id: "commerce",
    label: "Commerce",
    ideas: ["Catalogue", "Demandes", "Stock léger", "Relances"],
  },
  {
    id: "restaurant",
    label: "Restaurant",
    ideas: ["Réservation", "Planning", "Clients", "Événements"],
  },
  {
    id: "agence",
    label: "Agence",
    ideas: ["CRM", "Pipeline", "Relances", "Reporting"],
  },
  {
    id: "immobilier",
    label: "Immobilier",
    ideas: ["Prospects", "Biens", "Relances", "Rendez-vous"],
  },
  {
    id: "entreprise",
    label: "Entreprise",
    ideas: ["CRM", "Tableau de bord", "Documents", "Outil interne"],
  },
  {
    id: "porteur",
    label: "Porteur de projet",
    ideas: ["Prototype", "Site", "Application", "Première version"],
  },
] as const;

export const AUDIENCE_PROFILES = [
  {
    title: "Entrepreneurs",
    text: "Vous avez une idée de service, d’application ou de plateforme mais pas forcément les compétences techniques pour la concrétiser.",
  },
  {
    title: "Artisans",
    text: "Devis, réservations, demandes clients, suivi d’interventions : créez des outils adaptés à votre façon de travailler.",
  },
  {
    title: "Indépendants",
    text: "Automatisez et structurez une partie de votre activité avec vos propres outils.",
  },
  {
    title: "TPE / PME",
    text: "Imaginez des applications internes correspondant précisément à vos méthodes de travail.",
  },
  {
    title: "Porteurs de projet",
    text: "Testez une idée et construisez un premier prototype avant d’investir lourdement.",
  },
  {
    title: "Curieux de l’IA",
    text: "Passez des simples conversations avec une IA à la création de véritables projets.",
  },
] as const;

export const METIER_IDEAS = [
  { metier: "Artisan", idea: "Demandes de devis · planning · suivi client" },
  { metier: "Restaurant", idea: "Réservation · organisation" },
  { metier: "Coach", idea: "Espace client · rendez-vous" },
  { metier: "Agence", idea: "CRM · suivi commercial" },
  { metier: "Garage", idea: "Suivi des interventions" },
  { metier: "Immobilier", idea: "Prospects · biens · relances" },
  { metier: "Association", idea: "Adhérents · documents · événements" },
  { metier: "Entreprise", idea: "Outil métier interne" },
] as const;

export const FORMATION_INCLUDES = [
  "Parcours Jour 1 complet (7 h)",
  "Accompagnement en petit groupe",
  "Installation et prise en main de l’environnement nécessaire",
  "Démonstrations concrètes",
  "Exercices pratiques",
  "Méthode de travail réutilisable",
  "Possibilité de prolonger avec le Jour 2",
] as const;

/** Programme horaire indicatif — page /formation. */
export const FORMATION_SCHEDULE = [
  {
    time: "09:00",
    title: "Découvrir",
    points: [
      "Ce qui a changé avec l’IA",
      "Ce qu’un non-développeur peut aujourd’hui commencer à faire",
      "Démonstrations concrètes",
      "Limites à connaître",
    ],
  },
  {
    time: "09:45",
    title: "Comprendre",
    points: [
      "Comment dialoguer avec une IA",
      "Comment expliquer ce que l’on veut",
      "Comment décomposer une idée",
      "Pourquoi plusieurs agents selon le travail demandé",
    ],
  },
  {
    time: "10:15",
    title: "Préparer",
    points: [
      "Installation guidée de l’environnement nécessaire",
      "Connexion aux services",
      "Réglages essentiels",
      "Prise en main",
    ],
  },
  {
    time: "10:45",
    title: "Première création",
    points: [
      "Construire ensemble une première interface",
      "Partir d’une idée simple",
      "Observer le passage idée → demande → interface",
    ],
  },
  {
    time: "11:30",
    title: "Modifier",
    points: [
      "Changer texte, design, fonctions, organisation",
      "Découvrir qu’un projet n’est pas figé",
    ],
  },
  {
    time: "12:30",
    title: "Pause",
    points: ["Temps de respiration avant la suite de la journée"],
    pause: true,
  },
  {
    time: "13:30",
    title: "Construire plus loin",
    points: [
      "Ajouter des fonctions",
      "Exemples : réservation, formulaire, clients, planning, données, dashboard",
    ],
  },
  {
    time: "14:30",
    title: "Comprendre ce que l’on construit",
    points: [
      "Sans cours de programmation lourd",
      "Interface, information, utilisateur, donnée, action, logique",
    ],
  },
  {
    time: "15:15",
    title: "Tester & corriger",
    points: [
      "Identifier un problème",
      "L’expliquer",
      "Demander une correction",
      "Vérifier et recommencer",
    ],
  },
  {
    time: "16:00",
    title: "Votre idée",
    points: [
      "Quel problème voulez-vous résoudre ?",
      "Pour qui ?",
      "Avec quelles fonctions ?",
      "Quelle première version simple ?",
    ],
  },
  {
    time: "16:40",
    title: "Continuer après la journée",
    points: [
      "Comment progresser seul",
      "Comment demander de l’aide à l’IA",
      "Éviter de vouloir tout créer immédiatement",
      "Construire progressivement",
    ],
  },
  {
    time: "17:00",
    title: "Échanges / conclusion",
    points: ["Questions", "Perspectives", "Prochaines étapes"],
  },
] as const;

/** Acquis Jour 1 — verbes d’action, pas « maîtriser ». */
export const FORMATION_ACQUIS_DAY1 = [
  { verb: "Transformer", text: "une idée en demande claire" },
  { verb: "Structurer", text: "les premières fonctions" },
  { verb: "Créer", text: "une première version" },
  { verb: "Modifier", text: "un résultat" },
  { verb: "Tester", text: "ce que vous avez créé" },
  { verb: "Corriger", text: "avec l’aide de l’IA" },
  { verb: "Comprendre", text: "suffisamment pour continuer" },
  { verb: "Dialoguer", text: "plus efficacement avec l’IA" },
] as const;

/** Acquis Jour 2 — approfondissement, pas expertise complète. */
export const FORMATION_ACQUIS_DAY2 = [
  { verb: "Structurer", text: "davantage un projet" },
  { verb: "Ajouter", text: "des fonctionnalités" },
  { verb: "Faire évoluer", text: "plusieurs parties" },
  { verb: "Tester", text: "plus méthodiquement" },
  { verb: "Identifier", text: "un problème" },
  { verb: "Corriger", text: "et améliorer" },
  { verb: "Travailler", text: "plus longuement sur votre projet" },
  { verb: "Organiser", text: "la suite" },
  { verb: "Gagner", text: "en autonomie" },
] as const;

/** @deprecated Préférer FORMATION_ACQUIS_DAY1 */
export const FORMATION_ACQUIS = FORMATION_ACQUIS_DAY1;

export const FORMATION_INTERACTIVE_BEATS = [
  "Vous regardez",
  "Vous essayez",
  "Vous vous trompez",
  "Vous demandez",
  "Vous corrigez",
  "Vous recommencez",
  "Vous comprenez",
] as const;

export const FORMATION_PROJECT_STEPS = [
  { label: "Qui ?", hint: "Pour qui créez-vous ?" },
  { label: "Pourquoi ?", hint: "Quel problème résoudre ?" },
  { label: "Quelles fonctions ?", hint: "Qu’est-ce qui doit vraiment exister ?" },
  { label: "Quelle première version ?", hint: "Le plus simple pour commencer" },
] as const;

/** Profils — page /formation (rassurer, pas catégoriser). */
export const FORMATION_AUDIENCE = [
  {
    title: "Entrepreneur",
    text: "Créer ses premiers outils sans engager immédiatement de gros budgets.",
  },
  {
    title: "Indépendant",
    text: "Créer des outils adaptés à sa propre manière de travailler.",
  },
  {
    title: "Artisan / commerçant",
    text: "Site, demandes clients, réservation, organisation.",
  },
  {
    title: "Salarié",
    text: "Comprendre les nouvelles possibilités et gagner en autonomie.",
  },
  {
    title: "Demandeur d’emploi",
    text: "Découvrir de nouvelles compétences et éventuellement une nouvelle direction.",
  },
  {
    title: "Porteur de projet",
    text: "Passer de l’idée abstraite à une première version.",
  },
  {
    title: "Personne en réflexion",
    text: "Découvrir un univers qui pouvait auparavant sembler inaccessible.",
  },
  {
    title: "Curieux",
    text: "Comprendre concrètement ce que cette nouvelle génération d’IA permet.",
  },
] as const;

export const FORMATION_REORIENT_PATH = [
  "Curiosité",
  "Découverte",
  "Première création",
  "Envie d’aller plus loin",
] as const;

export const FORMATION_BUSINESS_NEEDS = [
  "Site internet",
  "Landing page",
  "Formulaire",
  "Réservation",
  "Agenda",
  "CRM",
  "Suivi client",
  "Dashboard",
  "Espace client",
  "Automatisation simple",
] as const;

/** Showroom léger — renvoie vers /demonstrations pour le détail. */
export const FORMATION_CREATION_EXAMPLES = [
  "Site internet",
  "Landing page",
  "Réservation",
  "Agenda",
  "CRM",
  "Messagerie",
  "Tableau de bord",
  "Espace client",
  "Outil métier",
  "Formulaire",
  "Portfolio",
  "Prototype",
] as const;

/** Inclus tarif — page /formation (parcours commun Jour 1). */
export const FORMATION_TARIF_INCLUDES = [
  "Parcours Jour 1 (7 h)",
  "Petit groupe",
  "Démonstrations",
  "Installation / préparation guidée",
  "Exercices pratiques",
  "Accompagnement",
  "Travail autour des idées",
  "Méthode réutilisable",
] as const;

export const FORMATION_CHECKLIST_ONSITE = [
  "Ordinateur portable",
  "Chargeur",
  "Accès email",
  "Navigateur récent",
  "Droits d’installation",
  "Idée éventuelle",
] as const;

export const FORMATION_CHECKLIST_VISIO = [
  "Connexion stable",
  "Webcam recommandée",
  "Micro",
  "Partage d’écran disponible",
] as const;

export const FORMATION_NAV = [
  { href: "#presentation", label: "Présentation" },
  { href: "#modalites", label: "Modalités" },
  { href: "#prerequis", label: "Prérequis" },
  { href: "#programme", label: "Programme" },
  { href: "#acquis", label: "Acquis" },
  { href: "#pour-qui", label: "Pour qui" },
  { href: "#tarif", label: "Tarif" },
  { href: "#faq", label: "FAQ" },
] as const;

/** FAQ pratique complète — page /formation. */
export const FORMATION_PAGE_FAQ = [
  {
    q: "Quelle différence entre la formation 7 h et 14 h ?",
    a: "La première journée est commune à tous. Elle vous apprend à comprendre la méthode, préparer votre environnement, créer, modifier, tester et corriger. Le parcours de 14 h ajoute une deuxième journée consacrée à davantage de pratique, à l’approfondissement et à un projet plus avancé.",
  },
  {
    q: "Puis-je commencer par 7 h et décider ensuite de continuer ?",
    a: `Oui. Vous pouvez commencer par la première journée à ${TRAINING_OFFERS.essential.price} €. Si vous souhaitez poursuivre, vous pouvez ajouter la deuxième journée pour ${BEWORK_EXTENSION_PRICE_EUR} € supplémentaires.`,
  },
  {
    q: "Est-ce que les 7 h suffisent pour apprendre ?",
    a: "Les 7 h sont conçues comme une formation complète pour apprendre à commencer et acquérir une méthode. Elles ne prétendent pas faire de vous un développeur en une journée. Le parcours de 14 h permet surtout de pratiquer davantage et d’aller plus loin.",
  },
  {
    q: "Est-ce que les participants des parcours 7 h et 14 h sont ensemble ?",
    a: "Oui. La première journée est commune. Les participants inscrits au parcours 14 h poursuivent ensuite avec la deuxième journée.",
  },
  {
    q: "Faut-il savoir coder ?",
    a: "Non. La formation est conçue pour des débutants et des personnes qui ne viennent pas du développement informatique.",
  },
  {
    q: "Faut-il être bon en informatique ?",
    a: "Non. La formation est conçue pour des personnes qui partent de zéro ou qui se sentent peu à l’aise.",
  },
  {
    q: "Puis-je venir sans idée ?",
    a: "Oui. Nous utiliserons des exemples concrets. Une idée n’est pas un prérequis.",
  },
  {
    q: "Puis-je venir avec mon projet ?",
    a: "Oui. Même une idée floue permet de mieux comprendre comment structurer un besoin.",
  },
  {
    q: "Quel ordinateur faut-il ?",
    a: "Windows ou Mac relativement récent. 8 Go de RAM recommandés minimum. 16 Go = plus confortable.",
  },
  {
    q: "Faut-il un ordinateur très puissant ?",
    a: "Non. Pas besoin d’une machine haut de gamme ni d’un ordinateur gaming.",
  },
  {
    q: "Faut-il une carte graphique spéciale ?",
    a: "Non pour les activités prévues.",
  },
  {
    q: "Dois-je installer quelque chose avant ?",
    a: "Les instructions nécessaires seront indiquées avant la session. Une grande partie de la mise en place pourra être faite ensemble.",
  },
  {
    q: "Puis-je suivre la formation en visio ?",
    a: "Oui. BeWork privilégie le présentiel, mais organise également des sessions en visioconférence pour les personnes qui ne peuvent pas se déplacer. Les deux durées (7 h et 14 h) peuvent s’inscrire dans le mode prévu par la session.",
  },
  {
    q: "La visio se déroule-t-elle en même temps que le présentiel ?",
    a: "Non. Les sessions distancielles sont des sessions dédiées.",
  },
  {
    q: "Est-ce que je deviendrai développeur ?",
    a: "Non. Vous repartirez capable de commencer, de demander, de tester et de continuer à apprendre — pas développeur en une journée.",
  },
  {
    q: "Est-ce que je pourrai continuer après ?",
    a: "Oui. Vous apprenez une démarche réutilisable pour reprendre votre projet, le tester et continuer à progresser après la session.",
  },
  {
    q: "Les outils utilisés sont-ils gratuits ?",
    a: "Certains disposent d’offres gratuites, d’autres peuvent avoir des abonnements ou coûts propres. Nous restons transparents pendant la session.",
  },
] as const;

export const FORMATION_FAQ = [
  {
    q: "Faut-il savoir coder ?",
    a: "Non. La formation est conçue pour des personnes qui ne viennent pas du développement informatique.",
  },
  {
    q: "Est-ce adapté aux débutants ?",
    a: "Oui. BeWork part du principe que vous n’avez pas besoin d’être développeur. Le parcours est pensé pour débuter clairement, sans jargon inutile.",
  },
  {
    q: "Est-ce une formation de développement informatique ?",
    a: "Non. Vous apprenez à guider une création assistée par l’IA, à tester le résultat et à l’améliorer, sans suivre un cursus de programmation ni prétendre devenir développeur en une journée.",
  },
  {
    q: "Quelle différence entre 7 h et 14 h ?",
    a: "Tout le monde commence par la même première journée. Les 7 h vous apprennent à commencer et à continuer seul. Les 14 h ajoutent une deuxième journée pour pratiquer davantage et construire plus loin.",
  },
  {
    q: "Est-ce que les 7 h suffisent pour apprendre ?",
    a: "Les 7 h forment un parcours complet pour apprendre à commencer, créer une première version, tester, corriger et continuer seul. Elles ne prétendent pas faire de vous un développeur en une journée.",
  },
  {
    q: "Les participants des parcours 7 h et 14 h sont-ils ensemble ?",
    a: "Oui. La première journée est commune à tous. Les participants inscrits au parcours 14 h poursuivent ensuite avec la deuxième journée.",
  },
  {
    q: "Puis-je commencer par 1 jour et prolonger ensuite ?",
    a: `Oui. Commencez par la première journée à ${TRAINING_OFFERS.essential.price} €. Si vous souhaitez aller plus loin, ajoutez simplement le deuxième jour pour ${BEWORK_EXTENSION_PRICE_EUR} € supplémentaires.`,
  },
  {
    q: "Que peut-on créer ?",
    a: "Sites, applications, systèmes de réservation, CRM, agendas, tableaux de bord, messageries, espaces clients, outils métier ou prototypes — selon votre idée et votre niveau de départ.",
  },
  {
    q: "Dois-je venir avec mon ordinateur ?",
    a: "Oui. La formation est pratique et doit idéalement être suivie depuis votre propre ordinateur.",
  },
  {
    q: "Puis-je venir avec une idée ?",
    a: "Oui. Une idée, même floue, permet justement de mieux comprendre comment structurer un besoin et avancer concrètement.",
  },
  {
    q: "Puis-je suivre la formation en visio ?",
    a: "Oui. BeWork privilégie le présentiel et propose aussi des sessions entièrement à distance, à des dates dédiées. Les parcours 7 h et 14 h peuvent être suivis selon la modalité prévue pour la session.",
  },
  {
    q: "Que vais-je savoir faire après ?",
    a: "Après 7 h : structurer un besoin, lancer une première création, modifier, tester, corriger et continuer. Après 14 h : davantage de pratique et un projet plus abouti. Vous ne repartirez pas développeur — vous repartirez capable de progresser.",
  },
  {
    q: "Quels outils utilisez-vous ?",
    a: "Nous utilisons pendant la formation un environnement de création assisté par intelligence artificielle, choisi pour être accessible aux débutants. Les outils sont présentés aux participants — pas détaillés sur le site.",
  },
  {
    q: "Pourquoi ne présentez-vous pas toute la méthode sur le site ?",
    a: "Parce que BeWork est avant tout une formation pratique. Le site vous montre ce qu’il est possible de réaliser ; la formation vous apprend comment y parvenir.",
  },
] as const;

const HOME_FAQ_QUESTIONS = new Set<string>([
  "Faut-il savoir coder ?",
  "Est-ce adapté aux débutants ?",
  "Quelle différence entre 7 h et 14 h ?",
  "Puis-je commencer par 1 jour et prolonger ensuite ?",
  "Que peut-on créer ?",
  "Dois-je venir avec mon ordinateur ?",
  "Que vais-je savoir faire après ?",
]);

/** FAQ réellement affichée sur l’accueil — réutilisée par le JSON-LD. */
export const HOME_FORMATION_FAQ = FORMATION_FAQ.filter((item) =>
  HOME_FAQ_QUESTIONS.has(item.q),
);

export const LEARN_INTENT_OPTIONS = [
  { value: "site_internet", label: "Site internet" },
  { value: "application", label: "Application" },
  { value: "outil_interne", label: "Outil interne" },
  { value: "reservation", label: "Système de réservation" },
  { value: "crm", label: "CRM" },
  { value: "espace_client", label: "Espace client" },
  { value: "tableau_de_bord", label: "Tableau de bord" },
  { value: "autre", label: "Autre" },
] as const;

export const IT_LEVEL_OPTIONS = [
  { value: "debutant", label: "Débutant" },
  { value: "intermediaire", label: "Intermédiaire" },
  { value: "aise", label: "À l’aise" },
] as const;
