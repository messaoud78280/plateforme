/**
 * Contenu éditorial BeWork — prestations BTP (site commercial).
 * Source unique pour navigation, pages, SEO et formulaire de devis.
 */

export const BEWORK_BTP_SIGNATURE =
  "CONDUITE DE TRAVAUX • PILOTAGE TCE • INGÉNIERIE OPÉRATIONNELLE";

export const BEWORK_BTP_VALUE_PROPOSITION =
  "BeWork accompagne les entreprises du BTP avec des prestations de conduite de travaux, d’encadrement opérationnel et de coordination TCE. Nos professionnels s’appuient sur des méthodes éprouvées et sur nos propres outils numériques et IA pour organiser, suivre et optimiser vos opérations.";

export const BEWORK_BTP_SLOGAN =
  "Des professionnels pour vos chantiers. Des méthodes pour optimiser vos opérations. Une plateforme collaborative et des outils IA pour mieux piloter.";

export const BEWORK_BTP_BRAND_SHORT =
  "Votre partenaire en conduite de travaux et pilotage TCE";

export const BEWORK_BTP_HERO_SUBTITLE = BEWORK_BTP_VALUE_PROPOSITION;

export const BTP_CTA_EXPERTISES = {
  href: "/expertises-tce",
  label: "Découvrir nos expertises",
} as const;

/** Navigation principale site commercial BTP. */
export const BTP_NAV_ITEMS = [
  { href: "/conduite-de-travaux", label: "Conduite de travaux" },
  { href: "/expertises-tce", label: "Expertises TCE" },
  { href: "/pilotage-chantier", label: "Pilotage chantier" },
  { href: "/marches-publics-prives", label: "Marchés" },
  { href: "/plateforme-ia", label: "Plateforme & IA" },
  { href: "/notre-methode", label: "Méthode" },
  { href: "/a-propos", label: "À propos" },
] as const;

export const BTP_CTA_PRIMARY = {
  href: "/demande-de-devis",
  label: "Demander un devis",
} as const;

export const BTP_CTA_CONDUCTEUR = {
  href: "/demande-de-devis?besoin=conducteur_travaux",
  label: "Demander un conducteur de travaux",
} as const;

export type BtpServiceNeedId =
  | "conducteur_travaux"
  | "chef_chantier"
  | "direction_travaux"
  | "pilotage_tce"
  | "gestion_chantier"
  | "audit_redressement"
  | "assistance_marches_publics"
  | "assistance_marches_prives"
  | "etudes_prix"
  | "gestion_financiere"
  | "autre";

export const BTP_SERVICE_NEED_OPTIONS: Array<{
  value: BtpServiceNeedId;
  label: string;
}> = [
  { value: "conducteur_travaux", label: "Conducteur de travaux" },
  { value: "chef_chantier", label: "Chef de chantier" },
  { value: "direction_travaux", label: "Directeur de travaux" },
  { value: "pilotage_tce", label: "Pilotage TCE" },
  { value: "gestion_chantier", label: "Gestion de chantier" },
  { value: "audit_redressement", label: "Audit de chantier" },
  { value: "assistance_marches_publics", label: "Assistance marchés publics" },
  { value: "assistance_marches_prives", label: "Assistance marchés privés" },
  { value: "etudes_prix", label: "Études de prix" },
  { value: "gestion_financiere", label: "Gestion financière de chantier" },
  { value: "autre", label: "Autre" },
];

export type BtpOperationTypeId =
  | "batiment_neuf"
  | "renovation"
  | "gros_oeuvre"
  | "second_oeuvre"
  | "tce"
  | "vrd"
  | "genie_civil"
  | "amenagements_exterieurs"
  | "eclairage_reseaux"
  | "autre";

export const BTP_OPERATION_TYPE_OPTIONS: Array<{
  value: BtpOperationTypeId;
  label: string;
}> = [
  { value: "batiment_neuf", label: "Bâtiment neuf" },
  { value: "renovation", label: "Rénovation" },
  { value: "gros_oeuvre", label: "Gros œuvre" },
  { value: "second_oeuvre", label: "Second œuvre" },
  { value: "tce", label: "Travaux tous corps d’état" },
  { value: "vrd", label: "VRD" },
  { value: "genie_civil", label: "Génie civil" },
  { value: "amenagements_exterieurs", label: "Aménagements extérieurs" },
  { value: "eclairage_reseaux", label: "Éclairage public / réseaux" },
  { value: "autre", label: "Autre" },
];

export type BtpMissionPhaseId =
  | "etude"
  | "preparation"
  | "execution"
  | "reception"
  | "autre";

