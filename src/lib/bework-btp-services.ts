/**
 * Contenu éditorial BeWork — prestations BTP (site commercial).
 * Source unique pour navigation, pages, SEO et formulaire de devis.
 */

export const BEWORK_BTP_SIGNATURE =
  "CONDUITE DE TRAVAUX • ÉQUIPES TP/VRD EN RÉGIE • BTP";

export const BEWORK_BTP_VALUE_PROPOSITION =
  "BeWork accompagne les entreprises du BTP avec deux prestations principales : la conduite de travaux externalisée pour piloter les chantiers, et des équipes opérationnelles TP/VRD en régie pour renforcer les moyens humains. L’ingénierie, les marchés et la formation professionnelle BTP complètent l’offre. Les outils IA et la plateforme collaborative sont utilisés en interne.";

export const BEWORK_BTP_SLOGAN =
  "BeWork — Conduite de travaux externalisée et équipes opérationnelles BTP en régie.";

export const BEWORK_BTP_BRAND_SHORT =
  "Conduite de travaux externalisée et équipes TP/VRD en régie";

export const BEWORK_BTP_HERO_SUBTITLE =
  "Nous accompagnons les entreprises du BTP dans le pilotage de leurs chantiers et renforçons leurs équipes avec des professionnels expérimentés en travaux publics, VRD et aménagements extérieurs.";

export const BEWORK_BTP_COMMERCIAL_PROPOSITION =
  "Conduite de travaux externalisée et équipes opérationnelles TP/VRD en régie pour les entreprises du BTP. Missions contractualisées — Yvelines et Île-de-France. Les outils numériques et l’IA renforcent le pilotage de nos intervenants.";

export const BTP_CTA_EXPERTISES = {
  href: "/expertises-tce",
  label: "Découvrir nos expertises",
} as const;

export const BTP_CTA_PRESTATIONS = {
  href: "#nos-prestations",
  label: "Découvrir nos prestations",
} as const;

export const BTP_CTA_METHOD = {
  href: "/notre-methode",
  label: "Découvrir notre méthode",
} as const;

export type BtpNavChild = { href: string; label: string };

export type BtpNavItem = {
  href: string;
  label: string;
  children?: readonly BtpNavChild[];
};

/** Navigation principale — piliers conduite + équipes, compléments ingénierie/formation. */
export const BTP_NAV_ITEMS: readonly BtpNavItem[] = [
  { href: "/conduite-de-travaux", label: "Conduite de travaux" },
  { href: "/equipes-tp-vrd", label: "Équipes TP/VRD" },
  {
    href: "/ingenierie-et-marches-btp",
    label: "Ingénierie & marchés",
    children: [
      {
        href: "/ingenierie-et-marches-btp",
        label: "Vue d’ensemble ingénierie",
      },
      {
        href: "/marches-publics-prives",
        label: "Marchés publics et privés",
      },
      {
        href: "/expertises-tce",
        label: "Expertises TCE",
      },
      {
        href: "/accompagnement-technique-chantier",
        label: "Accompagnement technique",
      },
    ],
  },
  {
    href: "/formation-professionnelle-btp",
    label: "Formation",
    children: [
      {
        href: "/formation-professionnelle-btp",
        label: "Formation professionnelle BTP",
      },
      {
        href: "/formation-conducteur-de-travaux",
        label: "Formation conducteur de travaux",
      },
      {
        href: "/formation-chef-de-chantier",
        label: "Formation chef de chantier",
      },
      {
        href: "/organisme-formation",
        label: "Organisme de formation",
      },
    ],
  },
  { href: "/notre-methode", label: "Notre méthode" },
  { href: "/a-propos", label: "À propos" },
] as const;

/** Liens secondaires (footer). */
export const BTP_SERVICE_LINKS = [
  { href: "/conduite-de-travaux", label: "Conduite de travaux" },
  { href: "/equipes-tp-vrd", label: "Équipes TP/VRD en régie" },
  { href: "/ingenierie-et-marches-btp", label: "Ingénierie & marchés" },
  { href: "/formation-professionnelle-btp", label: "Formation BTP" },
  { href: "/demande-de-devis?besoin=conducteur_travaux", label: "Demander un devis" },
] as const;

