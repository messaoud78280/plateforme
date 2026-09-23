/**
 * Positionnement BeWork — formation pratique « créer avec l’IA ».
 * Contenu public aligné sur les programmes officiels (PDF).
 * Aucun détail de stack, prompts ou procédures internes.
 */

/** Chemins publics des programmes officiels (téléchargement libre). */
export const TRAINING_PROGRAM_PDF = {
  essential: "/programmes/programme-bework-7h.pdf",
  complete: "/programmes/programme-bework-14h.pdf",
} as const;

/** Source unique des parcours — 7 h / 14 h. */
export const TRAINING_OFFERS = {
  essential: {
    id: "essential",
    days: 1,
    hours: 7,
    price: 300,
    label: "Parcours 1 — 1 journée",
    title: "De l’idée à votre première création.",
    description:
      "Apprenez à transformer votre idée en un premier projet fonctionnel grâce à l’intelligence artificielle.",
    promise: "JOUR 1 — Je construis ma première version.",
    ctaLabel: "Demander une place — 300 €",
    discoverLabel: "Découvrir le parcours 7 h",
    discoverHref: "/formation#programme",
    pdfHref: TRAINING_PROGRAM_PDF.essential,
    pdfLabel: "Télécharger le programme de formation BeWork 7 heures",
    groupSize: "6 à 8 participants",
    practiceShare: "70 % de pratique",
    benefits: [
      "Cadrer votre projet",
      "Préparer votre environnement",
      "Apprendre à guider l’IA",
      "Construire une première version",
      "Tester et corriger votre création",
      "Repartir avec une méthode pour continuer",
    ],
  },
  complete: {
    id: "complete",
    days: 2,
    hours: 14,
    price: 600,
    label: "Parcours 2 — 2 journées",
    title: "De votre idée à votre projet en ligne.",
    description:
      "Construisez votre première version, améliorez-la et apprenez à la publier pour la rendre accessible.",
    promise: "JOUR 2 — Je finalise et je mets mon projet en ligne.",
    ctaLabel: "Demander une place — 600 €",
    discoverLabel: "Découvrir le parcours 14 h",
    discoverHref: "/formation#programme",
    pdfHref: TRAINING_PROGRAM_PDF.complete,
    pdfLabel: "Télécharger le programme de formation BeWork 14 heures",
    groupSize: "6 à 8 participants",
    practiceShare: "70 % de pratique",
    badge: "Comprend le parcours 7 h",
    benefits: [
      "L’intégralité du parcours de 7 heures",
      "Amélioration des fonctionnalités",
      "Adaptation aux différents écrans",
      "Préparation de la publication",
      "Mise en ligne du projet",
      "Bases du référencement web (si pertinent)",
      "Tests de la version publiée",
      "Feuille de route pour continuer",
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

/** Acquis Jour 2 — aligné programme officiel (publication + SEO si pertinent). */
export const FORMATION_ACQUIS_DAY2 = [
  { verb: "Diagnostiquer", text: "votre première version" },
  { verb: "Prioriser", text: "les améliorations" },
  { verb: "Corriger", text: "et enrichir le projet" },
  { verb: "Adapter", text: "l’affichage aux écrans" },
  { verb: "Préparer", text: "la mise en ligne" },
  { verb: "Publier", text: "pour rendre le projet accessible" },
  { verb: "Appliquer", text: "les bases du référencement si pertinent" },
  { verb: "Contrôler", text: "la version publiée" },
  { verb: "Organiser", text: "la suite en autonomie" },
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
  "Ordinateur portable et chargeur",
  "Accès email",
  "Navigateur récent",
  "Droits d’installation",
  "Abonnement IA payant actif (non inclus)",
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
  { href: "#programmes-officiels", label: "Programmes" },
  { href: "#programme", label: "Déroulé" },
  { href: "#acquis", label: "Acquis" },
  { href: "#tarif", label: "Tarif" },
  { href: "#faq", label: "FAQ" },
] as const;

/** FAQ pratique complète — page /formation. */
export const FORMATION_PAGE_FAQ = [
  {
    q: "Quelle différence entre la formation 7 h et 14 h ?",
    a: "La première journée est commune : cadrer, préparer l’environnement, guider l’IA, construire une première version, tester et corriger. Le parcours 14 h ajoute une deuxième journée pour améliorer le projet, le publier, appliquer les bases du référencement lorsque cela est pertinent, contrôler la version en ligne et préparer la suite.",
  },
  {
    q: "Puis-je commencer par 7 h et décider ensuite de continuer ?",
    a: `Oui. Vous pouvez commencer par la première journée à ${TRAINING_OFFERS.essential.price} €. Si vous souhaitez poursuivre, vous pouvez ajouter la deuxième journée pour ${BEWORK_EXTENSION_PRICE_EUR} € supplémentaires.`,
  },
  {
    q: "Que vais-je savoir faire après la première journée ?",
    a: "Vous disposez d’un environnement opérationnel, d’un projet cadré, d’une première version fonctionnelle, d’une méthode pour tester et corriger, d’un projet sauvegardé et d’une feuille de route pour continuer.",
  },
  {
    q: "Mon projet sera-t-il en ligne après 7 h ?",
    a: "Non. La journée de 7 h vise une première version fonctionnelle et une méthode pour continuer. La mise en ligne fait partie du parcours de 14 heures (deuxième journée).",
  },
  {
    q: "Que vais-je apprendre à publier après 14 h ?",
    a: "Vous apprenez à préparer et publier votre projet pour le rendre accessible en ligne, à contrôler la version publiée, et — pour les projets destinés à être référencés — à appliquer les bases du référencement et à vérifier l’indexation. Aucune position dans les résultats de recherche n’est garantie.",
  },
  {
    q: "Est-ce que les 7 h suffisent pour apprendre ?",
    a: "Les 7 h forment un parcours complet pour apprendre à commencer et acquérir une méthode. Elles ne prétendent pas faire de vous un développeur en une journée. Le parcours de 14 h permet d’aller jusqu’à la publication et de consolider votre autonomie.",
  },
  {
    q: "Est-ce que les participants des parcours 7 h et 14 h sont ensemble ?",
    a: "Oui. La première journée est commune. Les participants inscrits au parcours 14 h poursuivent ensuite avec la deuxième journée.",
  },
  {
    q: "Faut-il savoir coder ?",
    a: "Non. Aucun prérequis en programmation n’est nécessaire. La formation s’adresse aux personnes qui ne viennent pas du développement informatique.",
  },
  {
    q: "Faut-il être bon en informatique ?",
    a: "Non. Il faut savoir utiliser un ordinateur, naviguer sur Internet et utiliser une messagerie. Le reste se construit pendant la formation.",
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
    a: "Un ordinateur portable personnel avec chargeur, navigateur récent, droits d’installation, et idéalement au moins 8 Go de mémoire vive. Quelques gigaoctets d’espace disque sont nécessaires.",
  },
  {
    q: "Faut-il un ordinateur très puissant ?",
    a: "Non. Pas besoin d’une machine haut de gamme ni d’un ordinateur gaming.",
  },
  {
    q: "Faut-il un abonnement IA ?",
    a: "Oui. Un abonnement payant actif à un outil d’intelligence artificielle générative compatible (ChatGPT ou Claude AI) est requis, avec compte créé et accès vérifiés avant la formation.",
  },
  {
    q: "L’abonnement IA est-il inclus dans le tarif ?",
    a: `Non. L’abonnement à l’outil d’intelligence artificielle n’est pas compris dans les ${TRAINING_OFFERS.essential.price} € ni dans les ${TRAINING_OFFERS.complete.price} €. Son coût est communiqué avant l’inscription.`,
  },
  {
    q: "Dois-je installer quelque chose avant ?",
    a: "Les consignes nécessaires sont indiquées avant la session. Une partie de la mise en place est réalisée ensemble pendant la formation.",
  },
  {
    q: "Puis-je suivre la formation en visio ?",
    a: "Oui. Le présentiel est privilégié. Des classes virtuelles à dates dédiées sont également organisées. Horaires et effectif identiques. Connexion Internet stable, micro et partage d’écran sont nécessaires.",
  },
  {
    q: "La visio se déroule-t-elle en même temps que le présentiel ?",
    a: "Non. Les sessions distancielles sont des sessions dédiées.",
  },
  {
    q: "Une prise en charge OPCO est-elle possible ?",
    a: "Oui, selon l’éligibilité de l’entreprise et du dossier. Contactez-nous pour étudier votre situation.",
  },
  {
    q: "Une attestation est-elle remise ?",
    a: "Oui. Une attestation individuelle de fin de formation est remise à l’issue de la session.",
  },
  {
    q: "Est-ce que je deviendrai développeur ?",
    a: "Non. Vous repartez capable de commencer, de guider l’IA, de tester et de continuer à apprendre — pas développeur professionnel en une ou deux journées.",
  },
  {
    q: "Est-ce que je pourrai continuer après ?",
    a: "Oui. Vous emportez une méthode réutilisable et une feuille de route pour poursuivre votre projet en autonomie.",
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
    a: "Tout le monde commence par la même première journée. Les 7 h mènent à une première version fonctionnelle. Les 14 h ajoutent la finalisation, la publication et les bases du référencement lorsque le projet s’y prête.",
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
    a: "Après 7 h : environnement prêt, projet cadré, première version, méthode de test/correction et feuille de route. Après 14 h : projet amélioré, publié et contrôlé, avec bases du référencement si pertinentes. Vous ne repartez pas développeur — vous repartez capable de progresser.",
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



/** Modules officiels Jour 1 — présentation publique (sans procédures internes). */
export const OFFICIAL_PROGRAM_MODULES_DAY1 = [
  {
    number: "01",
    title: "Cadrer et préparer son projet",
    objective: "Clarifier le besoin, installer l’environnement et comprendre le rôle de chaque outil.",
    skills: [
      "Identifier utilisateurs et fonctionnalités principales",
      "Préparer et vérifier les accès nécessaires",
      "Savoir à quelle étape utiliser chaque outil",
    ],
    result: "Un projet cadré et un environnement opérationnel pour démarrer la production.",
  },
  {
    number: "02",
    title: "Structurer son projet et guider efficacement l’IA",
    objective: "Organiser le périmètre et formuler des instructions claires pour progresser étape par étape.",
    skills: [
      "Décomposer le projet en étapes",
      "Hiérarchiser les fonctionnalités de la première version",
      "Rédiger des consignes structurées et les ajuster",
    ],
    result: "Un périmètre fonctionnel défini et une méthode pour dialoguer efficacement avec l’IA.",
  },
  {
    number: "03",
    title: "Construire une première version du projet",
    objective: "Passer de l’idée structurée à une première version utilisable.",
    skills: [
      "Organiser l’ordre de construction",
      "Générer puis faire évoluer une première version",
      "Relier écrans, formulaires et données essentielles",
    ],
    result: "Une première version construite avec ses premières connexions fonctionnelles.",
  },
  {
    number: "04",
    title: "Tester, corriger et pérenniser son projet",
    objective: "Vérifier le résultat, corriger les écarts et préparer la suite.",
    skills: [
      "Construire un scénario de test simple",
      "Décrire un problème et demander une correction",
      "Sauvegarder le travail et formaliser une feuille de route",
    ],
    result: "Une méthode de test/correction, un projet sauvegardé et une feuille de route personnelle.",
  },
] as const;

/** Modules officiels Jour 2 — parcours 14 h. */
export const OFFICIAL_PROGRAM_MODULES_DAY2 = [
  {
    number: "01",
    title: "Diagnostiquer et prioriser les améliorations",
    objective: "Reprendre la version du Jour 1 et décider quoi corriger en priorité.",
    skills: [
      "Tester les fonctionnalités existantes",
      "Repérer écarts et manques",
      "Classer corrections nécessaires et améliorations secondaires",
    ],
    result: "Un diagnostic clair et un plan de travail pour la journée.",
  },
  {
    number: "02",
    title: "Améliorer et enrichir le projet",
    objective: "Corriger, adapter aux écrans et ajouter des fonctionnalités sans casser l’existant.",
    skills: [
      "Corriger les dysfonctionnements",
      "Adapter l’affichage ordinateurs, tablettes et mobiles",
      "Ajouter une fonctionnalité à la fois et tester",
    ],
    result: "Un projet plus fiable, plus complet et mieux adapté aux différents écrans.",
  },
  {
    number: "03",
    title: "Préparer et publier le projet",
    objective: "Rendre le projet accessible en ligne en appliquant les précautions essentielles.",
    skills: [
      "Contrôler liens, formulaires et contenus avant publication",
      "Configurer la publication et vérifier l’accès en ligne",
      "Protéger les informations personnelles ou sensibles",
    ],
    result: "Une version publiée et accessible, avec premiers contrôles réalisés.",
  },
  {
    number: "04",
    title: "Améliorer la visibilité et contrôler le projet publié",
    objective: "Appliquer les bases du référencement lorsque le projet s’y prête, sans promesse de classement.",
    skills: [
      "Travailler titres, descriptions et structure des pages",
      "Optimiser images et adresses de pages",
      "Comprendre l’indexation et vérifier les premiers éléments disponibles",
    ],
    result: "Les bases du référencement appliquées si pertinentes, et un contrôle de la version publiée.",
  },
  {
    number: "05",
    title: "Tester la version publiée et préparer la suite",
    objective: "Contrôler le projet en ligne et organiser la poursuite en autonomie.",
    skills: [
      "Parcourir le projet de bout en bout sur la version publiée",
      "Consigner les anomalies restantes",
      "Élaborer une feuille de route personnelle",
    ],
    result: "Un relevé d’améliorations et un plan pour continuer après la formation.",
  },
] as const;

export const FORMATION_TAKEAWAYS_7H = [
  "Un environnement de travail opérationnel",
  "Un projet cadré et structuré",
  "Une première version fonctionnelle",
  "Une méthode pour tester et corriger",
  "Un projet sauvegardé",
  "Une feuille de route personnelle",
] as const;

export const FORMATION_TAKEAWAYS_14H = [
  "Projet testé et amélioré",
  "Fonctionnalités enrichies",
  "Adaptation aux principaux formats d’écran",
  "Version publiée et accessible en ligne",
  "Bases du référencement appliquées si pertinentes",
  "Contrôle de la version publiée",
  "Plan de progression pour continuer en autonomie",
] as const;

export const FORMATION_PRACTICAL_POINTS = [
  "70 % de pratique",
  "6 à 8 participants par session",
  "Présentiel privilégié",
  "Classes virtuelles à dates dédiées",
  "Intra-entreprise sur devis",
  "Attestation individuelle de fin de formation",
  "Espace pédagogique individuel BeWork",
  "Supports et ressources pédagogiques",
  "Évaluation des acquis par cas pratique",
  "Questionnaire de positionnement avant la formation",
  "Possibilité de prise en charge OPCO selon éligibilité",
] as const;

/** Mentions administratives — fidèles aux programmes officiels. */
export const FORMATION_ORGANISM = {
  brand: "BeWork",
  legalName: "OFC Création d’Entreprise — SASU",
  relation: "BeWork est une marque d’OFC Création d’Entreprise.",
  siret: "905 244 281 00010",
  nda: "11788515078",
  region: "Île-de-France",
  vatNote: "Exonéré de TVA — art. 261-4-4°-a du CGI",
  ndaDisclaimer: "Cet enregistrement ne vaut pas agrément de l’État.",
  qualiopi: "Certifié Qualiopi — Actions de formation",
  pedagogicalLead: "Laure OLIVIÉ",
  contactEmail: "laureolivie@yahoo.fr",
  contactPhone: "06 95 66 18 18",
  schedule: "9h00–12h30 / 13h30–17h00",
} as const;

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
