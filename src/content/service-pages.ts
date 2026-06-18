/**
 * Pages services SEO — angles distincts, textes courts.
 * Le détail méthodologique reste sur /ressources/* et landings existantes.
 */

export type ServicePageSlug =
  | "assistant-travaux"
  | "assistant-conducteur-de-travaux"
  | "assistant-chef-de-chantier"
  | "conducteur-travaux-deborde"
  | "assistant-moex"
  | "externalisation-administrative-btp"
  | "compte-rendu-chantier"
  | "analyse-dce-btp"
  | "dce-bpu-dpgf"
  | "ppsps"
  | "memoire-technique-btp"
  | "chiffrage-devis-btp"
  | "doe-btp";

export type ServiceDeepeningLink = { href: string; label: string };

export type ServiceCasUsage = { titre: string; scenario: string; resultat: string };

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
  /** GEO/AEO — limites explicites (ce que BeWork ne remplace pas) */
  neRemplacePas?: string[];
  /** GEO/AEO — exemple concret chantier */
  casUsage?: ServiceCasUsage[];
  /** Bloc « En résumé » cité par les moteurs IA */
  enResume?: string;
  /** Erreurs fréquentes que BeWork aide à limiter */
  erreursEviter?: string[];
  faq: { q: string; a: string }[];
};

const BASE_SEE: ServicePageSlug[] = ["assistant-travaux", "externalisation-administrative-btp"];