export const BTP_CTA_PRIMARY = {
  href: "/demande-de-devis?besoin=conducteur_travaux",
  label: "Parler de votre chantier",
} as const;

export const BTP_CTA_PARLER_CHANTIER = {
  href: "/demande-de-devis",
  label: "Parler de votre chantier",
} as const;

export const BTP_CTA_MISSION = {
  href: "/demande-de-devis?besoin=conducteur_travaux",
  label: "Demander un conducteur de travaux",
} as const;

export const BTP_CTA_CONDUCTEUR = {
  href: "/demande-de-devis?besoin=conducteur_travaux",
  label: "Demander un conducteur de travaux",
} as const;

export const BTP_CTA_EQUIPE_TP_VRD = {
  href: "/demande-de-devis?besoin=equipe_tp_vrd",
  label: "Demander une équipe TP/VRD",
} as const;

export const BTP_CTA_ACCOMPAGNEMENT = {
  href: "/demande-de-devis?besoin=accompagnement_technique",
  label: "Demander un accompagnement technique",
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
  | "equipe_tp_vrd"
  | "chef_equipe_tp_vrd"
  | "macon_vrd"
  | "accompagnement_technique"
  | "assistance_modes_operatoires"
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
  { value: "equipe_tp_vrd", label: "Équipe opérationnelle TP/VRD" },
  { value: "chef_equipe_tp_vrd", label: "Chef d’équipe TP/VRD" },
  { value: "macon_vrd", label: "Maçon VRD" },
  {
    value: "accompagnement_technique",
    label: "Accompagnement technique des compagnons",
  },
  {
    value: "assistance_modes_operatoires",
    label: "Assistance aux modes opératoires",
  },
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
    problem: "Vous manquez de conducteurs de travaux",
    answer: "Intervention externalisée sur un périmètre défini — préparation, coordination et reporting.",
    href: "/demande-de-devis?besoin=conducteur_travaux",
  },
  {
    problem: "Vos équipes sont surchargées",
    answer: "Renfort opérationnel et organisation du travail pour absorber le pic d’activité.",
    href: "/demande-de-devis?besoin=gestion_chantier",
  },
  {
    problem: "Vos chantiers prennent du retard",
    answer: "Diagnostic, coordination et plan de rattrapage — sans promesse de délai garanti.",
    href: "/demande-de-devis?besoin=audit_redressement",
  },
  {
    problem: "Vos coûts dérivent",
    answer: "Suivi des dépenses, quantités et rendements pour mieux voir les écarts.",
    href: "/demande-de-devis?besoin=gestion_financiere",
  },
  {
    problem: "Les intervenants communiquent mal",
    answer: "Coordination TCE et centralisation de l’information entre les lots.",
    href: "/demande-de-devis?besoin=pilotage_tce",
  },
  {
    problem: "Vous manquez de visibilité",
    answer: "Reporting, tableaux de bord et suivi des actions prioritaires.",
    href: "/demande-de-devis?besoin=pilotage_tce",
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
  {
    q: "Proposez-vous des équipes TP/VRD ?",
    a: "Oui. BeWork peut proposer des prestations opérationnelles TP/VRD (chef d’équipe, maçon VRD, équipe selon disponibilités réelles), en intervention ponctuelle, en régie ou en sous-traitance définie. Aucun effectif n’est garanti avant devis.",
  },
  {
    q: "Qu’est-ce que l’accompagnement technique des compagnons ?",
    a: "Il s’agit d’un accompagnement terrain pour transmettre les modes opératoires et accompagner l’exécution. Ce n’est pas une formation réglementaire, une habilitation ou une certification.",
  },
] as const;