export const BTP_MISSION_PHASE_OPTIONS: Array<{
  value: BtpMissionPhaseId;
  label: string;
}> = [
  { value: "etude", label: "Étude" },
  { value: "preparation", label: "Préparation" },
  { value: "execution", label: "Exécution" },
  { value: "reception", label: "Réception" },
  { value: "autre", label: "Autre / à préciser" },
];

export type BtpMissionDurationId = "ponctuelle" | "temporaire" | "complete";

export const BTP_MISSION_DURATION_OPTIONS: Array<{
  value: BtpMissionDurationId;
  label: string;
  hint: string;
}> = [
  {
    value: "ponctuelle",
    label: "Mission ponctuelle",
    hint: "Intervention pour un besoin spécifique.",
  },
  {
    value: "temporaire",
    label: "Mission temporaire",
    hint: "Accompagnement sur une phase déterminée.",
  },
  {
    value: "complete",
    label: "Mission complète",
    hint: "Prise en charge d’un périmètre de conduite de travaux.",
  },
];

export const BTP_EXPERTISE_FAMILIES = [
  {
    id: "gros-oeuvre",
    title: "Gros œuvre et structure",
    items: [
      "Terrassements",
      "Fondations",
      "Maçonnerie",
      "Béton armé",
      "Ouvrages structurels",
      "Dallages",
      "Reprises et transformations structurelles",
    ],
  },
  {
    id: "vrd",
    title: "VRD et génie civil",
    items: [
      "Réseaux d’assainissement EU/EP",
      "Réseaux d’eau potable",
      "Réseaux secs",
      "Terrassements généraux",
      "Voiries",
      "Bordures et caniveaux",
      "Pavage et dallage",
      "Aménagements urbains",
      "Plateformes et soutènements",
      "Ouvrages de génie civil",
    ],
  },
  {
    id: "second-oeuvre",
    title: "Second œuvre",
    items: [
      "Cloisons et doublages",
      "Plâtrerie",
      "Isolation",
      "Menuiseries",
      "Revêtements de sols",
      "Peinture",
      "Faux plafonds",
      "Étanchéité et finitions",
    ],
  },
  {
    id: "lots-techniques",
    title: "Lots techniques",
    items: [
      "Électricité CFO/CFA",
      "Éclairage public",
      "Plomberie",
      "CVC",
      "Ventilation",
      "Chauffage",
      "Climatisation",
      "Désenfumage",
      "SSI",
      "GTB/GTC",
    ],
  },
  {
    id: "enveloppe",
    title: "Enveloppe du bâtiment",
    items: [
      "Façades",
      "Couverture",
      "Bardage",
      "Menuiseries extérieures",
      "Étanchéité",
      "Isolation thermique",
    ],
  },
  {
    id: "coordination-tce",
    title: "Coordination TCE",
    items: [
      "Interfaces inter-lots",
      "Synthèse des contraintes",
      "Enchaînement des travaux",
      "Coordination de sous-traitants",
      "Phasage des interventions",
      "Gestion des coactivités",
      "Préparation des réceptions",
      "Suivi des réserves",
    ],
  },
] as const;

export const BTP_METHOD_STEPS = [
  {
    n: "01",
    title: "Comprendre le besoin",
    body: "Recueil du type de chantier, du périmètre technique, de la localisation, des contraintes, du planning, des moyens existants et des objectifs du client.",
  },
  {
    n: "02",
    title: "Définir la mission",
    body: "Analyse de la demande, périmètre, responsabilités, livrables, organisation des échanges, conditions et durée — proposition commerciale sur devis.",
  },
  {
    n: "03",
    title: "Préparer l’intervention",
    body: "Analyse documentaire, prise de connaissance du chantier, priorités, outils de suivi et plan d’action initial.",
  },
  {
    n: "04",
    title: "Piloter les opérations",
    body: "Présence terrain selon contrat, organisation, coordination, contrôles, suivi des moyens et gestion des imprévus.",
  },
  {
    n: "05",
    title: "Analyser et informer",
    body: "Rapports, tableaux de bord, alertes, écarts de coûts et de délais, recommandations et actions correctives.",
  },
  {
    n: "06",
    title: "Clôturer la mission",
    body: "Bilan, suivi des points ouverts, transmission des documents, préconisations et assistance à la réception si incluse.",
  },
] as const;