export const SERVICE_PAGES: Record<ServicePageSlug, ServicePageDefinition> = {
  "assistant-travaux": {
    slug: "assistant-travaux",
    metaTitle: "Assistant travaux BTP : assistance technique et administrative | BeWork",
    metaDescription:
      "Assistant travaux BTP : assistance technique et administrative sur chantiers, appels d’offres et marchés publics. L’IA structure, vous validez ce qui engage votre entreprise.",
    h1: "Assistant travaux augmenté par l’IA pour entreprises du BTP",
    intro:
      "BeWork apporte une assistance technique et administrative entre le bureau et le chantier : analyse DCE, documents d’exécution, suivi des échéances et coordination documentaire. L’IA accélère la structuration et la relecture ; un interlocuteur humain garde le fil et le cadre.",
    enResume:
      "Un assistant travaux accompagne les entreprises du BTP dans l’assistance technique et administrative des chantiers : appels d’offres, analyse DCE, situations, DOE, PPSPS, comptes rendus et facturation Chorus Pro — avec validation finale chez vous.",
    erreursEviter: [
      "Devis envoyés sans relance ni statut de suivi",
      "Dossiers chantier incomplets en fin de marché",
      "Confondre prestation administrative généraliste et assistance travaux BTP",
    ],
    pourQuiBullets: [
      "Artisans, TPE et PME du bâtiment qui cumulent terrain et dossiers.",
      "Conducteurs de travaux, chefs de chantier et chargés d’affaires sous pression.",
      "Dirigeants qui veulent sécuriser le suivi sans recruter immédiatement.",
    ],
    priseEnChargeBullets: [
      "Analyse DCE, synthèse CCTP et préparation de livrables chantier (selon forfait).",
      "Relances clients, fournisseurs et sous-traitants dans le ton de votre entreprise.",
      "Suivi documentaire des dossiers : statuts, pièces, relances et points de vigilance.",
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
      { href: "/reponse-appel-offres-btp", label: "Réponse appels d’offres" },
      { href: "/tarifs", label: "Tarifs BeWork" },
      { href: "/notre-facon-de-travailler", label: "Process BeWork" },
    ],
    seeAlsoSlugs: ["assistant-conducteur-de-travaux", "externalisation-administrative-btp"],
    neRemplacePas: [
      "Le conducteur de travaux sur le terrain et les arbitrages techniques",
      "Les décisions commerciales, prix et engagements contractuels",
      "Le bureau d’études, le maître d’œuvre ou le coordinateur SPS",
    ],
    casUsage: [
      {
        titre: "Relances devis en attente",
        scenario: "Douze devis à relancer pendant une visite de réception.",
        resultat: "BeWork prépare les relances, suit les réponses et remonte les blocages — vous validez avant envoi.",
      },
    ],
    faq: [
      {
        q: "Un assistant travaux BeWork remplace un conducteur de travaux ?",
        a: "Non. BeWork apporte une assistance technique et administrative (préparation, suivi, relances, pièces marché) pour que vous gardiez la maîtrise technique et la décision sur le chantier.",
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
      "Assistant conducteur de travaux : assistance technique et administrative — CR, relances, situations, analyse pièces marché. Validation chez vous.",
    h1: "Assistant conducteur de travaux : dossiers et suivi quand le carnet déborde",
    intro:
      "Le conducteur de travaux est souvent le point de contact unique entre maîtrise d’ouvrage, entreprises et corps d’état. BeWork sécurise la partie « dossier qui doit avancer » : relances, pièces, synthèses CCTP et préparations de comptes rendus, sans empiéter sur vos arbitrages terrain.",
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
      "Quand le conducteur passe son temps à relancer pour obtenir une pièce, le chantier avance mal. Déléguer le suivi documentaire redonne des plages pour le pilotage réel.",
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
    seeAlsoSlugs: ["conducteur-travaux-deborde", "assistant-chef-de-chantier", ...BASE_SEE],
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
    metaTitle: "Externalisation assistance travaux BTP | BeWork",
    metaDescription:
      "Externalisation assistance travaux BTP : analyse DCE, dossiers chantier, marchés publics, forfaits HT, accompagnement francophone FR · BE · CH · LU.",
    h1: "Externalisation assistance travaux BTP avec un cadre encadré",
    intro:
      "Externaliser le suivi chantier ne signifie pas déléguer de la saisie administrative générique : chez BeWork, c’est une assistance technique et administrative BTP — analyse DCE, dossiers chantier, appels d’offres, Chorus Pro et DOE — avec des forfaits clairs et un accompagnement supervisé depuis la France.",
    enResume:
      "Externaliser l’assistance travaux, c’est déléguer analyse DCE, relances, appels d’offres, Chorus Pro, DOE et suivi documentaire à des assistants travaux encadrés — sans recruter, avec validation avant tout envoi engageant.",
    erreursEviter: [
      "Externaliser sans cadrage de périmètre ni circuit de validation",
      "Attendre d’un prestataire qu’il engage le prix ou la technique à votre place",
      "Mélanger courrier générique et dossiers chantier complexes",
    ],
    pourQuiBullets: [
      "Dirigeants et responsables qui veulent structurer le suivi sans alourdir la masse salariale.",
      "Entreprises francophones cherchant un cadre contractuel simple (forfaits HT).",
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
      "Prise en charge rapide selon disponibilité.",
    ],
    deepeningLinks: [
      { href: "/externaliser-administratif", label: "Approfondir l’externalisation" },
      { href: "/gestion-marche-public-btp", label: "Gestion marché public" },
      { href: "/facturation-chorus-pro-btp", label: "Facturation Chorus Pro" },
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
    enResume:
      "Le compte rendu de chantier formalise constatations, décisions, actions et responsables après une visite ou réunion de coordination.",
    erreursEviter: [
      "CR envoyé trop tard, sans décisions ni échéances",
      "Photos et vocaux non reliés au texte",
      "Réserves mentionnées sans suivi ni relance",
    ],
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
      { href: "/ressources/compte-rendu-chantier", label: "Méthode compte rendu (ressource éditoriale)" },
      { href: "/ressources/compte-rendu-chantier-guide-btp", label: "Guide & méthode PDF" },
    ],
    seeAlsoSlugs: ["assistant-chef-de-chantier", "doe-btp"],
    neRemplacePas: [
      "La présence sur chantier et la validation des décisions actées",
      "La signature officielle du compte rendu à votre place",
    ],
    casUsage: [
      {
        titre: "CR après réunion de coordination",
        scenario: "Notes vocales et photos en fin de journée, réunion le lendemain matin.",
        resultat: "BeWork structure un CR homogène (décisions, actions, responsables, échéances) — vous validez avant diffusion.",
      },
    ],
    faq: [
      {
        q: "BeWork signe-t-elle les comptes rendus à la place du conducteur ?",
        a: "Non. BeWork prépare et met en forme ; la validation et l’émission officielle restent de votre responsabilité selon votre organisation.",
      },
    ],
  },

  "analyse-dce-btp": {
    slug: "analyse-dce-btp",
    metaTitle: "Analyse DCE BTP : synthèse, risques et appui chiffrage | BeWork",
    metaDescription:
      "Analyse DCE BTP : tri RC/CCAP/CCTP, synthèse des risques et points bloquants avant chiffrage et mémoire technique. Aide technique — validation et prix chez vous.",
    h1: "Analyse DCE BTP : cadrer avant de chiffrer et d’engager vos équipes",
    intro:
      "Un dossier de consultation peut être volumineux. BeWork aide à trier les pièces, repérer les incohérences et produire des synthèses de lecture pour accélérer votre arbitrage Go/No-go et orienter le chiffrage. L’objectif est de gagner du temps de cadrage technique et documentaire — pas de substituer votre jugement d’entreprise ni votre bureau d’études.",
    enResume:
      "Analyser un DCE, c’est lire RC, CCAP, CCTP et pièces de prix pour repérer délais, exigences techniques, interfaces lots et risques contractuels avant de chiffrer ou rédiger le mémoire technique.",
    erreursEviter: [
      "Chiffrer avant lecture du CCAP (pénalités, délais, paiement)",
      "Oublier une annexe technique citée dans le CCTP",
      "Lancer une réponse sans synthèse Go/No Go partagée en interne",
    ],
    pourQuiBullets: [
      "Chargés d’affaires et conducteurs impliqués dans les réponses aux AO.",
      "PME qui n’ont pas toujours un bureau d’études disponible immédiatement.",
    ],
    priseEnChargeBullets: [
      "Tri et classement des pièces selon une méthode convenue.",
      "Synthèses de lecture (lots, risques apparents, interfaces, points à clarifier).",
      "Repérage des exigences CCTP impactant le chiffrage (sans prix à votre place).",
      "Préparation de checklists de conformité documentaire (sur brief).",
    ],
    pourquoiParagraphs: [
      "Répondre sans avoir lu le bon CCTP, la bonne annexe ou les pénalités du CCAP expose à des impairs techniques et financiers. Une première lecture structurée réduit ce risque avant d’engager vos équipes sur le montage d’offre.",
    ],
    commentSteps: [
      "Réception du DCE et du calendrier cible.",
      "Travail de structuration et de questions / remarques.",
      "Remise pour revue interne avant décision de réponse.",
    ],
    deepeningLinks: [
      { href: "/reponse-appel-offres-btp", label: "Réponse appels d’offres" },
      { href: "/services/dce-bpu-dpgf", label: "Service DCE, BPU et DPGF" },
      { href: "/blog/comment-analyser-dce-btp", label: "Article : analyser un DCE" },
      { href: "/ressources/analyse-dce-btp", label: "Méthode analyse DCE (ressource éditoriale)" },
    ],
    seeAlsoSlugs: ["dce-bpu-dpgf", "memoire-technique-btp", "chiffrage-devis-btp"],
    neRemplacePas: [
      "Le chiffrage final et la stratégie de réponse à l’appel d’offres",
      "Le bureau d’études et les validations techniques engageantes",
    ],
    casUsage: [
      {
        titre: "Go / No-go avant montage d’offre",
        scenario: "DCE volumineux reçu avec délai court, équipe déjà mobilisée sur chantier.",
        resultat: "BeWork trie les pièces et produit une synthèse de lecture (lots, risques, points à clarifier) pour votre arbitrage interne.",
      },
    ],
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
    enResume:
      "Le PPSPS (plan particulier sécurité et protection santé) décrit l’organisation sécurité de votre entreprise sur un chantier donné.",
    erreursEviter: [
      "PPSPS copié-collé d’un autre chantier sans adaptation",
      "Rubriques obligatoires manquantes ou mal numérotées",
      "Validation sécurité sautée par manque de temps",
    ],
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
      { href: "/blog/quest-ce-qu-un-ppsps", label: "Article : qu’est-ce qu’un PPSPS ?" },
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
    metaTitle: "Mémoire technique BTP : assistance rédactionnelle | BeWork",
    metaDescription:
      "Mémoire technique BTP : plan, fil rouge et relecture pour une réponse AO lisible. Assistance technique documentaire — validation contenu chez vous.",
    h1: "Mémoire technique BTP : un fil clair pour une réponse lisible",
    intro:
      "Un mémoire technique doit démontrer votre méthode et votre compréhension du projet. BeWork aide à bâtir la structure, harmoniser le ton et intégrer vos contenus techniques, afin de livrer un dossier plus fluide à relire par la maîtrise d’ouvrage.",
    enResume:
      "Le mémoire technique BTP répond aux critères du règlement de consultation et démontre votre méthode, vos moyens et vos références pour le lot visé.",
    erreursEviter: [
      "Mémoire générique non aligné sur le CCTP du lot",
      "Critères RC non repris comme plan du document",
      "Références chantier non comparables au projet",
    ],
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
      { href: "/reponse-appel-offres-btp", label: "Réponse appels d’offres" },
      { href: "/blog/comment-rediger-memoire-technique-btp", label: "Article : rédiger un mémoire technique" },
      { href: "/ressources/memoire-technique-btp", label: "Ressource mémoire technique" },
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
    enResume:
      "Le chiffrage devis BTP transforme une consultation (plans, CCTP, visite) en offre chiffrée claire, défendable et envoyée à temps.",
    erreursEviter: [
      "Devis envoyé sans relecture marge et oublis de postes",
      "Relances clients absentes après envoi",
      "Prix fournisseurs non consolidés avant envoi",
    ],
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
    enResume:
      "Le DOE BTP regroupe les documents décrivant les ouvrages réalisés (plans as-built, notices, attestations) pour la réception et le récolement.",
    erreursEviter: [
      "Collecte des pièces uniquement en fin de chantier",
      "Notices fournisseurs jamais relancées",
      "Arborescence DOE différente de celle exigée au CCTP",
    ],
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
      { href: "/blog/comment-preparer-doe-chantier", label: "Article : préparer un DOE" },
      { href: "/ressources/doe-btp", label: "Ressource DOE" },
      { href: "/gestion-marche-public-btp", label: "Gestion marché public" },
    ],
    seeAlsoSlugs: ["compte-rendu-chantier", "ppsps"],
    faq: [
      {
        q: "BeWork certifie-t-elle la conformité réglementaire du DOE ?",
        a: "Non. BeWork apporte un appui de structuration et de suivi ; la conformité et la signature des livrables restent de votre responsabilité.",
      },
    ],
  },

  "conducteur-travaux-deborde": {
    slug: "conducteur-travaux-deborde",
    metaTitle: "Conducteur de travaux débordé : assistance bureau-chantier | BeWork",
    metaDescription:
      "Conducteur de travaux débordé ? Assistance technique et administrative : CR, relances, situations, dossiers marché. Assistants travaux augmentés par l’IA.",
    h1: "Conducteur de travaux débordé : faire avancer le bureau sans lâcher le chantier",
    intro:
      "Quand le carnet déborde, ce ne sont pas seulement les mails qui s’accumulent : ce sont les relances oubliées, les pièces manquantes et les dossiers qui traînent. BeWork absorbe le suivi documentaire et technique pour redonner des plages de pilotage réel — sans remplacer vos arbitrages terrain.",
    enResume:
      "Un conducteur de travaux débordé manque de temps bureau : BeWork prend l’assistance documentaire (CR, relances, situations, pièces marché) pendant qu’il tient le chantier.",
    erreursEviter: [
      "Tout garder en tête sans tableau de priorités",
      "Relances MOE ou fournisseurs repoussées chaque semaine",
      "Situations et factures préparées en urgence le vendredi soir",
    ],
    pourQuiBullets: [
      "Conducteurs de travaux sur plusieurs chantiers simultanés.",
      "Profils en entreprise générale, sous-traitance ou lot technique sous forte charge documentaire.",
    ],
    priseEnChargeBullets: [
      "Préparation de comptes rendus et synthèses de réunion (sur brief).",
      "Relances MOA, MOE, fournisseurs et sous-traitants dans le ton de votre entreprise.",
      "Suivi des situations, factures et pièces administratives (selon cadrage).",
      "Classement et coordination documentaire terrain ↔ bureau.",
    ],
    pourquoiParagraphs: [
      "Passer la soirée à relancer pour obtenir une attestation, c’est du temps volé au pilotage. Externaliser le relais documentaire sécurise le suivi sans diluer votre présence sur le terrain.",
    ],
    commentSteps: [
      "Brief : priorités, interlocuteurs, jalons et règles de validation.",
      "Traitement des demandes dans le cadre du forfait, avec reporting régulier.",
      "Validation finale systématique sur tout ce qui engage contractuellement ou techniquement.",
    ],
    deepeningLinks: [
      { href: "/services/assistant-conducteur-de-travaux", label: "Assistant conducteur de travaux (détail mission)" },
      { href: "/situation-travaux-btp", label: "Situations de travaux & suivi" },
      { href: "/tarifs", label: "Tarifs BeWork" },
    ],
    seeAlsoSlugs: ["assistant-conducteur-de-travaux", "assistant-travaux", "compte-rendu-chantier"],
    neRemplacePas: [
      "Le pilotage opérationnel du chantier et les décisions techniques",
      "La représentation officielle auprès du maître d’ouvrage à votre place",
      "Le bureau d’études, le coordinateur SPS ou le maître d’œuvre",
    ],
    casUsage: [
      {
        titre: "Semaine à trois réceptions",
        scenario: "Trois réceptions la même semaine, relances fournisseurs et CR en retard.",
        resultat: "BeWork traite les relances et prépare les CR à partir de vos notes — vous validez et signez.",
      },
    ],
    faq: [
      {
        q: "BeWork remplace-t-elle un second conducteur de travaux ?",
        a: "Non. BeWork apporte une assistance technique et administrative documentaire. Le pilotage terrain, les arbitrages et les engagements restent les vôtres.",
      },
      {
        q: "Quelle différence avec la page « assistant conducteur de travaux » ?",
        a: "La page « conducteur débordé » cible la situation de surcharge ; la page « assistant conducteur » détaille le périmètre mission par mission. Les deux renvoient au même service BeWork.",
      },
    ],
  },

  "assistant-moex": {
    slug: "assistant-moex",
    metaTitle: "Assistant MOEX / MOA : suivi documentaire marchés | BeWork",
    metaDescription:
      "Assistant MOEX et MOA BTP : relances, synthèses, dossiers et coordination documentaire pour maîtrise d’œuvre et maîtrise d’ouvrage. Validation chez vous.",
    h1: "Assistant MOEX / MOA : sécuriser le suivi documentaire des marchés travaux",
    intro:
      "Maîtrise d’ouvrage et maîtrise d’œuvre portent une charge documentaire dense : comptes rendus, validations, relances entreprises, pièces contractuelles. BeWork apporte un relais bureau-chantier pour structurer, suivre et relancer — sans se substituer à vos compétences MOA/MOEX.",
    pourQuiBullets: [
      "Assistants MOA, MOEX et chargés de mission en maîtrise d’ouvrage ou d’œuvre.",
      "Bureaux de maîtrise d’œuvre et AMO avec plusieurs opérations en parallèle.",
    ],
    priseEnChargeBullets: [
      "Préparation et mise en forme de comptes rendus et synthèses de réunion.",
      "Suivi des relances entreprises, lots et pièces attendues (sur brief).",
      "Classement des dossiers marché et checklists de conformité documentaire.",
      "Appui sur réserves, PV et dossiers de clôture (selon cadrage).",
    ],
    pourquoiParagraphs: [
      "Un oubli de relance ou une pièce mal classée peut retarder une validation MOA. Un relais cadré réduit ces frictions sans alourdir l’effectif permanent.",
    ],
    commentSteps: [
      "Cadrage du périmètre (opération, lots, interlocuteurs, formats).",
      "Traitement des demandes selon le forfait et les priorités convenues.",
      "Validation par vos référents MOA/MOEX avant diffusion engageante.",
    ],
    deepeningLinks: [
      { href: "/services/compte-rendu-chantier", label: "Service compte rendu de chantier" },
      { href: "/services/doe-btp", label: "Service DOE BTP" },
      { href: "/ressources/compte-rendu-chantier", label: "Méthode CR (ressource éditoriale)" },
    ],
    seeAlsoSlugs: ["compte-rendu-chantier", "doe-btp", "externalisation-administrative-btp"],
    neRemplacePas: [
      "Le rôle de maître d’œuvre ou de maître d’ouvrage",
      "Les validations techniques, réglementaires et contractuelles engageantes",
      "La direction de projet et la représentation officielle du MOA/MOEX",
    ],
    casUsage: [
      {
        titre: "Relances entreprises avant comité de pilotage",
        scenario: "Comité dans 48 h, pièces attendues de trois lots encore manquantes.",
        resultat: "BeWork relance, consolide les retours et prépare une synthèse des manquants — vous validez le contenu du comité.",
      },
    ],
    faq: [
      {
        q: "BeWork peut-elle signer des documents MOA/MOEX ?",
        a: "Non. BeWork prépare, structure et suit. La validation et la signature restent de la responsabilité de votre maîtrise d’ouvrage ou d’œuvre.",
      },
    ],
  },

  "dce-bpu-dpgf": {
    slug: "dce-bpu-dpgf",
    metaTitle: "DCE, BPU et DPGF BTP : analyse et structuration | BeWork",
    metaDescription:
      "DCE, BPU et DPGF BTP : assistance technique sur pièces marché, structuration des bordereaux et synthèses avant chiffrage. Validation chez vous.",
    h1: "DCE, BPU et DPGF : structurer les pièces marché avant de chiffrer",
    intro:
      "Un marché mal lu se paie au chiffrage ou en exécution. BeWork aide à trier le DCE, recouper CCTP et bordereaux (BPU, DPGF, DQE), repérer les incohérences et préparer des synthèses exploitables — sans substituer votre jugement d’entreprise ni votre bureau d’études.",
    pourQuiBullets: [
      "Chargés d’affaires et conducteurs impliqués dans les réponses aux AO.",
      "PME sans bureau d’études disponible immédiatement pour la première lecture.",
    ],
    priseEnChargeBullets: [
      "Tri et classement des pièces DCE selon une méthode convenue.",
      "Synthèses de lecture lots / risques / points à clarifier.",
      "Appui sur structuration BPU, DPGF ou tableaux de prix (sur vos modèles).",
      "Checklists de conformité documentaire avant montage d’offre.",
    ],
    pourquoiParagraphs: [
      "Confondre une annexe prix et le CCTP principal expose à des impairs. Une première structuration réduit ce risque avant d’engager vos équipes de chiffrage.",
    ],
    commentSteps: [
      "Réception du DCE et du calendrier cible.",
      "Travail de structuration, recoupement BPU/DPGF et questions / remarques.",
      "Remise pour revue interne avant décision de réponse et chiffrage.",
    ],
    deepeningLinks: [
      { href: "/services/analyse-dce-btp", label: "Service analyse DCE" },
      { href: "/services/chiffrage-devis-btp", label: "Service chiffrage & devis" },
      { href: "/ressources/analyse-dce-btp", label: "Méthode analyse DCE (ressource éditoriale)" },
    ],
    seeAlsoSlugs: ["analyse-dce-btp", "chiffrage-devis-btp", "memoire-technique-btp"],
    neRemplacePas: [
      "Le chiffrage final, les marges et la stratégie commerciale",
      "Le bureau d’études et les validations techniques engageantes",
      "La décision Go / No-go et la signature de l’offre",
    ],
    casUsage: [
      {
        titre: "BPU à recouper avec le CCTP",
        scenario: "Marché public avec DPGF volumineux et CCTP multi-lots reçu en fin de semaine.",
        resultat: "BeWork classe les pièces, signale les écarts apparents et prépare une synthèse par lot pour orienter votre chiffrage.",
      },
    ],
    faq: [
      {
        q: "BeWork chiffre-t-elle les ouvrages à votre place ?",
        a: "Non. BeWork structure et synthétise les pièces marché. Les prix, quantités et choix techniques restent validés par votre entreprise.",
      },
    ],
  },
};

/** Ordre d’affichage hub / sitemap */
export const SERVICE_PAGE_ORDER: ServicePageSlug[] = [
  "assistant-travaux",
  "assistant-conducteur-de-travaux",
  "conducteur-travaux-deborde",
  "assistant-chef-de-chantier",
  "assistant-moex",
  "externalisation-administrative-btp",
  "compte-rendu-chantier",
  "analyse-dce-btp",
  "dce-bpu-dpgf",
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