/** SEO pages cœur commercial. */
export const BTP_SEO_PAGES = {
  home: {
    path: "/",
    title: "Conduite de travaux & équipes TP/VRD en régie",
    absoluteTitle:
      "BeWork — Conduite de travaux externalisée et équipes TP/VRD en régie",
    description:
      "Conducteur de travaux externalisé et équipes TP/VRD en régie pour les entreprises du BTP. Renforts opérationnels — Yvelines et Île-de-France.",
  },
  conduite: {
    path: "/conduite-de-travaux",
    title: "Conduite de travaux externalisée",
    description:
      "Conducteur de travaux externalisé, chef de chantier en régie et pilotage TCE. Mission ponctuelle ou complète — Yvelines et Île-de-France.",
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
      "Préparation, planification, production, suivi financier, qualité et reporting — profondeur de la conduite de travaux BeWork.",
  },
  marches: {
    path: "/marches-publics-prives",
    title: "Marchés publics et privés",
    description:
      "Assistance aux appels d’offres, analyse DCE, études de prix, mémoires techniques et suivi contractuel BTP.",
  },
  ingenierie: {
    path: "/ingenierie-et-marches-btp",
    title: "Ingénierie et marchés BTP",
    description:
      "Études techniques, métrés, chiffrage, analyse DCE/CCTP, réponses AO et assistance technique — complément aux prestations de conduite et d’équipes.",
  },
  equipesTpVrd: {
    path: "/equipes-tp-vrd",
    title: "Équipes TP/VRD en régie",
    description:
      "Chefs d’équipe et maçons VRD en régie pour renforcer vos chantiers TP, voirie, réseaux et aménagements extérieurs — missions contractualisées sur devis.",
  },
  accompagnementTechnique: {
    path: "/accompagnement-technique-chantier",
    title: "Accompagnement technique des compagnons",
    description:
      "Accompagnement terrain pour transmettre les modes opératoires et accompagner vos compagnons dans la qualité d’exécution.",
  },
  plateforme: {
    path: "/plateforme-ia",
    title: "Méthode & outils de pilotage de chantier",
    description:
      "Nos intervenants s’appuient sur une plateforme collaborative et des outils d’IA internes pour préparer, suivre et documenter les missions de chantier.",
  },
  methode: {
    path: "/notre-methode",
    title: "Notre méthode d’intervention",
    description:
      "Comment se déroule une mission BeWork : besoin, étude, proposition, pilotage et reporting — conduite de travaux et équipes en régie.",
  },
  aPropos: {
    path: "/a-propos",
    title: "À propos de BeWork",
    description:
      "BeWork propose aux entreprises du BTP la conduite de travaux externalisée et des équipes TP/VRD en régie, avec ingénierie et formation en complément.",
  },
  devis: {
    path: "/demande-de-devis",
    title: "Demande de devis BTP",
    description:
      "Demandez un conducteur de travaux, une équipe TP/VRD en régie, une assistance marchés ou un accompagnement technique. Étude du besoin — sur devis.",
  },
  contact: {
    path: "/contact",
    title: "Contact",
    description:
      "Contactez BeWork pour une prestation de conduite de travaux, d’équipe TP/VRD en régie, d’ingénierie ou de formation BTP.",
  },
  formationHub: {
    path: "/formation-professionnelle-btp",
    title: "Formation professionnelle BTP",
    description:
      "Formations pratiques sur chantier pour conducteurs, chefs de chantier, chefs d’équipe TP/VRD et compagnons — offre en développement, sur devis.",
  },
  formationConducteur: {
    path: "/formation-conducteur-de-travaux",
    title: "Formation conducteur de travaux",
    description:
      "Formation pratique orientée conduite de travaux et pilotage de chantier pour les salariés du BTP — sur devis, sans certification inventée.",
  },
  formationChefChantier: {
    path: "/formation-chef-de-chantier",
    title: "Formation chef de chantier",
    description:
      "Formation terrain pour chefs de chantier : organisation, exécution, contrôle qualité et coordination — Yvelines et Île-de-France.",
  },
  formationChefEquipe: {
    path: "/formation-chef-equipe-tp-vrd",
    title: "Formation chef d’équipe TP/VRD",
    description:
      "Formation pratique pour chefs d’équipe TP/VRD : organisation quotidienne, implantation, contrôle d’exécution et modes opératoires.",
  },
  formationCompagnons: {
    path: "/formation-compagnons-chantier",
    title: "Formation des compagnons sur chantier",
    description:
      "Accompagnement et formation des compagnons directement sur les ouvrages : gestes professionnels, exigences techniques et qualité d’exécution.",
  },
  formationModes: {
    path: "/formation-modes-operatoires-chantier",
    title: "Formation modes opératoires chantier",
    description:
      "Transmission des modes opératoires et exigences techniques des ouvrages aux équipes de production — formation pratique sur chantier.",
  },
  organismeFormation: {
    path: "/organisme-formation",
    title: "Organisme de formation BeWork",
    description:
      "Présentation de l’activité formation BeWork pour les entreprises du BTP. Aucune certification Qualiopi ni éligibilité CPF affirmée sans vérification.",
  },
} as const;