export const BTP_HOME_PROBLEMS = [
  {
    problem: "Conducteur de travaux indisponible",
    answer: "Mission de conduite de travaux externalisée, ponctuelle ou suivie.",
  },
  {
    problem: "Surcharge d’activité",
    answer: "Renfort opérationnel pour absorber un pic sans désorganiser vos équipes.",
  },
  {
    problem: "Multiplication des chantiers",
    answer: "Pilotage structuré et reporting pour garder la visibilité.",
  },
  {
    problem: "Retards d’exécution",
    answer: "Audit, plan de rattrapage et suivi des actions correctives.",
  },
  {
    problem: "Problèmes d’approvisionnement",
    answer: "Anticipation des besoins et coordination avec le planning.",
  },
  {
    problem: "Coordination insuffisante",
    answer: "Coordination TCE, interfaces inter-lots et phasage des interventions.",
  },
  {
    problem: "Coûts mal maîtrisés",
    answer: "Suivi budgétaire, situations de travaux et analyse des écarts.",
  },
  {
    problem: "Manque de visibilité sur l’avancement",
    answer: "Tableaux de bord, comptes rendus et indicateurs traçables.",
  },
] as const;

export const BTP_FAQ = [
  {
    q: "Peut-on solliciter BeWork pour une mission ponctuelle ?",
    a: "Oui. Les missions peuvent être ponctuelles, temporaires sur une phase, ou complètes sur un périmètre de conduite de travaux. Chaque intervention fait l’objet d’un devis personnalisé.",
  },
  {
    q: "Intervenez-vous sur les chantiers TCE ?",
    a: "Oui. Nous accompagnons la préparation, l’organisation et la coordination des opérations tous corps d’état, dans les limites du périmètre contractuel défini avec vous.",
  },
  {
    q: "Peut-on confier un chantier déjà commencé ?",
    a: "Oui. Nous pouvons intervenir en cours d’exécution, notamment pour un audit, un redressement ou un renfort de pilotage. L’état des lieux initial fait partie de la préparation.",
  },
  {
    q: "Proposez-vous des conducteurs de travaux expérimentés ?",
    a: "Nous commercialisons des prestations de conduite et de pilotage de travaux assurées par des professionnels expérimentés du BTP. Les profils et le niveau de responsabilité sont précisés dans la proposition.",
  },
  {
    q: "Comment sont définies les responsabilités ?",
    a: "Le périmètre, l’autonomie, les pouvoirs de décision, les livrables et les assurances sont définis contractuellement avant démarrage. Nous ne présentons pas ces missions comme du travail temporaire.",
  },
  {
    q: "Comment fonctionne votre plateforme collaborative ?",
    a: "Nos missions s’appuient sur un environnement numérique BeWork pour centraliser l’information, suivre les délais, documenter les décisions et faciliter les échanges. L’accès et les modules exposés dépendent du contrat.",
  },
  {
    q: "L’utilisation de l’IA est-elle incluse dans la prestation ?",
    a: "Lorsque les outils IA sont mobilisés, ils assistent l’analyse, la préparation et le reporting sous contrôle humain. Ils ne remplacent ni le jugement professionnel ni les responsabilités de terrain.",
  },
  {
    q: "Intervenez-vous sur les marchés publics ?",
    a: "Oui, en assistance aux dossiers, études de prix, constitution d’offre et suivi d’exécution, sans garantie d’attribution du marché.",
  },
  {
    q: "Comment obtenons-nous un devis ?",
    a: "Décrivez votre besoin via le formulaire. Nous analysons le périmètre et vous adressons une proposition personnalisée. Aucun tarif public n’est affiché.",
  },
  {
    q: "Quelle est votre zone d’intervention ?",
    a: "Priorité Yvelines et Île-de-France. D’autres zones peuvent être étudiées selon la mission — à confirmer dans le devis.",
  },
] as const;

