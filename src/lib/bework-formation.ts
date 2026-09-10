/**
 * Positionnement BeWork — formation pratique « créer avec l’IA ».
 * Aucun outil, stack, prompt ou workflow technique détaillé ici.
 */

export const BEWORK_SESSION_PRICE_EUR = 200;

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
] as const;

export type DemoInteractiveSlug = (typeof DEMO_INTERACTIVE_SLUGS)[number];

export const FORMATION_DAY_STEPS = [
  {
    title: "Comprendre",
    text: "Découvrez ce qu’il est réellement possible de construire aujourd’hui avec l’IA, mais aussi ses limites.",
  },
  {
    title: "Préparer",
    text: "Nous vous aidons à mettre en place votre environnement pour pouvoir commencer à créer.",
  },
  {
    title: "Construire",
    text: "Vous découvrez concrètement comment transformer une idée en projet numérique.",
  },
  {
    title: "Améliorer",
    text: "Vous apprenez à faire évoluer un résultat, corriger les problèmes et préciser vos demandes.",
  },
  {
    title: "Mettre en pratique",
    text: "Vous travaillez sur des exemples concrets et commencez à réfléchir à vos propres besoins.",
  },
  {
    title: "Repartir avec une méthode",
    text: "L’objectif est que vous puissiez continuer à expérimenter et créer après la formation.",
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
  "Une journée complète de formation pratique",
  "Accompagnement en petit groupe",
  "Installation et prise en main de l’environnement nécessaire",
  "Démonstrations concrètes",
  "Exercices pratiques",
  "Méthode de travail réutilisable",
  "Accompagnement pendant la journée",
] as const;

export const FORMATION_FAQ = [
  {
    q: "Faut-il savoir coder ?",
    a: "Non. La formation est conçue pour des personnes qui ne viennent pas du développement informatique.",
  },
  {
    q: "Est-ce que je serai développeur après une journée ?",
    a: "Non. Ce n’est pas la promesse de BeWork. Vous découvrirez une méthode de création assistée par l’intelligence artificielle et apprendrez à construire progressivement vos propres projets.",
  },
  {
    q: "Dois-je venir avec mon ordinateur ?",
    a: "Oui. La journée est pratique et doit idéalement être suivie depuis votre propre ordinateur.",
  },
  {
    q: "Peut-on vraiment créer une application sans savoir programmer ?",
    a: "Il est aujourd’hui possible d’aller très loin grâce à l’intelligence artificielle. La formation vous apprend surtout à structurer votre besoin, guider la création, tester le résultat et comprendre les limites.",
  },
  {
    q: "Puis-je venir avec mon propre projet ?",
    a: "Oui. Les projets personnels et professionnels permettent justement de mieux comprendre comment appliquer la méthode à un besoin concret.",
  },
  {
    q: "La formation est-elle uniquement destinée aux entreprises ?",
    a: "Non. Entrepreneurs, indépendants, salariés, artisans, dirigeants et porteurs de projets peuvent participer.",
  },
  {
    q: "Quels outils utilisez-vous ?",
    a: "Nous utilisons pendant la journée un environnement de création assisté par intelligence artificielle sélectionné pour permettre aux débutants de travailler efficacement. Les outils et notre méthode sont présentés directement aux participants pendant la formation.",
  },
  {
    q: "Pourquoi ne présentez-vous pas toute la méthode sur le site ?",
    a: "Parce que BeWork est avant tout une formation pratique. Le site vous montre ce qu’il est possible de réaliser ; la journée vous apprend comment y parvenir.",
  },
] as const;

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