/** Quatre pôles commerciaux — page d’accueil. */
export const BTP_HOME_POLES = [
  {
    id: "conduite",
    title: "Conduite de travaux externalisée",
    body: "Conducteur, chef de chantier et pilotage pour organiser, coordonner et suivre vos opérations.",
    href: "/demande-de-devis?besoin=conducteur_travaux",
    cta: "Demander un conducteur de travaux",
    pageHref: "/conduite-de-travaux",
    imageSrc: "/marketing/bework-pole-conduite-travaux.jpg",
    imageAlt:
      "Conducteur de travaux sur chantier avec plans — photo d’ambiance illustrative",
  },
  {
    id: "equipes",
    title: "Équipes TP/VRD en régie",
    body: "Chefs d’équipe et maçons VRD pour renforcer vos moyens humains sur travaux publics et aménagements.",
    href: "/demande-de-devis?besoin=equipe_tp_vrd",
    cta: "Demander une équipe TP/VRD",
    pageHref: "/equipes-tp-vrd",
    imageSrc: "/marketing/bework-pole-equipes-tp-vrd.jpg",
    imageAlt:
      "Maçon VRD posant des pavés — photo d’ambiance illustrative",
  },
  {
    id: "accompagnement",
    title: "Accompagnement technique",
    body: "Transmission des modes opératoires et accompagnement des compagnons sur la qualité d’exécution.",
    href: "/demande-de-devis?besoin=accompagnement_technique",
    cta: "Accompagner mes équipes",
    pageHref: "/accompagnement-technique-chantier",
    imageSrc: "/marketing/bework-pole-accompagnement.jpg",
    imageAlt:
      "Accompagnement technique sur chantier — photo d’ambiance illustrative",
  },
  {
    id: "marches",
    title: "Ingénierie & marchés",
    body: "Études, métrés, analyse DCE et assistance aux appels d’offres publics et privés.",
    href: "/demande-de-devis?besoin=assistance_marches_publics",
    cta: "Confier une étude",
    pageHref: "/ingenierie-et-marches-btp",
    imageSrc: "/marketing/bework-pole-etudes-marches.jpg",
    imageAlt:
      "Étude de plans et dossiers de marché — photo d’ambiance illustrative",
  },
] as const;

/** Pages formation — silo SEO (activation commerciale progressive). */
export const BTP_FORMATION_PAGES = [
  {
    path: "/formation-professionnelle-btp",
    title: "Formation professionnelle BTP",
    summary:
      "Formations pratiques adaptées aux ouvrages, méthodes d’exécution et exigences des entreprises.",
  },
  {
    path: "/formation-conducteur-de-travaux",
    title: "Formation conducteur de travaux",
    summary:
      "Pilotage, organisation, coordination et suivi de chantier pour les salariés du BTP.",
  },
  {
    path: "/formation-chef-de-chantier",
    title: "Formation chef de chantier",
    summary:
      "Organisation quotidienne, exécution, contrôles et interfaces avec les lots.",
  },
  {
    path: "/formation-chef-equipe-tp-vrd",
    title: "Formation chef d’équipe TP/VRD",
    summary:
      "Organisation d’équipe, implantation, production et contrôle d’exécution VRD.",
  },
  {
    path: "/formation-compagnons-chantier",
    title: "Formation des compagnons sur chantier",
    summary:
      "Gestes professionnels et exigences techniques directement sur l’ouvrage.",
  },
  {
    path: "/formation-modes-operatoires-chantier",
    title: "Formation modes opératoires",
    summary:
      "Transmission des modes opératoires et des points de vigilance techniques.",
  },
] as const;