/** SEO pages cœur commercial. */
export const BTP_SEO_PAGES = {
  home: {
    path: "/",
    title: "Conduite de travaux & pilotage TCE",
    absoluteTitle: "BeWork — Conduite de travaux & pilotage TCE",
    description:
      "Prestations de conduite de travaux, encadrement opérationnel et coordination TCE. Plateforme collaborative et outils IA pour piloter délais, coûts et avancement.",
  },
  conduite: {
    path: "/conduite-de-travaux",
    title: "Conducteurs de travaux externalisés",
    description:
      "Conducteur de travaux, chef de chantier ou direction de travaux externalisée. Missions ponctuelles, temporaires ou complètes — devis personnalisé.",
  },
  expertises: {
    path: "/expertises-tce",
    title: "Expertises TCE et métiers du BTP",
    description:
      "Vision globale des travaux tous corps d’état : gros œuvre, VRD, second œuvre, lots techniques, enveloppe et coordination inter-lots.",
  },
  pilotage: {
    path: "/pilotage-chantier",
    title: "Pilotage et gestion de chantier",
    description:
      "Préparation, planification, production, suivi financier, qualité et reporting pour organiser et maîtriser vos chantiers.",
  },
  marches: {
    path: "/marches-publics-prives",
    title: "Marchés publics et privés",
    description:
      "Assistance aux appels d’offres, études de prix, constitution d’offre et suivi d’exécution de marché BTP.",
  },
  plateforme: {
    path: "/plateforme-ia",
    title: "Plateforme collaborative et outils IA",
    description:
      "Environnement numérique BeWork et outils IA d’aide à l’analyse, à la préparation et au suivi de chantier, sous contrôle professionnel.",
  },
  methode: {
    path: "/notre-methode",
    title: "Notre méthode d’intervention",
    description:
      "Comment se déroule une mission BeWork : besoin, étude, proposition, pilotage et visibilité — livrables et transparence.",
  },
  aPropos: {
    path: "/a-propos",
    title: "À propos de BeWork",
    description:
      "BeWork associe expertise de terrain BTP, méthodologie de gestion et outils numériques pour des prestations de conduite de travaux.",
  },
  devis: {
    path: "/demande-de-devis",
    title: "Demande de devis",
    description:
      "Décrivez votre chantier et le type de mission. BeWork étudie votre besoin et vous propose une intervention adaptée.",
  },
  contact: {
    path: "/contact",
    title: "Contact",
    description:
      "Contactez BeWork pour une prestation de conduite de travaux, de pilotage de chantier ou d’assistance aux marchés.",
  },
} as const;

export function isBtpServiceNeedId(v: string): v is BtpServiceNeedId {
  return BTP_SERVICE_NEED_OPTIONS.some((o) => o.value === v);
}

