/**
 * Pages services SEO — angles distincts, textes courts.
 * Le détail méthodologique reste sur /ressources/* et landings existantes.
 */

export type ServicePageSlug =
  | "assistant-travaux"
  | "assistant-conducteur-de-travaux"
  | "assistant-chef-de-chantier"
  | "externalisation-administrative-btp"
  | "compte-rendu-chantier"
  | "analyse-dce-btp"
  | "ppsps"
  | "memoire-technique-btp"
  | "chiffrage-devis-btp"
  | "doe-btp";

export type ServiceDeepeningLink = { href: string; label: string };

export type ServicePageDefinition = {
  slug: ServicePageSlug;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  pourQuiBullets: string[];
  priseEnChargeBullets: string[];
  pourquoiParagraphs: string[];
  commentSteps: string[];
  deepeningLinks: ServiceDeepeningLink[];
  /** Autres pages services (maillage) */
  seeAlsoSlugs?: ServicePageSlug[];
  faq: { q: string; a: string }[];
};

const BASE_SEE: ServicePageSlug[] = ["assistant-travaux", "externalisation-administrative-btp"];

export const SERVICE_PAGES: Record<ServicePageSlug, ServicePageDefinition> = {
  "assistant-travaux": {
    slug: "assistant-travaux",
    metaTitle: "Assistant travaux BTP augmenté par l’IA | BeWork",
    metaDescription:
      "Assistant travaux pour le BTP : relais bureau-chantier, dossiers chantier et relances. L’IA structure, vous validez ce qui engage votre entreprise.",
    h1: "Assistant travaux augmenté par l’IA pour entreprises du BTP",
    intro:
      "BeWork met à votre disposition un relais opérationnel entre le bureau et le chantier : préparation de documents, suivi des échéances et coordination cadrée. L’IA accélère la structuration et la relecture ; un interlocuteur humain garde le fil et le cadre.",
    pourQuiBullets: [
      "Artisans, TPE et PME du bâtiment qui cumulent terrain et dossiers.",
      "Conducteurs de travaux, chefs de chantier et chargés d’affaires sous pression.",
      "Dirigeants qui veulent sécuriser le suivi sans recruter immédiatement.",
    ],
    priseEnChargeBullets: [
      "Préparation et mise en forme de livrables chantier (selon forfait).",
      "Relances clients, fournisseurs et sous-traitants dans le ton de votre entreprise.",
      "Suivi administratif des dossiers : statuts, pièces, relances et points de vigilance.",
      "Coordination des allers-retours documents (sous votre validation sur les engagements).",
    ],
    pourquoiParagraphs: [
      "Le retard ne se crée pas toujours sur le terrain : il se crée quand le bureau ne suit pas. Un assistant travaux permet de faire avancer les dossiers pendant que vous êtes sur chantier ou en réunion.",
      "L’augmentation par l’IA sert à structurer, extraire et préparer plus vite : elle ne remplace pas votre arbitrage technique, commercial ou réglementaire.",
    ],
    commentSteps: [
      "Vous choisissez un forfait adapté à votre volume (voir tarifs).",
      "Vous déposez vos demandes et pièces sur la plateforme.",
      "BeWork traite, suit et rend compte ; vous validez les décisions sensibles.",
    ],
    deepeningLinks: [
      { href: "/assistants-administratifs-taches", label: "Catalogue des missions" },
      { href: "/tarifs", label: "Forfaits TTC" },
      { href: "/notre-facon-de-travailler", label: "Process BeWork" },
    ],
    seeAlsoSlugs: ["assistant-conducteur-de-travaux", "externalisation-administrative-btp"],
    faq: [
      {
        q: "Un assistant travaux BeWork remplace un conducteur de travaux ?",
        a: "Non. Il tient le relais administratif et opérationnel léger (préparation, suivi, relances) pour que vous gardiez la maîtrise technique et la décision sur le chantier.",
      },
      {
        q: "Que signifie « augmenté par l’IA » ?",
        a: "Des outils d’IA assistent pour structurer les contenus, accélérer la mise en forme et réduire les oublis. Le pilotage et le relationnel restent encadrés humainement.",
      },
    ],
  },

  "assistant-conducteur-de-travaux": {
    slug: "assistant-conducteur-de-travaux",
    metaTitle: "Assistant conducteur de travaux BTP | BeWork",
    metaDescription:
      "Assistant conducteur de travaux : déléguez CR, relances, situations et coordination fournisseurs. Relais bureau-chantier, validation chez vous.",
    h1: "Assistant conducteur de travaux : dossiers et suivi quand le carnet déborde",
    intro:
      "Le conducteur de travaux est souvent le point de contact unique entre maîtrise d’ouvrage, entreprises et corps d’état. BeWork sécurise la partie « dossier qui doit avancer » : relances, pièces, plannings administratifs et préparations de synthèses, sans empiéter sur vos arbitrages terrain.",
    pourQuiBullets: [
      "Conducteurs de travaux en entreprise générale, sous-traitance ou lot technique.",
      "Profils qui gèrent plusieurs chantiers et une charge documentaire dense.",
    ],
    priseEnChargeBullets: [
      "Préparation de comptes rendus et synthèses de réunion (sur brief).",
      "Suivi des demandes de documents, relances courtoises et classement.",
      "Appui sur situations de travaux, facturation et relances (selon cadrage).",
      "Coordination des échanges fournisseurs / locations sur la base de vos consignes.",
    ],
    pourquoiParagraphs: [
      "Quand le conducteur passe son temps à relancer pour obtenir une pièce, le chantier avance mal. Externaliser le « train administratif » redonne des plages pour le pilotage réel.",
    ],
    commentSteps: [
      "Brief clair : priorités, interlocuteurs, jalons.",
      "Traitement des demandes dans le cadre du forfait, avec points de reporting.",
      "Validation finale systématique sur tout ce qui engage contractuellement ou techniquement.",
    ],
    deepeningLinks: [
      { href: "/situation-travaux-btp", label: "Situations de travaux & suivi" },
      { href: "/dict-dt-travaux", label: "DICT et dossiers travaux" },
      { href: "/ressources/planning-chantier-btp", label: "Ressource planning chantier" },
    ],
    seeAlsoSlugs: ["assistant-chef-de-chantier", ...BASE_SEE],
    faq: [
      {
        q: "BeWork peut-il rédiger des réponses à la MOA à ma place ?",
        a: "BeWork peut préparer des brouillons et assembler les pièces. Vous gardez la validation des réponses qui engagent votre responsabilité ou votre relation contractuelle.",
      },
    ],
  },

  "assistant-chef-de-chantier": {
    slug: "assistant-chef-de-chantier",
    metaTitle: "Assistant chef de chantier BTP | BeWork",
    metaDescription:
      "Assistant chef de chantier : documents, relances commandes et CR quand le poste est sur le terrain. Relais à distance.",
    h1: "Assistant chef de chantier : tenir le bureau quand le poste est sur le terrain",
    intro:
      "Le chef de chantier fait tourner l’exécution : il manque souvent de disponibilité pour suivre les mails, les relances et les documents. BeWork prend en charge la partie coordination et suivi administratif, en restant aligné sur vos consignes de chantier.",
    pourQuiBullets: [
      "Chefs de chantier et adjoints en entreprise du bâtiment ou gros œuvre.",
      "Équipes où la logistique documentaire et les relances grignotent les journées.",
    ],
    priseEnChargeBullets: [
      "Suivi des commandes, livraisons et locations (sur consignes).",
      "Relances fournisseurs et préparation de comptes rendus opérationnels.",
      "Préparation de dossiers et checklists avant réunion ou visite.",
    ],
    pourquoiParagraphs: [
      "Le chef de chantier doit voir le travail réel : si le bureau monopolise la fin de journée, la qualité d’exécution baisse. Un relais distant permet de garder le cap sur l’ouvrage.",
    ],
    commentSteps: [
      "Identification des tâches récurrentes et des canaux de transmission.",
      "Mise en place d’un rythme de traitement (hebdo / continu selon forfait).",
      "Points de contrôle avec vous sur les sujets sensibles.",
    ],
    deepeningLinks: [
      { href: "/suivi-fournisseurs-chantier", label: "Suivi fournisseurs & achats" },
      { href: "/ressources/compte-rendu-chantier", label: "Compte rendu de chantier (ressource)" },
    ],
    seeAlsoSlugs: ["assistant-conducteur-de-travaux", ...BASE_SEE],
    faq: [
      {
        q: "Le chef de chantier garde-t-il la main sur les commandes ?",
        a: "Oui. BeWork prépare, relance et suit ; les validations de prix, de délai et de choix techniques restent de votre ressort.",
      },
    ],
  },

  "externalisation-administrative-btp": {
    slug: "externalisation-administrative-btp",
    metaTitle: "Externalisation administrative BTP | BeWork",
    metaDescription:
      "Externalisation administrative BTP : relais travaux, forfaits TTC, accompagnement francophone FR · BE · CH · LU.",
    h1: "Externalisation administrative BTP avec un relais travaux encadré",
    intro:
      "L’externalisation administrative BTP ne se résume pas à « du secrétariat » : chez BeWork, il s’agit d’un relais travaux — dossiers chantier, relances, préparations documentaires — avec des forfaits clairs et un accompagnement à distance supervisé depuis la France.",
    pourQuiBullets: [
      "Dirigeants et responsables qui veulent structurer le suivi sans alourdir la masse salariale.",
      "Entreprises francophones cherchant un cadre contractuel simple (forfaits TTC).",
    ],
    priseEnChargeBullets: [
      "Missions listées dans le catalogue (comptes rendus, DCE, PPSPS, relances, etc.).",
      "Coordination documentaire et suivi des échéances dans le périmètre défini.",
      "Plateforme de suivi et traçabilité des demandes.",
    ],
    pourquoiParagraphs: [
      "Recruter pour des pics d’activité est risqué. L’externalisation cadrée permet d’absorber la charge sans figer des coûts fixes.",
      "BeWork ne remplace pas votre expertise métier : elle libère du temps sur les tâches reproductibles et chronophages.",
    ],
    commentSteps: [
      "Échange pour cadrer le volume et le type de missions.",
      "Choix du forfait et création de l’espace client.",
      "Démarrage opérationnel en quelques jours selon disponibilité.",
    ],
    deepeningLinks: [
      { href: "/externaliser-administratif", label: "Approfondir l’externalisation" },
      { href: "/externalisation-administrative-btp-france", label: "Page France" },
      { href: "/externalisation-administrative-btp-belgique", label: "Page Belgique" },
    ],
    seeAlsoSlugs: ["assistant-travaux", "chiffrage-devis-btp"],
    faq: [
      {
        q: "BeWork est-elle présente physiquement dans chaque pays ?",
        a: "L’accompagnement est assuré à distance, en français, avec pilotage supervisé depuis la France. Des pages pays décrivent l’adéquation avec les entreprises en France, Belgique, Suisse et Luxembourg.",
      },
    ],
  },

  "compte-rendu-chantier": {
    slug: "compte-rendu-chantier",
    metaTitle: "Compte rendu de chantier BTP | BeWork",
    metaDescription:
      "Compte rendu de chantier : structuration, relecture et relances. Préparez des CR clairs sans y passer la soirée.",
    h1: "Compte rendu de chantier : structurer l’information sans y passer la soirée",
    intro:
      "Un compte rendu utile trace les décisions, les réserves et les suites à donner. BeWork aide à transformer vos notes ou enregistrements en documents clairs, homogènes et exploitables par l’équipe, avec l’appui d’outils d’IA pour accélérer la mise en forme.",
    pourQuiBullets: [
      "Entreprises qui multiplient les visites, réunions de coordination et inspections.",
      "Équipes qui veulent homogénéiser le format des CR pour limiter les malentendus.",
    ],
    priseEnChargeBullets: [
      "Structuration des comptes rendus selon votre modèle ou une trame BeWork.",
      "Intégration des points de vigilance, jalons et responsables identifiés.",
      "Relances pour compléter les informations manquantes (sur brief).",
    ],
    pourquoiParagraphs: [
      "Les litiges et oublis coûtent cher : un CR régulier et lisible est un outil de pilotage autant qu’un document de preuve.",
    ],
    commentSteps: [
      "Vous transmettez le brut (notes, vocal, points saillants).",
      "BeWork propose une version structurée ; vous validez.",
      "Archivage et diffusion selon vos règles internes.",
    ],
    deepeningLinks: [
      { href: "/ressources/compte-rendu-chantier", label: "Hub compte rendu de chantier" },
      { href: "/ressources/compte-rendu-chantier-guide-btp", label: "Guide & méthode PDF" },
    ],
    seeAlsoSlugs: ["assistant-chef-de-chantier", "doe-btp"],
    faq: [
      {
        q: "BeWork signe-t-elle les comptes rendus à la place du conducteur ?",
        a: "Non. BeWork prépare et met en forme ; la validation et l’émission officielle restent de votre responsabilité selon votre organisation.",
      },
    ],
  },

  "analyse-dce-btp": {
    slug: "analyse-dce-btp",
    metaTitle: "Analyse DCE BTP : synthèse et appels d’offres | BeWork",
    metaDescription:
      "Analyse DCE BTP : tri des pièces et synthèses pour arbitrer avant appel d’offres. Sans remplacer votre chiffrage.",
    h1: "Analyse DCE BTP : y voir clair avant d’engager vos équipes",
    intro:
      "Un dossier de consultation peut être volumineux. BeWork aide à trier les pièces, repérer les incohérences évidentes et préparer des synthèses de lecture pour accélérer votre phase d’arbitrage. L’objectif est de gagner du temps de cadrage, pas de substituer votre jugement d’entreprise.",
    pourQuiBullets: [
      "Chargés d’affaires et conducteurs impliqués dans les réponses aux AO.",
      "PME qui n’ont pas toujours un bureau d’études disponible immédiatement.",
    ],
    priseEnChargeBullets: [
      "Tri et classement des pièces selon une méthode convenue.",
      "Synthèses de lecture (lots, risques apparents, points à clarifier).",
      "Préparation de checklists de conformité documentaire (sur brief).",
    ],
    pourquoiParagraphs: [
      "Répondre sans avoir lu le bon CCTP ou la bonne annexe expose à des impairs techniques et financiers. Une première lecture structurée réduit ce risque.",
    ],
    commentSteps: [
      "Réception du DCE et du calendrier cible.",
      "Travail de structuration et de questions / remarques.",
      "Remise pour revue interne avant décision de réponse.",
    ],
    deepeningLinks: [
      { href: "/ressources/analyse-dce-btp", label: "Ressource analyse DCE" },
      { href: "/ressources/tuto-skill-analyse-dce-bework", label: "Tutoriel skill analyse DCE" },
    ],
    seeAlsoSlugs: ["memoire-technique-btp", "chiffrage-devis-btp"],
    faq: [
      {
        q: "BeWork garantit-elle le résultat d’une offre ?",
        a: "Non. BeWork fournit un appui documentaire et méthodologique ; la décision de répondre, le prix et le contenu technique final restent entièrement de votre côté.",
      },
    ],
  },

  ppsps: {
    slug: "ppsps",
    metaTitle: "PPSPS BTP : aide à la rédaction | BeWork",
    metaDescription:
      "PPSPS BTP : structuration des rubriques et relecture. Vous validez les mesures de prévention et l’organisation.",
    h1: "PPSPS : avancer sur la mise en forme sans bricoler les rubriques essentielles",
    intro:
      "Le PPSPS doit être cohérent avec le risque réel du chantier. BeWork aide à structurer le document, intégrer vos données et accélérer la mise en page, sous réserve de vos validations sur les mesures de prévention et l’organisation des phases travaux.",
    pourQuiBullets: [
      "Entreprises qui produisent des PPSPS fréquents ou sur des formats exigeants.",
      "Responsables QSE / conducteurs qui manquent de temps pour la formalisation.",
    ],
    priseEnChargeBullets: [
      "Structuration selon les rubriques attendues (sur modèle ou règlementation cadrée avec vous).",
      "Intégration des consignes, plans et textes que vous fournissez.",
      "Relecture de cohérence (titres, numérotation, références croisées).",
    ],
    pourquoiParagraphs: [
      "Un PPSPS incomplet ou illisible bloque l’ouverture de chantier. Gagner du temps sur la forme permet de se concentrer sur le fond sécurité.",
    ],
    commentSteps: [
      "Collecte du contexte chantier et des exigences MOA / CSPS attendues.",
      "Rédaction / structuration en cycles courts avec relecture.",
      "Validation finale par votre référent sécurité ou conducteur.",
    ],
    deepeningLinks: [
      { href: "/ressources/ppsps-btp", label: "Ressource PPSPS" },
      { href: "/ressources/tuto-skill-ppsps-bework", label: "Tutoriel skill PPSPS" },
    ],
    seeAlsoSlugs: ["doe-btp", "memoire-technique-btp"],
    faq: [
      {
        q: "BeWork peut-elle signer le PPSPS ?",
        a: "Non. La validation et la signature restent de la responsabilité de l’entreprise exécutante et de ses référents habilités.",
      },
    ],
  },

  "memoire-technique-btp": {
    slug: "memoire-technique-btp",
    metaTitle: "Mémoire technique BTP | BeWork",
    metaDescription:
      "Mémoire technique BTP : plan, fil rouge et relecture pour une réponse AO lisible par la maîtrise d’ouvrage.",
    h1: "Mémoire technique BTP : un fil clair pour une réponse lisible",
    intro:
      "Un mémoire technique doit démontrer votre méthode et votre compréhension du projet. BeWork aide à bâtir la structure, harmoniser le ton et intégrer vos contenus techniques, afin de livrer un dossier plus fluide à relire par la maîtrise d’ouvrage.",
    pourQuiBullets: [
      "Entreprises qui répondent à des consultations publics ou privés.",
      "Équipes où la charge rédactionnelle pèse sur peu de personnes.",
    ],
    priseEnChargeBullets: [
      "Construction du plan et des transitions entre parties.",
      "Mise en forme et harmonisation des chapitres fournis par vos experts.",
      "Relecture de clarté (sans remplacer la validation technique interne).",
    ],
    pourquoiParagraphs: [
      "Une réponse confuse fait perdre des points même avec un bon prix. La clarté est un levier compétitif.",
    ],
    commentSteps: [
      "Reprise du DCE / critères de notation et de votre stratégie de réponse.",
      "Itérations sur le plan puis sur les chapitres.",
      "Relecture finale avant envoi sous votre contrôle.",
    ],
    deepeningLinks: [
      { href: "/ressources/memoire-technique-btp", label: "Ressource mémoire technique" },
      { href: "/ressources/tuto-skill-memoire-technique-bework", label: "Tutoriel skill mémoire technique" },
    ],
    seeAlsoSlugs: ["analyse-dce-btp", "chiffrage-devis-btp"],
    faq: [
      {
        q: "BeWork invente-t-elle le contenu technique ?",
        a: "Non. BeWork s’appuie sur vos données, vos fiches méthodes et vos arbitrages. Elle aide à la structuration et à la lisibilité.",
      },
    ],
  },

  "chiffrage-devis-btp": {
    slug: "chiffrage-devis-btp",
    metaTitle: "Chiffrage devis BTP | BeWork",
    metaDescription:
      "Chiffrage et devis BTP : montage, relances fournisseurs et suivi envois. Vous gardez prix, marges et stratégie.",
    h1: "Chiffrage et devis BTP : accélérer la préparation sans perdre le contrôle des prix",
    intro:
      "Le devis est un document commercial et technique : BeWork peut préparer les tableaux, centraliser les retours fournisseurs et suivre les relances, pendant que vous validez les taux, marges et positions commerciales.",
    pourQuiBullets: [
      "Entreprises avec un fort volume de demandes de prix.",
      "Chargés d’affaires qui enchaînent les montages sous délais courts.",
    ],
    priseEnChargeBullets: [
      "Montage et mise en forme des offres (sur vos modèles).",
      "Relances fournisseurs et consolidation des prix reçus.",
      "Suivi des envois et des relances clients (selon cadrage).",
    ],
    pourquoiParagraphs: [
      "Un devis envoyé tardivement se perd souvent avant d’être comparé. Fluidifier la chaîne améliore le taux de transformation.",
    ],
    commentSteps: [
      "Définition des modèles, règles de marge et listes fournisseurs.",
      "Traitement des dossiers dans le flux convenu.",
      "Validation commerciale et technique avant envoi.",
    ],
    deepeningLinks: [
      { href: "/ressources/chiffrage-devis-btp", label: "Ressource chiffrage & devis" },
      { href: "/relance-devis-btp", label: "Relance devis BTP" },
    ],
    seeAlsoSlugs: ["analyse-dce-btp", "assistant-conducteur-de-travaux"],
    faq: [
      {
        q: "BeWork fixe-t-elle les prix de vente ?",
        a: "Non. Les prix, marges et positions commerciales restent validés par votre entreprise.",
      },
    ],
  },

  "doe-btp": {
    slug: "doe-btp",
    metaTitle: "DOE BTP : constitution et livrables | BeWork",
    metaDescription:
      "DOE BTP : structure des lots, suivi des pièces manquantes et mise en forme. Clôture documentaire plus prévisible.",
    h1: "DOE BTP : avancer sur la constitution sans noyer le chantier dans l’administratif",
    intro:
      "Le dossier des ouvrages exécutés exige rigueur et complétude. BeWork aide à structurer les chapitres, suivre les pièces manquantes et préparer les livrables selon votre format, pour que la clôture documentaire soit plus prévisible.",
    pourQuiBullets: [
      "Entreprises générales et sous-traitants livrant des DOE exigeants.",
      "Chefs de chantier ou conducteurs en phase de réception.",
    ],
    priseEnChargeBullets: [
      "Structuration du sommaire et des pièces par lot.",
      "Suivi des manquants et relances internes / externes (sur brief).",
      "Mise en forme et harmonisation des documents fournis.",
    ],
    pourquoiParagraphs: [
      "Un DOE incomplet retarde la levée de réserves et la sortie de garantie. Anticiper la collecte réduit les tensions de fin de chantier.",
    ],
    commentSteps: [
      "Reprise du périmètre contractuel et des exigences MOA.",
      "Collecte et classement progressifs.",
      "Relectures et validation par vos référents.",
    ],
    deepeningLinks: [
      { href: "/ressources/doe-btp", label: "Ressource DOE" },
      { href: "/ressources/tuto-skill-doe-bework", label: "Tutoriel skill DOE" },
    ],
    seeAlsoSlugs: ["compte-rendu-chantier", "ppsps"],
    faq: [
      {
        q: "BeWork certifie-t-elle la conformité réglementaire du DOE ?",
        a: "Non. BeWork apporte un appui de structuration et de suivi ; la conformité et la signature des livrables restent de votre responsabilité.",
      },
    ],
  },
};

/** Ordre d’affichage hub / sitemap */
export const SERVICE_PAGE_ORDER: ServicePageSlug[] = [
  "assistant-travaux",
  "assistant-conducteur-de-travaux",
  "assistant-chef-de-chantier",
  "externalisation-administrative-btp",
  "compte-rendu-chantier",
  "analyse-dce-btp",
  "ppsps",
  "memoire-technique-btp",
  "chiffrage-devis-btp",
  "doe-btp",
];

export function servicePagePath(slug: ServicePageSlug): string {
  return `/services/${slug}`;
}

export function isServicePageSlug(value: string): value is ServicePageSlug {
  return Object.prototype.hasOwnProperty.call(SERVICE_PAGES, value);
}