export const BTP_EQUIPE_TP_VRD_PROFILES = [
  {
    title: "Chef d’équipe TP/VRD",
    skills: [
      "Organisation quotidienne",
      "Répartition des travaux",
      "Lecture de plans",
      "Implantation",
      "Contrôle altimétrique",
      "Coordination des compagnons",
      "Gestion du matériel",
      "Suivi de production",
      "Contrôle d’exécution",
      "Application des modes opératoires",
    ],
    besoin: "chef_equipe_tp_vrd" as BtpServiceNeedId,
    imageSrc: "/marketing/bework-hero-equipes-tp-vrd.jpg",
    imageAlt:
      "Chef d’équipe TP/VRD sur travaux de bordures — photo d’ambiance illustrative",
  },
  {
    title: "Maçon VRD",
    skills: [
      "Pose de bordures",
      "Pose de caniveaux",
      "Pose de pavés",
      "Pose de dalles",
      "Travaux de maçonnerie urbaine",
      "Regards et ouvrages annexes",
      "Petits ouvrages béton",
      "Réglage des supports",
      "Réalisation de finitions",
      "Reprises de travaux",
    ],
    besoin: "macon_vrd" as BtpServiceNeedId,
    imageSrc: "/marketing/bework-pole-equipes-tp-vrd.jpg",
    imageAlt: "Maçon VRD en pose de pavés — photo d’ambiance illustrative",
  },
] as const;

export const BTP_EQUIPE_TP_VRD_DOMAINES = [
  "Voiries et aménagements urbains",
  "Bordures et caniveaux",
  "Pavage et dallage",
  "Réseaux humides EU/EP/AEP",
  "Terrassements et préparation des supports",
  "Ouvrages béton et maçonnerie VRD",
  "Travaux de finition et reprises",
] as const;

export const BTP_EQUIPE_TP_VRD_MODALITES = [
  {
    title: "Intervention ponctuelle",
    body: "Réalisation d’un périmètre de travaux défini.",
  },
  {
    title: "Prestation en régie",
    body: "Intervention avec suivi du temps réellement consacré aux travaux, dans le cadre d’un contrat de prestation précisant les responsabilités et l’organisation.",
  },
  {
    title: "Sous-traitance de travaux",
    body: "Réalisation de travaux spécifiés avec moyens et obligations contractuelles définis.",
  },
  {
    title: "Intervenants indépendants",
    body: "Possibilité de mobiliser des professionnels autonomes selon leur spécialité et leur disponibilité, sous réserve du respect des règles applicables.",
  },
] as const;

export const BTP_ACCOMPAGNEMENT_OBJECTIFS = [
  "Améliorer la compréhension des plans",
  "Expliquer les exigences techniques",
  "Définir les étapes de réalisation",
  "Transmettre les gestes professionnels",
  "Limiter les erreurs d’exécution évitables",
  "Améliorer les méthodes de travail",
  "Renforcer l’autonomie des compagnons",
  "Favoriser la qualité des ouvrages",
  "Contribuer à l’amélioration des rendements",
] as const;

export const BTP_ACCOMPAGNEMENT_STEPS = [
  {
    n: "01",
    title: "Analyse de l’ouvrage",
    items: [
      "Étude des plans",
      "CCTP",
      "Prescriptions techniques",
      "Contraintes d’exécution",
      "Tolérances applicables",
      "Moyens et matériels nécessaires",
    ],
  },
  {
    n: "02",
    title: "Présentation du mode opératoire",
    items: [
      "Explication des étapes",
      "Organisation du poste",
      "Choix des moyens adaptés",
      "Points de vigilance",
      "Contrôles à effectuer",
    ],
  },
  {
    n: "03",
    title: "Démonstration pratique",
    items: [
      "Présentation de la méthode",
      "Démonstration sur chantier",
      "Transmission des gestes",
      "Explication des erreurs fréquentes",
    ],
  },
  {
    n: "04",
    title: "Accompagnement des compagnons",
    items: [
      "Observation de la mise en œuvre",
      "Conseils techniques",
      "Ajustement des pratiques",
      "Vérification de la compréhension",
    ],
  },
  {
    n: "05",
    title: "Bilan d’intervention",
    items: [
      "Méthodes transmises",
      "Observations",
      "Points d’amélioration",
      "Recommandations",
      "Éventuelle fiche de mode opératoire",
    ],
  },
] as const;