export function labelBtpServiceNeed(value: string): string {
  return BTP_SERVICE_NEED_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/** Compétences fondateur — expérience personnelle, distincte du portefeuille BeWork. */
export const BTP_FOUNDER_COMPETENCES = [
  "Conduite et organisation de chantiers",
  "Terrassements et VRD",
  "Maçonnerie et gros œuvre",
  "Travaux d’aménagement extérieur",
  "Réseaux enterrés EU/EP et AEP",
  "Génie civil et travaux urbains",
  "Implantation et contrôle altimétrique",
  "Lecture et analyse de plans",
  "Métrés et quantitatifs",
  "Planification des équipes",
  "Gestion des matériels et approvisionnements",
  "Encadrement opérationnel",
  "Préparation et suivi des marchés publics et privés",
  "Études de prix",
  "Suivi administratif et financier",
  "Méthodologies d’exécution",
  "Gestion des interfaces TCE",
] as const;

export const BTP_TERRAIN_CONSTRAINTS = [
  "Retards liés aux approvisionnements",
  "Problèmes de coordination",
  "Plans incomplets",
  "Difficultés de phasage",
  "Défauts de préparation",
  "Pertes de rendement",
  "Dépassements budgétaires",
  "Problèmes d’organisation des équipes",
] as const;

/** Modules plateforme — statut vérifié côté produit (annonçables). */
export const BTP_PLATFORM_MODULES = [
  {
    id: "dashboard",
    title: "Tableau de bord",
    status: "disponible" as const,
    items: [
      "Avancement général",
      "État du planning",
      "Actions prioritaires",
      "Points bloquants",
      "Suivi financier",
      "Alertes",
    ],
  },
  {
    id: "planning",
    title: "Planning collaboratif",
    status: "disponible" as const,
    items: [
      "Planning général",
      "Phasage des interventions",
      "Répartition des tâches",
      "Affectations",
      "Suivi d’avancement",
    ],
  },
  {
    id: "visites",
    title: "Visites et métrés",
    status: "disponible" as const,
    items: [
      "Relevé terrain",
      "Quantitatif",
      "Observations",
      "Photos",
      "Préparation du devis",
    ],
  },
  {
    id: "devis",
    title: "Devis et études",
    status: "disponible" as const,
    items: [
      "Bibliothèque d’ouvrages",
      "Quantités",
      "Déboursés",
      "Études de prix",
      "Devis",
    ],
  },
  {
    id: "appro",
    title: "Approvisionnements",
    status: "disponible" as const,
    items: [
      "Besoins matériels",
      "Commandes",
      "Suivi des livraisons",
      "Lien avec le planning",
    ],
  },
  {
    id: "dossier",
    title: "Dossier de chantier",
    status: "disponible" as const,
    items: ["Plans", "Photos", "Comptes rendus", "Documents", "Observations"],
  },
  {
    id: "reporting",
    title: "Reporting",
    status: "disponible" as const,
    items: [
      "Comptes rendus structurés",
      "Tableaux de bord",
      "Synthèses d’exploitation",
    ],
  },
] as const;

export const BTP_IA_DOMAINS = [
  {
    title: "Analyse des documents",
    body: "Assistance à l’analyse de DCE, CCTP, CCAP, pièces techniques et documents contractuels, dans les limites des formats pris en charge.",
  },
  {
    title: "Préparation de chantier",
    body: "Aide à structurer méthodologies, listes de tâches, organisation des moyens et identification des contraintes.",
  },
  {
    title: "Rapports assistés",
    body: "Assistance à la rédaction de comptes rendus, rapports d’avancement, synthèses et classement d’observations.",
  },
  {
    title: "Analyse financière",
    body: "Lecture assistée des données de coûts, écarts et points à surveiller lorsque les données sont disponibles.",
  },
  {
    title: "Planning et coordination",
    body: "Aide à la planification, analyse des tâches, suivi des échéances et préparation des actions.",
  },
  {
    title: "Assistance aux marchés",
    body: "Analyse de pièces, structuration d’études, aide au mémoire technique et au chiffrage — sans garantie d’attribution.",
  },
] as const;

export const BTP_COMMERCIAL_MISSION_STEPS = [
  {
    n: "01",
    title: "Vous présentez votre besoin",
    body: "Type de chantier, profil recherché, durée prévisionnelle, contraintes et objectifs.",
  },
  {
    n: "02",
    title: "Nous étudions votre opération",
    body: "Pièces disponibles, compétences nécessaires, contraintes techniques, périmètre et responsabilités.",
  },
  {
    n: "03",
    title: "Nous proposons une intervention adaptée",
    body: "Contenu de mission, conditions, livrables, durée ou étapes, montant du devis.",
  },
  {
    n: "04",
    title: "Nous pilotons et suivons les opérations",
    body: "Organisation, coordination, planning, avancement, analyse financière, reporting et outils BeWork selon contrat.",
  },
  {
    n: "05",
    title: "Vous disposez d’une visibilité sur votre chantier",
    body: "Comptes rendus, avancement, alertes, actions en attente, écarts et préconisations prévus au contrat.",
  },
] as const;

export const BTP_USE_CASES = [
  {
    title: "Conducteur de travaux indisponible",
    context:
      "Une PME doit maintenir le pilotage d’un chantier alors que son conducteur de travaux est indisponible.",
    solution:
      "Mission temporaire de conduite de travaux avec organisation, coordination et reporting.",
    besoin: "conducteur_travaux" as BtpServiceNeedId,
  },
  {
    title: "Chantier TCE en retard",
    context:
      "Plusieurs entreprises interviennent simultanément et rencontrent des difficultés de coordination.",
    solution:
      "Analyse du planning, coordination des interfaces, identification des points bloquants et plan d’action.",
    besoin: "pilotage_tce" as BtpServiceNeedId,
  },
  {
    title: "Manque de visibilité financière",
    context:
      "Une entreprise ne dispose pas d’indicateurs suffisamment précis sur les coûts de son chantier.",
    solution: "Suivi des dépenses, quantités, heures, rendements et écarts.",
    besoin: "gestion_financiere" as BtpServiceNeedId,
  },
  {
    title: "Réponse à un marché public",
    context: "Une entreprise souhaite répondre à une consultation BTP.",
    solution:
      "Analyse du DCE, étude de prix, mémoire technique, méthodologie et préparation de l’offre.",
    besoin: "assistance_marches_publics" as BtpServiceNeedId,
  },
] as const;

export const BTP_COMMERCIAL_BENEFITS = [
  {
    title: "Organisation",
    body: "Des opérations préparées, structurées et suivies.",
  },
  {
    title: "Délais",
    body: "Anticiper les difficultés pour limiter les interruptions et les retards évitables.",
  },
  {
    title: "Coûts",
    body: "Disposer d’une meilleure visibilité sur les dépenses, les quantités et les écarts.",
  },
  {
    title: "Coordination",
    body: "Faciliter les échanges entre les différents intervenants.",
  },
  {
    title: "Information",
    body: "Centraliser les documents, décisions et comptes rendus.",
  },
  {
    title: "Technologie",
    body: "Associer l’expérience humaine à des outils numériques conçus pour les réalités du chantier.",
  },
] as const;