export const BTP_ACCOMPAGNEMENT_EXAMPLES = [
  {
    title: "Pose de dallages",
    items: [
      "Préparation du support",
      "Réglage du lit de pose",
      "Calepinage",
      "Contrôle des niveaux",
      "Alignement",
      "Tolérances",
      "Protection des éléments",
    ],
  },
  {
    title: "Pose de bordures et caniveaux",
    items: [
      "Implantation",
      "Préparation du support",
      "Alignement",
      "Altimétrie",
      "Mise en œuvre du béton",
      "Contrôle de pose",
    ],
  },
  {
    title: "Pose de réseaux",
    items: [
      "Lecture des plans",
      "Implantation",
      "Pentes",
      "Préparation du fond de fouille",
      "Mise en œuvre selon prescriptions",
      "Contrôles",
    ],
  },
  {
    title: "Ouvrages béton",
    items: [
      "Préparation",
      "Coffrage",
      "Armatures",
      "Bétonnage",
      "Contrôles",
      "Cure et protection",
    ],
  },
] as const;

export const BTP_INTERVENTION_MODE_OPTIONS = [
  { value: "regie", label: "Régie" },
  { value: "forfait", label: "Forfait" },
  { value: "sous_traitance", label: "Sous-traitance" },
  { value: "autre", label: "Autre / à préciser" },
] as const;

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
      "Une PME doit assurer le pilotage d’une opération pendant une période déterminée.",
    solution:
      "Conduite de travaux externalisée, planning, coordination et suivi.",
    livrables: "Planning, rapports d’avancement, actions prioritaires.",
    besoin: "conducteur_travaux" as BtpServiceNeedId,
  },
  {
    title: "Chantier TCE en retard",
    context:
      "Difficultés de coordination et interfaces entre corps d’état.",
    solution:
      "Analyse du planning, phasage, coordination et suivi des points bloquants.",
    livrables: "Planning actualisé, compte rendu, plan d’action.",
    besoin: "pilotage_tce" as BtpServiceNeedId,
  },
  {
    title: "Chantier VRD avec défauts de préparation",
    context:
      "Contraintes d’implantation, approvisionnements et moyens techniques mal anticipés.",
    solution:
      "Analyse des plans, préparation des méthodes, coordination et suivi des travaux.",
    livrables: "Points techniques, préparation, rapport de chantier et alertes.",
    besoin: "conducteur_travaux" as BtpServiceNeedId,
  },
  {
    title: "Réponse à un appel d’offres",
    context: "Une PME doit préparer une offre technique et financière.",
    solution: "Analyse du DCE, métrés, étude de prix, mémoire technique.",
    livrables: "Documents de réponse définis au contrat.",
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

/** Offres commerciales à 3 niveaux + marchés (sur devis uniquement). */
export const BTP_COMMERCIAL_OFFERS = [
  {
    id: "renfort",
    level: "Offre 1",
    title: "Renfort opérationnel",
    body: "Pour un chantier nécessitant une compétence supplémentaire sur une phase définie.",
    items: [
      "Préparation d’une opération",
      "Coordination d’intervenants",
      "Suivi d’une phase",
      "Remise en organisation",
      "Gestion d’un besoin temporaire",
    ],
    besoin: "gestion_chantier" as BtpServiceNeedId,
    cta: "Demander un renfort",
  },
  {
    id: "pilotage",
    level: "Offre 2",
    title: "Pilotage de chantier",
    body: "Accompagnement structuré selon le périmètre contractuel.",
    items: [
      "Préparation et planning",
      "Coordination et suivi des moyens",
      "Suivi financier",
      "Reporting et priorités",
      "Assistance à la réception",
    ],
    besoin: "pilotage_tce" as BtpServiceNeedId,
    cta: "Demander un pilotage",
  },
  {
    id: "audit",
    level: "Offre 3",
    title: "Audit et performance",
    body: "Pour une opération en difficulté ou une entreprise qui veut améliorer sa gestion.",
    items: [
      "Diagnostic de chantier",
      "Analyse des rendements et moyens",
      "Recherche des causes de retard",
      "Analyse des coûts",
      "Plan d’action et suivi correctif",
    ],
    besoin: "audit_redressement" as BtpServiceNeedId,
    cta: "Demander un audit",
  },
  {
    id: "marches",
    level: "Offre dédiée",
    title: "Études & marchés",
    body: "De l’analyse de consultation à la préparation de l’offre — sans garantie d’attribution.",
    items: [
      "Analyse DCE / RC / CCTP / CCAP",
      "Métrés et études de prix",
      "Mémoire technique",
      "Méthodologie et planning",
      "Accompagnement contractuel",
    ],
    besoin: "assistance_marches_publics" as BtpServiceNeedId,
    cta: "Confier une étude de marché",
  },
] as const;

/** Profils génériques — pas de noms / photos / effectifs inventés. */
export const BTP_PROFESSIONAL_PROFILES = [
  {
    title: "Conducteur de travaux",
    mission:
      "Préparation, organisation, coordination, suivi financier et reporting sur un périmètre défini.",
    prestations: [
      "Préparation technique et planning",
      "Coordination des intervenants",
      "Suivi budgétaire et délais",
      "Comptes rendus et alertes",
    ],
    besoin: "conducteur_travaux" as BtpServiceNeedId,
  },
  {
    title: "Chef de chantier",
    mission:
      "Encadrement terrain, suivi de production et contrôle des travaux au quotidien.",
    prestations: [
      "Organisation journalière",
      "Encadrement des équipes",
      "Contrôle d’exécution",
      "Remontée des anomalies",
    ],
    besoin: "chef_chantier" as BtpServiceNeedId,
  },
  {
    title: "Direction de travaux",
    mission:
      "Supervision d’opérations et coordination de plusieurs chantiers, selon le périmètre contractuel.",
    prestations: [
      "Supervision multi-opérations",
      "Priorisation et arbitrages",
      "Appui à la direction",
      "Reporting consolidé",
    ],
    besoin: "direction_travaux" as BtpServiceNeedId,
  },
  {
    title: "Pilotage TCE",
    mission:
      "Planning, interfaces techniques et coordination des corps d’état sur l’opération.",
    prestations: [
      "Planning et phasage",
      "Interfaces entre lots",
      "Gestion des coactivités",
      "Suivi des points bloquants",
    ],
    besoin: "pilotage_tce" as BtpServiceNeedId,
  },
] as const;

/** Compétences types (fiches génériques, sans profils nominatifs). */
export const BTP_COMPETENCE_SHEETS = [
  {
    title: "Conducteur de travaux VRD",
    specialites: [
      "Terrassement",
      "Réseaux EP/EU",
      "AEP",
      "Voirie",
      "Aménagements urbains",
      "Génie civil",
    ],
    missions: [
      "Préparation technique",
      "Coordination des équipes",
      "Planning",
      "Approvisionnements",
      "Contrôle de production",
      "Suivi financier",
      "Reporting",
    ],
    besoin: "conducteur_travaux" as BtpServiceNeedId,
    specialiteQuery: "vrd",
  },
  {
    title: "Conducteur de travaux gros œuvre",
    specialites: [
      "Fondations",
      "Maçonnerie",
      "Béton armé",
      "Structure",
      "Dallages",
    ],
    missions: [
      "Préparation",
      "Suivi d’exécution",
      "Coordination sous-traitants",
      "Contrôle d’avancement",
      "Reporting",
    ],
    besoin: "conducteur_travaux" as BtpServiceNeedId,
    specialiteQuery: "gros_oeuvre",
  },
  {
    title: "Coordination TCE",
    specialites: [
      "Interfaces inter-lots",
      "Phasage",
      "Coactivité",
      "Synthèse des contraintes",
    ],
    missions: [
      "Analyse planning",
      "Coordination des intervenants",
      "Points bloquants",
      "Suivi des réserves",
    ],
    besoin: "pilotage_tce" as BtpServiceNeedId,
    specialiteQuery: "tce",
  },
] as const;

export const BTP_DELIVERABLES = [
  {
    id: "rapport",
    title: "Rapport de chantier",
    items: [
      "Date et chantier",
      "Effectifs",
      "Travaux réalisés",
      "Quantités",
      "Photos",
      "Difficultés",
      "Actions correctives",
      "Prochaines étapes",
    ],
  },
  {
    id: "planning",
    title: "Planning",
    items: [
      "Phases",
      "Tâches",
      "Durées",
      "Responsables",
      "Dates clés",
      "Avancement",
    ],
  },
  {
    id: "financier",
    title: "Tableau de bord financier",
    items: [
      "Budget de référence",
      "Dépenses suivies",
      "Quantités",
      "Écarts",
      "Points d’attention",
    ],
  },
  {
    id: "direction",
    title: "Synthèse de direction",
    items: [
      "État général",
      "Points bloquants",
      "Risques identifiés",
      "Décisions à prendre",
      "Actions prioritaires",
    ],
  },
] as const;

export const BTP_DELIVERABLE_LIST = [
  "Planning de chantier",
  "Rapport journalier",
  "Compte rendu de réunion",
  "Suivi des effectifs",
  "Quantités réalisées",
  "Suivi des dépenses",
  "Tableau d’avancement",
  "Liste des réserves et non-conformités",
  "Actions correctives",
  "Suivi documentaire",
] as const;

export const BTP_LIFECYCLE_STAGES = [
  {
    title: "Avant travaux",
    body: "Études, marchés, métrés, prix, planning et préparation.",
    href: "/marches-publics-prives",
  },
  {
    title: "Pendant les travaux",
    body: "Organisation, pilotage, coordination et suivi de production.",
    href: "/pilotage-chantier",
  },
  {
    title: "Fin de travaux",
    body: "Contrôle, réception, DOE, décomptes et clôture.",
    href: "/demande-de-devis?besoin=conducteur_travaux",
  },
] as const;

export const BTP_WHY_BEWORK = [
  "Expertise pratique du chantier",
  "Compréhension des marchés et contraintes contractuelles",
  "Gestion rigoureuse des opérations",
  "Outils de suivi collaboratifs",
  "Utilisation encadrée de l’IA",
  "Prestations adaptées aux besoins réels",
] as const;

export const BTP_COST_RISKS = [
  "Arrêt d’une équipe par manque de matériaux",
  "Engin immobilisé",
  "Défaut d’implantation nécessitant une reprise",
  "Sous-traitant intervenant au mauvais moment",
  "Travaux supplémentaires non suivis",
  "Quantités réalisées mal comptabilisées",
  "Planning désorganisé",
  "Défaut de coordination entre lots",
] as const;

export const BTP_MARCHES_FLOW = [
  {
    n: "01",
    title: "Vous transmettez le dossier",
    body: "Consultation, pièces disponibles et objectif de réponse.",
  },
  {
    n: "02",
    title: "Nous l’analysons",
    body: "Contraintes techniques, critères, risques et charge de réponse.",
  },
  {
    n: "03",
    title: "Nous définissons la mission",
    body: "Périmètre, livrables, délais et conditions sur devis.",
  },
  {
    n: "04",
    title: "Nous produisons les livrables",
    body: "Analyse, métrés, prix, mémoire ou pièces selon contrat.",
  },
  {
    n: "05",
    title: "Vous validez",
    body: "Relecture, ajustements et dépôt sous votre responsabilité.",
  },
] as const;

export const BTP_PLATFORM_JOURNEY = [
  {
    id: "visite",
    title: "Visite chantier",
    input: "Observations, photos, contraintes terrain",
    action: "Relevé et structuration",
    result: "Dossier de visite exploitable",
    ia: "Aide à classer observations et manques",
  },
  {
    id: "metres",
    title: "Métrés",
    input: "Plans, relevés, quantités",
    action: "Quantitatif et contrôles de cohérence",
    result: "Base pour devis ou suivi",
    ia: "Assistance à la structuration des quantités",
  },
  {
    id: "devis",
    title: "Devis",
    input: "Ouvrages, déboursés, bibliothèque",
    action: "Étude de prix",
    result: "Devis et variantes",
    ia: "Aide à l’analyse et au chiffrage assisté",
  },
  {
    id: "planning",
    title: "Planning",
    input: "Tâches, phasage, affectations",
    action: "Organisation des interventions",
    result: "Planning suivi",
    ia: "Aide à la préparation des actions",
  },
  {
    id: "appro",
    title: "Approvisionnements",
    input: "Besoins liés au planning",
    action: "Commandes et suivi livraisons",
    result: "Visibilité matériels",
    ia: "Points d’attention sur les manques",
  },
  {
    id: "suivi",
    title: "Suivi de chantier",
    input: "Avancement, incidents, décisions",
    action: "Pilotage quotidien",
    result: "Traçabilité opérationnelle",
    ia: "Synthèses et alertes assistées",
  },
  {
    id: "reporting",
    title: "Reporting",
    input: "Données consolidées",
    action: "Comptes rendus et tableaux de bord",
    result: "Visibilité direction",
    ia: "Assistance à la rédaction structurée",
  },
] as const;
