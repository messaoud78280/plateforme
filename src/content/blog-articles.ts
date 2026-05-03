/**
 * Contenu des articles blog — source unique (liste, pages, sitemap, SEO).
 */

import {
  PLAN_KEYS,
  SUBSCRIPTION_PLANS,
  formatPriceLabelFr,
  getPublicPriceBoundsLabels,
} from "@/lib/subscription-plans";

function blogMonthlyTtcPlansList(): string {
  return PLAN_KEYS.map(
    (k) => `${SUBSCRIPTION_PLANS[k].name} ${formatPriceLabelFr(SUBSCRIPTION_PLANS[k].priceLabel)} €`
  ).join(", ");
}

const BW_PRICE_LOW_FR = formatPriceLabelFr(getPublicPriceBoundsLabels().low);
const BW_PLANS_TTC_COMMA = blogMonthlyTtcPlansList();

export type BlogBodyBlock = { type: "h2" | "p"; content: string };

export type BlogArticle = {
  title: string;
  description: string;
  /** Résumé carte sur /blog ; par défaut = description */
  excerpt?: string;
  keywords: string[];
  /** ISO 8601 — Open Graph & JSON-LD */
  publishedTime: string;
  modifiedTime?: string;
  /** Thème pour schema.org articleSection */
  articleSection?: string;
  body: BlogBodyBlock[];
};

export const BLOG_ARTICLES = {
  "10-taches-administratives-deleguer-dirigeant": {
    title: "10 tâches administratives à déléguer quand on est dirigeant",
    description:
      "Les 10 tâches administratives les plus chronophages à déléguer pour les dirigeants. Gagnez du temps et recentrez-vous sur votre cœur de métier.",
    excerpt:
      "Découvrez les tâches chronophages que les dirigeants peuvent déléguer pour gagner du temps et se recentrer sur leur cœur de métier.",
    keywords: [
      "déléguer administratif",
      "tâches administratives dirigeant",
      "assistant administratif externalisé",
      "gain de temps PME",
      "secrétariat à distance",
    ],
    publishedTime: "2025-07-08T09:00:00+01:00",
    articleSection: "Délégation & productivité",
    body: [
      { type: "h2", content: "1. Gestion des emails" },
      {
        type: "p",
        content:
          "Tri, priorisation et réponses simples : un assistant administratif externalisé peut traiter les messages courants et ne vous transmettre que l'essentiel.",
      },
      { type: "h2", content: "2. Devis et factures" },
      {
        type: "p",
        content:
          "Création, envoi et relance des devis et factures. Une tâche répétitive et chronophage que les dirigeants délèguent volontiers.",
      },
      { type: "h2", content: "3. Relances clients" },
      {
        type: "p",
        content:
          "Relances amiables ou formalisées des factures impayées. Votre assistant peut suivre le processus et vous alerter si nécessaire.",
      },
      { type: "h2", content: "4. Agenda et RDV" },
      {
        type: "p",
        content:
          "Planification des rendez-vous, coordination avec les participants, rappels. Un gain de temps considérable pour les dirigeants toujours sur le pont.",
      },
      { type: "h2", content: "5. Suivi des dossiers" },
      {
        type: "p",
        content:
          "Collecte des pièces, mise à jour CRM, alertes d'échéances. L'assistant administratif à distance garde la main sur le suivi des dossiers.",
      },
      { type: "h2", content: "6. Recherche fournisseurs" },
      {
        type: "p",
        content:
          "Demandes de devis, comparatifs, relances commandes. Une tâche qui prend beaucoup de temps et peut être externalisée.",
      },
      { type: "h2", content: "7. Saisie documentaire" },
      {
        type: "p",
        content:
          "Saisie, mise en forme et classement de documents. Les dirigeants peuvent déléguer cette charge pour se concentrer sur la stratégie.",
      },
      { type: "h2", content: "8. Pré-comptabilité" },
      {
        type: "p",
        content:
          "Classement des pièces, saisie des écritures courantes, transmission au comptable. Un flux propre sans mobiliser le dirigeant.",
      },
      { type: "h2", content: "9. Reporting simple" },
      {
        type: "p",
        content:
          "Mises à jour des tableaux de bord, KPI simples (CA, factures en attente). L'assistant prépare les données, le dirigeant analyse.",
      },
      { type: "h2", content: "10. Administration RH légère" },
      {
        type: "p",
        content:
          "Suivi des congés, notes de frais, mise à jour des dossiers. Des tâches essentielles mais chronophages à déléguer.",
      },
    ],
  },
  "combien-coute-assistant-administratif": {
    title: "Combien coûte un assistant administratif ?",
    description: `Comparatif des coûts : assistant administratif externalisé vs salarié. Dès ${BW_PRICE_LOW_FR} € TTC/mois chez BeWork pour les PME.`,
    excerpt:
      "Comparatif des tarifs : assistant administratif externalisé vs salarié. Ce que coûte vraiment l'externalisation pour les PME.",
    keywords: [
      "prix assistant administratif",
      "coût externalisation administrative",
      "assistant administratif salarié",
      "forfait administratif PME",
      "BeWork tarif",
    ],
    publishedTime: "2025-07-22T09:00:00+01:00",
    articleSection: "Tarifs & comparatifs",
    body: [
      { type: "h2", content: "Forfaits administratifs BeWork (BTP et PME)" },
      {
        type: "p",
        content: `Les offres sont en TTC, par mois : ${BW_PLANS_TTC_COMMA}. Chaque palier correspond à un niveau de structuration et de suivi, pas à une simple liste de tâches. Pas de charges sociales ni de recrutement à porter pour ce périmètre.`,
      },
      { type: "h2", content: "Poste en interne : ordre de grandeur du coût" },
      {
        type: "p",
        content:
          "Un administratif en CDI en Europe représente souvent plus de 5 000 €/mois charges comprises (salaire, cotisations, équipement, temps RH). Un forfait externalisé ne remplace pas toujours un plein temps, mais il évite de créer un poste pour une charge irrégulière.",
      },
      { type: "h2", content: "Externaliser : autre logique de coût, autre cadre" },
      {
        type: "p",
        content:
          "Vous achetez un volume de prestations défini dans un contrat, pas une disponibilité illimitée. Utile lorsque l’embauche n’est pas le bon levier ou lorsque vous voulez structurer l’administratif sans alourdir la structure.",
      },
    ],
  },
  "assistant-virtuel-vs-assistant-salarie": {
    title: "Assistant virtuel vs assistant salarié",
    description:
      "Comparatif assistant administratif externalisé vs recrutement interne. Avantages et inconvénients pour les PME.",
    excerpt:
      "Avantages et inconvénients de l'assistant administratif externalisé face à un recrutement interne. Pour qui, pour quoi ?",
    keywords: [
      "assistant virtuel",
      "assistant salarié",
      "externalisation vs recrutement",
      "secrétariat externalisé PME",
    ],
    publishedTime: "2025-08-05T09:00:00+01:00",
    articleSection: "Tarifs & comparatifs",
    body: [
      { type: "h2", content: "Assistant virtuel (externalisé) : avantages" },
      {
        type: "p",
        content: `Coût maîtrisé (dès ${BW_PRICE_LOW_FR} € TTC/mois), pas de recrutement, pas de charges sociales, scalabilité selon les besoins, opérationnel rapidement, supervision en France avec BeWork.`,
      },
      { type: "h2", content: "Assistant salarié : avantages" },
      {
        type: "p",
        content:
          "Présence physique possible, lien direct si besoin d'un bureau sur site. En revanche, coût élevé (~5 050€/mois), charges, recrutement, formation.",
      },
      { type: "h2", content: "Pour qui choisir quoi ?" },
      {
        type: "p",
        content:
          "L'assistant virtuel convient aux PME qui veulent externaliser administratif sans recruter, aux dirigeants surchargés, aux entreprises qui souhaitent scaler sans engagement long terme. L'assistant salarié reste pertinent si une présence physique est indispensable.",
      },
    ],
  },
  "gagner-5-heures-semaine-deleguer-administratif": {
    title: "Comment gagner 5 heures par semaine en déléguant l'administratif",
    description:
      "Conseils pratiques pour identifier les tâches à déléguer et libérer du temps avec un assistant administratif externalisé.",
    excerpt:
      "Conseils pratiques pour identifier les tâches à déléguer et libérer du temps grâce à un assistant administratif externalisé.",
    keywords: [
      "gagner du temps dirigeant",
      "déléguer administratif",
      "productivité PME",
      "assistant administratif à distance",
    ],
    publishedTime: "2025-08-19T09:00:00+01:00",
    articleSection: "Délégation & productivité",
    body: [
      { type: "h2", content: "Identifiez les tâches chronophages" },
      {
        type: "p",
        content:
          "Listez pendant une semaine ce qui vous prend du temps : emails, facturation, relances, agenda. Ces tâches sont les premières candidates à la délégation.",
      },
      { type: "h2", content: "Priorisez ce qui peut être externalisé" },
      {
        type: "p",
        content:
          "Tout ce qui est répétitif, cadré par des process, ne nécessite pas une décision stratégique peut être délégué. Un assistant administratif externalisé gère devis, factures, relances, suivi de dossiers.",
      },
      { type: "h2", content: "Démarrez progressivement" },
      {
        type: "p",
        content:
          "Commencez par une ou deux missions pilotes (ex. relances factures, agenda). Validez les livrables, affinez les consignes, puis élargissez le périmètre.",
      },
      { type: "h2", content: "Résultat : 5 h et plus par semaine" },
      {
        type: "p",
        content:
          "Avec un assistant BeWork, les dirigeants récupèrent en moyenne 5 à 20 heures par semaine selon le volume délégué. Temps réinvesti dans le développement commercial, la stratégie ou la vie personnelle.",
      },
    ],
  },
  "externaliser-assistant-administratif-avantages": {
    title: "Externaliser son assistant administratif : 7 avantages concrets pour une PME",
    description:
      "Pourquoi externaliser votre assistant administratif ? 7 bénéfices concrets pour les dirigeants de PME : coûts, flexibilité, continuité de service et qualité.",
    excerpt:
      "Coût, flexibilité, continuité de service… Découvrez les bénéfices concrets de l'externalisation pour les dirigeants de PME.",
    keywords: [
      "externaliser assistant administratif",
      "avantages externalisation administrative",
      "PME secrétariat",
      "continuité service administratif",
    ],
    publishedTime: "2025-09-02T09:00:00+01:00",
    articleSection: "Délégation & productivité",
    body: [
      { type: "h2", content: "1. Un coût maîtrisé et prévisible" },
      {
        type: "p",
        content:
          "Avec un assistant administratif externalisé, vous payez un forfait clair, sans charges sociales, sans bureau ni matériel. Le coût devient une ligne de service, pas une masse salariale fixe.",
      },
      { type: "h2", content: "2. Une montée en charge plus simple" },
      {
        type: "p",
        content:
          "Quand le volume de dossiers augmente, vous ajustez votre forfait au lieu de recruter une nouvelle personne. Idéal pour les saisons hautes, les pics d’activité ou les périodes de croissance.",
      },
      { type: "h2", content: "3. Moins de risques RH" },
      {
        type: "p",
        content:
          "Absences, turn-over, recrutement raté… Autant de risques pris en charge par le prestataire. Votre continuité de service administratif est assurée, même en cas d’imprévu.",
      },
      { type: "h2", content: "4. Une expertise mutualisée" },
      {
        type: "p",
        content:
          "Les assistants externalisés travaillent pour plusieurs clients, secteurs et outils. Ils capitalisent sur ces expériences pour vous proposer de meilleures pratiques et des idées d’optimisation.",
      },
      { type: "h2", content: "5. Un démarrage rapide" },
      {
        type: "p",
        content:
          "Inutile d’attendre des semaines entre l’offre, le recrutement, l’onboarding. Avec BeWork, un assistant peut être opérationnel en quelques jours après votre rendez-vous découverte et la définition de votre périmètre.",
      },
      { type: "h2", content: "6. Une direction et un suivi structurés" },
      {
        type: "p",
        content:
          "Les assistants sont encadrés par une équipe de pilotage. Vous n’êtes pas seul à gérer l’organisation de l’administratif : l’agence vous accompagne et suit la qualité au quotidien.",
      },
      { type: "h2", content: "7. Un levier pour vous concentrer sur le développement" },
      {
        type: "p",
        content:
          "Moins de temps dans les mails, la facturation et les relances = plus de temps pour vos clients, vos offres, votre développement commercial. Externaliser l’administratif devient un levier de croissance, pas seulement une charge.",
      },
    ],
  },
  "organiser-journee-dirigeant-avec-assistant": {
    title: "Comment organiser votre journée de dirigeant avec l’aide d’un assistant administratif",
    description:
      "Modèle de journée type pour un dirigeant qui travaille avec un assistant administratif externalisé : priorisation, délégation et rituels de suivi.",
    excerpt:
      "Exemple de journée type pour mieux prioriser, déléguer et garder du temps pour le développement de votre entreprise.",
    keywords: [
      "organisation dirigeant",
      "journée type entrepreneur",
      "rituels délégation",
      "assistant administratif organisation",
    ],
    publishedTime: "2025-09-16T09:00:00+01:00",
    articleSection: "Délégation & productivité",
    body: [
      { type: "h2", content: "Matin : prioriser et déléguer" },
      {
        type: "p",
        content:
          "Commencez la journée par 15 minutes de revue avec votre assistant : mails importants, urgences, relances à prévoir. Tout ce qui est répétitif ou administratif part en mission dans BeWork.",
      },
      { type: "h2", content: "Milieu de journée : focus business" },
      {
        type: "p",
        content:
          "Bloquez des plages sans interruption pour vos rendez-vous clients, vos propositions commerciales ou votre production. Pendant ce temps, l’assistant traite les flux administratifs en arrière-plan.",
      },
      { type: "h2", content: "Fin de journée : point rapide et préparation du lendemain" },
      {
        type: "p",
        content:
          "En 10 à 20 minutes, faites le point : missions terminées, dossiers en attente, prochaines échéances. Ce rituel simple vous permet de fermer la journée l’esprit plus léger.",
      },
      { type: "h2", content: "Mettre en place des rituels hebdomadaires" },
      {
        type: "p",
        content:
          "Ajoutez un point hebdomadaire plus long (30 minutes) pour revoir les KPIs : nombre de missions, factures envoyées, relances, dossiers clos. Votre assistant prépare le reporting, vous prenez les décisions.",
      },
      { type: "h2", content: "Résultat : moins de charge mentale, plus de clarté" },
      {
        type: "p",
        content:
          "Avec un minimum de rituels, votre administratif cesse d’être une fuite de temps permanente et devient un processus cadré, piloté en binôme avec votre assistant.",
      },
    ],
  },
  "erreurs-a-eviter-deleguer-administratif": {
    title: "5 erreurs à éviter quand vous commencez à déléguer votre administratif",
    description:
      "Les pièges classiques à éviter lorsqu’on démarre avec un assistant administratif externalisé : périmètre flou, consignes incomplètes, absence de suivi… et comment faire mieux.",
    excerpt:
      "Périmètre flou, consignes incomplètes, manque de feedback… Les pièges à éviter pour une collaboration efficace.",
    keywords: [
      "déléguer administratif erreurs",
      "collaboration assistant virtuel",
      "onboarding assistant administratif",
    ],
    publishedTime: "2025-09-30T09:00:00+01:00",
    articleSection: "Délégation & productivité",
    body: [
      { type: "h2", content: "1. Ne pas définir clairement le périmètre" },
      {
        type: "p",
        content:
          "« Tu t’occupes de l’administratif » est trop vague. Listez les types de missions : devis, factures, relances, pré-comptabilité, suivi de dossiers… Plus le périmètre est clair, plus la collaboration est fluide.",
      },
      { type: "h2", content: "2. Garder toutes les décisions pour soi" },
      {
        type: "p",
        content:
          "Si votre assistant doit valider chaque détail avec vous, vous ne gagnez pas de temps. Donnez des règles de décision : montants seuils, modèles de réponse, cas où il peut agir en autonomie.",
      },
      { type: "h2", content: "3. Oublier de partager les outils et accès" },
      {
        type: "p",
        content:
          "Pour bien travailler, l’assistant a besoin d’accéder à vos outils (facturation, CRM, agenda…). Prévoyez une mise à disposition sécurisée et documentée dès le démarrage.",
      },
      { type: "h2", content: "4. Ne pas donner de feedback" },
      {
        type: "p",
        content:
          "Les premières missions servent à caler votre façon de travailler. Prenez le temps de dire ce qui vous convient, ce qui doit être ajusté. C’est un investissement qui se rentabilise très vite.",
      },
      { type: "h2", content: "5. Vouloir tout déléguer d’un coup" },
      {
        type: "p",
        content:
          "Commencez par un bloc de missions ciblé (ex. facturation + relances), puis élargissez progressivement. Vous gardez le contrôle, tout en faisant monter votre assistant en puissance.",
      },
      { type: "h2", content: "Bien démarrer la délégation" },
      {
        type: "p",
        content:
          "En évitant ces erreurs, vous transformez rapidement la délégation en vrai levier de confort et de croissance. L’objectif : moins de charge mentale, plus de temps utile pour votre entreprise.",
      },
    ],
  },
  "situation-travaux-btp-obligations-conseils": {
    title: "Situation de travaux dans le BTP : obligations, calendrier et aide administrative",
    description:
      "Comprendre le rôle de la situation de travaux sur chantier, les bonnes pratiques de mise à jour et comment un support administratif peut structurer vos envois sans remplacer votre expertise technique.",
    excerpt:
      "Obligations, fréquence et contenu d’une situation de travaux : clarifier le cadre et alléger la charge documentaire côté entreprise.",
    keywords: [
      "situation de travaux BTP",
      "situation travaux artisan",
      "gestion administrative chantier",
      "suivi chantier documentaire",
      "administratif entreprise bâtiment",
    ],
    publishedTime: "2026-02-12T09:00:00+01:00",
    modifiedTime: "2026-03-29T10:00:00+01:00",
    articleSection: "BTP & artisans",
    body: [
      {
        type: "h2",
        content: "À quoi sert une situation de travaux ?",
      },
      {
        type: "p",
        content:
          "La situation de travaux fait le lien entre l’avancement réel du chantier, les montants facturés et souvent les acomptes ou les paiements. C’est un outil de transparence pour le client comme pour votre trésorerie : elle évite les malentendus sur les quantités, les lots ou les avenants.",
      },
      {
        type: "h2",
        content: "Fréquence et contenu : rester lisible",
      },
      {
        type: "p",
        content:
          "La bonne pratique consiste à caler la fréquence sur le contrat ou les usages du marché (mensuelle, par phase, ou à jalons). Un document trop technique ou trop long n’est pas lu ; un document clair, avec photos ou références de lots, sécurise la relation. Anticipez les pièces attendues par le maître d’ouvrage ou le bureau de contrôle.",
      },
      {
        type: "h2",
        content: "Structurer le flux sans perdre le contrôle",
      },
      {
        type: "p",
        content:
          "Beaucoup d’artisans savent parfaitement où en est le chantier, mais manquent de temps pour formaliser. Un assistant administratif peut préparer les modèles, centraliser les données, relancer les sous-traitants pour les pièces manquantes et mettre en forme le dossier avant validation finale par vous. La signature et le fond technique restent votre responsabilité.",
      },
      {
        type: "h2",
        content: "Lien avec facturation et relances",
      },
      {
        type: "p",
        content:
          "Une situation de travaux à jour facilite la facturation au fil de l’eau et les relances sur les acomptes. En alignant calendrier des situations, échéancier contractuel et suivi des paiements, vous réduisez les décalages de trésorerie — un enjeu majeur pour les TPE et PME du bâtiment.",
      },
    ],
  },
  "dict-declaration-travaux-artisan-administratif": {
    title: "DICT et déclarations de travaux : ce que l’artisan peut préparer en administratif",
    description:
      "Rappel sur les dossiers DICT et déclarations préalables, les étapes chronophages et comment déléguer la préparation des pièces et le suivi tout en gardant la maîtrise des engagements sur le terrain.",
    excerpt:
      "DICT, déclarations : quelles pièces, quels délais, et comment un assistant peut structurer le dossier pendant que vous restez sur le chantier.",
    keywords: [
      "DICT travaux",
      "déclaration préalable travaux",
      "dossier administratif chantier",
      "artisan BTP démarches",
      "externalisation administrative BTP",
    ],
    publishedTime: "2026-02-26T09:00:00+01:00",
    modifiedTime: "2026-03-29T10:00:00+01:00",
    articleSection: "BTP & artisans",
    body: [
      {
        type: "h2",
        content: "DICT et déclarations : deux sujets distincts",
      },
      {
        type: "p",
        content:
          "La déclaration préalable ou l’autorisation d’urbanisme répondent au droit de l’urbanisme. La démarche DICT (déclaration d’intention de commencement de travaux) concerne les réseaux et l’information des opérateurs. Les deux génèrent des délais, des pièces et des échanges : autant de tâches qui pèsent sur l’agenda du chef d’entreprise.",
      },
      {
        type: "h2",
        content: "Ce qui prend du temps en coulisse",
      },
      {
        type: "p",
        content:
          "Constituer le dossier, suivre les accusés de réception, relancer les services ou gestionnaires de réseaux, archiver les réponses et les transmettre au bureau d’études ou au client : ce sont des missions administratives répétitives. Les oublis ou retards peuvent coûter cher en planning ; une organisation claire limite les risques.",
      },
      {
        type: "h2",
        content: "Ce qu’un assistant peut faire pour vous",
      },
      {
        type: "p",
        content:
          "Préparation de courriers types, suivi de calendrier, classement des réponses, relances téléphoniques ou mails encadrés, mise à jour d’un tableau de suivi par chantier : tout cela peut être délégué selon vos consignes. BeWork accompagne les entreprises du bâtiment sur ce type de flux, avec validation systématique de votre part avant tout engagement formel.",
      },
      {
        type: "h2",
        content: "Ce qui reste entre vos mains",
      },
      {
        type: "p",
        content:
          "Le choix des dates d’intervention, l’interprétation des contraintes techniques, la relation avec le conducteur d’opérations et la responsabilité finale sur le chantier vous appartiennent. L’objectif du support administratif est de vous libérer du « papier » et des relances, pas de remplacer votre expertise métier.",
      },
    ],
  },
  "facturation-chantier-btp-relances-tresorerie": {
    title: "Facturation de chantier et relances : sécuriser la trésorerie dans le BTP",
    description:
      "Acomptes, situations de travaux, retenue de garantie et relances : bonnes pratiques pour les artisans et PME du bâtiment afin d’aligner facturation et encaissements.",
    excerpt:
      "Du devis à la relance : comment structurer la facturation chantier pour limiter les impayés et les tensions de trésorerie.",
    keywords: [
      "facturation chantier BTP",
      "relance facture artisan",
      "acompte chantier",
      "retenue de garantie",
      "trésorerie entreprise bâtiment",
    ],
    publishedTime: "2026-03-05T09:00:00+01:00",
    modifiedTime: "2026-03-29T10:00:00+01:00",
    articleSection: "BTP & artisans",
    body: [
      {
        type: "h2",
        content: "Facturer au bon rythme",
      },
      {
        type: "p",
        content:
          "Sur les chantiers longs, la facturation en fin de mission seule expose à de gros écarts de trésorerie. Les acomptes et les situations de travaux permettent de lisser les encaissements. Formalisez dans le devis ou le contrat les modalités (pourcentages, jalons, délais de paiement) pour éviter les négociations tendues en cours de route.",
      },
      {
        type: "h2",
        content: "Retenue de garantie et réserves",
      },
      {
        type: "p",
        content:
          "Anticipez dans vos documents les effets de la retenue de garantie et des levées de réserves sur votre cash. Un suivi rigoureux des factures émises, des avoirs et des avenants évite les oublis qui prolongent les délais de paiement.",
      },
      {
        type: "h2",
        content: "Relances : process et calendrier",
      },
      {
        type: "p",
        content:
          "Une relance efficace est régulière, traçable et adaptée au client (amiable puis plus ferme si besoin). Automatiser les rappels à J+5, J+15, J+30 avec des modèles validés par vous améliore le taux d’encaissement sans passer pour « agressif ». Les mises en demeure et sujets juridiques sensibles doivent toujours être validés par le dirigeant.",
      },
      {
        type: "h2",
        content: "Rôle d’un assistant administratif externalisé",
      },
      {
        type: "p",
        content:
          "Préparation des factures à partir de vos données chantier, envoi, suivi des accusés, relances cadrées et reporting des impayés : ce sont des missions typiques pour BeWork. Vous gardez la décision commerciale et juridique ; l’équipe sécurise le flux et le classement.",
      },
    ],
  },
  "pourquoi-artisan-batiment-externalise-administratif": {
    title: "Pourquoi les artisans du bâtiment externalisent leur administratif (sans recruter)",
    description:
      "Temps sur le chantier vs paperasse : pourquoi l'externalisation administrative convient au BTP, quelles tâches déléguer, et pourquoi c'est souvent plus pertinent qu'une embauche à temps plein.",
    excerpt:
      "Le chantier n'attend pas pendant que les emails et factures s'accumulent : externaliser l'administratif, sans recruter, pour sécuriser trésorerie et image pro.",
    keywords: [
      "administratif artisan bâtiment",
      "externalisation administrative BTP",
      "secrétariat entreprise travaux",
      "TPE BTP organisation",
      "déléguer administratif chantier",
      "forfait administratif sans embauche",
      "BeWork BTP",
    ],
    publishedTime: "2026-03-20T09:00:00+01:00",
    modifiedTime: "2026-03-29T14:00:00+01:00",
    articleSection: "BTP & artisans",
    body: [
      {
        type: "h2",
        content: "Le chantier n'attend pas, l'administratif s'accumule",
      },
      {
        type: "p",
        content:
          "Dans le bâtiment, le temps est une ressource critique. Entre la gestion des équipes, les déplacements, les imprévus et la pression des délais, les artisans sont constamment sollicités sur le terrain.",
      },
      {
        type: "p",
        content:
          "Pendant ce temps, l'administratif continue de s'accumuler : emails en attente, devis non envoyés, factures en retard, relances oubliées.",
      },
      {
        type: "p",
        content:
          "Ce décalage a un impact direct sur l'activité. Un devis envoyé tardivement peut faire perdre un chantier. Une facture oubliée ralentit les encaissements. Une mauvaise organisation fragilise la trésorerie.",
      },
      {
        type: "p",
        content:
          "Recruter une assistante administrative à temps plein n'est pas toujours adapté, notamment lorsque le volume de travail est irrégulier. À l'inverse, négliger cette partie expose à des pertes financières et à une dégradation de l'image professionnelle.",
      },
      {
        type: "h2",
        content: "L'externalisation : une solution souple et adaptée au BTP",
      },
      {
        type: "p",
        content:
          "De plus en plus d'artisans choisissent d'externaliser leur gestion administrative. Cette approche permet d'adapter le niveau de service en fonction de l'activité, sans supporter les contraintes liées à une embauche.",
      },
      {
        type: "p",
        content:
          "L'externalisation repose sur un fonctionnement simple : un forfait mensuel, sans engagement, qui permet de déléguer tout ou partie des tâches administratives.",
      },
      {
        type: "p",
        content:
          "Elle offre plusieurs avantages : souplesse d'utilisation, coût maîtrisé, absence de charges sociales, aucun management à prévoir.",
      },
      {
        type: "p",
        content:
          "L'artisan peut ainsi se concentrer sur son cœur de métier tout en conservant la maîtrise de ses décisions.",
      },
      {
        type: "h2",
        content: "Quelles tâches administratives externaliser dans le bâtiment ?",
      },
      {
        type: "p",
        content:
          "L'administratif dans le BTP ne se limite pas à la facturation. Il englobe un ensemble de missions essentielles au bon fonctionnement de l'activité.",
      },
      {
        type: "p",
        content:
          "Gestion commerciale : création et envoi de devis, facturation, situations de travaux, suivi des paiements, relances clients.",
      },
      {
        type: "p",
        content:
          "Logistique et fournisseurs : passage de commandes de matériaux, suivi des fournisseurs, organisation des livraisons sur chantier, coordination avec les équipes, gestion des retards.",
      },
      {
        type: "p",
        content:
          "Organisation des chantiers : planification des interventions, prise de rendez-vous, gestion des accès, coordination des différents intervenants.",
      },
      {
        type: "p",
        content:
          "Démarches administratives réglementaires : préparation des dossiers DICT et DT, déclarations de travaux, demandes d'autorisations auprès des mairies, gestion des arrêtés, suivi des obligations administratives.",
      },
      {
        type: "p",
        content:
          "Moyens matériels : organisation des locations d'engins de chantier, réservation de matériel, location de véhicules, coordination des besoins.",
      },
      {
        type: "p",
        content:
          "Gestion des litiges : relances d'impayés, préparation de mises en demeure, suivi administratif des dossiers en cours.",
      },
      {
        type: "p",
        content:
          "Organisation et structuration : classement des documents, centralisation des informations, mise en place de processus simples et efficaces.",
      },
      {
        type: "h2",
        content: "Externalisation ou recrutement : un choix économique",
      },
      {
        type: "p",
        content:
          "L'embauche d'un salarié administratif représente un coût global souvent sous-estimé. Au-delà du salaire, il faut intégrer les charges sociales, les congés, le matériel, le temps de formation et le management.",
      },
      {
        type: "p",
        content:
          "À l'inverse, l'externalisation permet de transformer ces coûts en une charge fixe et prévisible. Le service s'adapte aux besoins réels de l'entreprise, sans engagement ni contrainte.",
      },
      {
        type: "p",
        content:
          "Cette approche permet de mieux piloter les dépenses tout en bénéficiant d'un support opérationnel immédiat.",
      },
      {
        type: "h2",
        content: "Une meilleure organisation pour une activité plus rentable",
      },
      {
        type: "p",
        content:
          "Dans le bâtiment, les pertes financières ne viennent pas uniquement du terrain. Elles sont souvent liées à une organisation insuffisante.",
      },
      {
        type: "p",
        content:
          "Une gestion administrative structurée permet d'accélérer l'envoi des devis, de sécuriser la facturation, d'améliorer le suivi client et de limiter les oublis.",
      },
      {
        type: "p",
        content:
          "Cela se traduit concrètement par une meilleure trésorerie, une activité plus fluide et une image professionnelle renforcée.",
      },
      {
        type: "h2",
        content: "Une approche pensée pour le terrain",
      },
      {
        type: "p",
        content:
          "Tous les services administratifs ne répondent pas aux réalités du bâtiment. Les spécificités du secteur exigent une compréhension précise des contraintes quotidiennes.",
      },
      {
        type: "p",
        content:
          "Une solution efficace repose sur une approche pragmatique : vocabulaire métier, priorités adaptées, traitement rapide des tâches essentielles.",
      },
      {
        type: "p",
        content:
          "L'objectif n'est pas d'ajouter de la complexité, mais de simplifier l'organisation et de rendre l'administratif plus fluide.",
      },
      {
        type: "h2",
        content: "Conclusion",
      },
      {
        type: "p",
        content:
          "Dans le bâtiment, la valeur se crée sur le terrain. L'administratif doit soutenir l'activité, pas la ralentir.",
      },
      {
        type: "p",
        content:
          "Externaliser cette partie permet de gagner du temps, de sécuriser les processus et de structurer son entreprise sans contrainte.",
      },
      {
        type: "p",
        content:
          "C'est un levier simple et efficace pour améliorer son organisation et se concentrer sur l'essentiel.",
      },
    ],
  },
  "bureau-chantier-administratif-btp-sans-recruter": {
    title:
      "Bureau et chantier : structurer l’administratif BTP sans recruter (devis, relances, dossiers)",
    description:
      "Comment séparer clairement bureau et chantier, prioriser les tâches administratives du BTP et gagner en régularité sans embauche — avec une agence de pilotage administratif encadrée.",
    excerpt:
      "Le chantier paie les factures ; le bureau les sécurise. Voici une grille simple pour structurer l’administratif BTP sans recruter.",
    keywords: [
      "agence pilotage administratif BTP",
      "administratif artisan bâtiment",
      "structuration administrative sans embauche",
      "devis et facturation chantier",
      "relances clients BTP",
      "organisation TPE BTP",
      "externalisation administrative BTP",
      "BeWork BTP",
    ],
    publishedTime: "2026-04-11T09:00:00+02:00",
    modifiedTime: "2026-04-11T09:00:00+02:00",
    articleSection: "BTP & artisans",
    body: [
      {
        type: "h2",
        content: "Deux vitesses, un seul objectif : la marge et la trésorerie",
      },
      {
        type: "p",
        content:
          "Sur le chantier, tout va vite : planning, matériaux, sous-traitants, imprévus. Au bureau, il faut de la constance : devis clairs, factures à jour, relances régulières, dossiers DICT et situations de travaux bien tenus. Quand les deux se mélangent sans cadre, c’est souvent le bureau qui perd — et avec lui les encaissements.",
      },
      {
        type: "p",
        content:
          "Structurer l’administratif, ce n’est pas « faire plus de paperasse » : c’est verrouiller un minimum de flux (commercial, facturation, suivi client, réglementaire) pour que le terrain puisse enchaîner les chantiers sans revenir en arrière chaque semaine.",
      },
      {
        type: "h2",
        content: "Ce qui doit sortir de votre tête (sans perdre le contrôle)",
      },
      {
        type: "p",
        content:
          "Les dirigeants BTP gardent naturellement les décisions à fort enjeu : prix, avenants, contentieux sensibles, choix fournisseurs critiques. En revanche, la préparation, le classement, les relances de niveau 1, la mise en forme des pièces et le suivi des échéances peuvent être délégués — à condition d’avoir un périmètre écrit, des validations claires et des priorités terrain.",
      },
      {
        type: "p",
        content:
          "Une agence de pilotage administratif sert de relais : elle exécute dans un cadre défini, remonte ce qui bloque, et évite que les tâches répétitives saturent votre semaine.",
      },
      {
        type: "h2",
        content: "Une grille simple : urgent / important / récurrent",
      },
      {
        type: "p",
        content:
          "Urgent terrain : ce qui fait tourner le chantier demain (accès, livraison, coordination). Important bureau : devis à envoyer, factures à émettre, impayés qui traînent, dossiers réglementaires avec date butoir. Récurrent : modèles de documents, relances planifiées, points de suivi hebdomadaires.",
      },
      {
        type: "p",
        content:
          "Beaucoup d’artisans excellent sur l’urgent terrain mais repoussent l’important bureau — jusqu’à ce que la trésorerie ou un client le rappelle à l’ordre. Un pilotage administratif vise à traiter l’important avant qu’il devienne urgent.",
      },
      {
        type: "h2",
        content: "Sans recruter : pourquoi le forfait peut mieux coller au BTP",
      },
      {
        type: "p",
        content:
          "L’embauche administrative impose un volume régulier, du management et des coûts fixes. Or l’activité du bâtiment est souvent cyclique : gros mois de chiffrage, puis période chargée sur le terrain. Un accompagnement externalisé permet d’ajuster le niveau de service au rythme réel, avec un coût maîtrisé et des engagements adaptés.",
      },
      {
        type: "p",
        content:
          "L’enjeu n’est pas de remplacer votre jugement métier, mais de tenir le bureau aussi sérieusement que le chantier — sans y passer vos soirées.",
      },
      {
        type: "h2",
        content: "Conclusion",
      },
      {
        type: "p",
        content:
          "Si vous sentez que le bureau ralentit le chantier (retards de devis, relances irrégulières, dossiers qui s’empilent), commencez par clarifier le périmètre déléguable et les validations. C’est souvent le premier pas le plus rentable — avant même d’optimiser un outil ou de recruter.",
      },
      {
        type: "p",
        content:
          "Chez BeWork, nous positionnons ce relais comme un pilotage administratif encadré pour le BTP : méthode terrain, forfaits TTC, et priorisation avec vous. Pour en parler concrètement sur votre activité, le rendez-vous découverte permet de cadrer besoins et périmètre sans engagement.",
      },
    ],
  },
  "relance-devis-btp-augmenter-signatures": {
    title: "Relancer un devis dans le BTP : méthode pour signer plus de chantiers",
    description:
      "Devis envoyés trop tard, relances irrégulières, clients qui disparaissent : une méthode simple pour relancer sans harceler, suivre vos devis et augmenter le taux de signature.",
    excerpt:
      "Une méthode concrète pour relancer les devis BTP (J+2, J+7, J+14), garder la main sur le suivi et signer plus de chantiers sans y passer vos soirées.",
    keywords: [
      "relance devis BTP",
      "suivi devis artisan",
      "signer plus de chantiers",
      "process relance client",
      "devis chantier relance",
      "pilotage administratif BTP",
    ],
    publishedTime: "2026-04-13T09:00:00+02:00",
    articleSection: "Commercial & suivi",
    body: [
      { type: "h2", content: "Pourquoi les devis se perdent (souvent) côté suivi" },
      {
        type: "p",
        content:
          "Dans le BTP, vous êtes sur le terrain. Le client, lui, compare, hésite, change de priorité. Sans relance régulière, un devis “en attente” devient vite un devis “oublié”. Ce n’est pas un problème de compétence : c’est un problème de rythme et de méthode.",
      },
      { type: "h2", content: "La règle d’or : relancer tôt, puis cadrer" },
      {
        type: "p",
        content:
          "Une relance efficace n’est pas agressive : elle est rapide, factuelle et utile. L’objectif est d’obtenir une réponse (oui / non / à quelle date) et de sécuriser les prochaines étapes (visite, ajustement, délai).",
      },
      { type: "h2", content: "Le scénario simple (qui marche) : J+2, J+7, J+14" },
      {
        type: "p",
        content:
          "J+2 : confirmation de bonne réception + question courte (un point bloquant ?). J+7 : relance avec une proposition (créneau d’appel / visite). J+14 : relance plus ferme mais professionnelle (délai de validité, planning, capacité). Entre chaque étape, vous notez le statut et la prochaine action.",
      },
      { type: "h2", content: "Ce qu’il faut tracer (sinon vous relancez “dans le vide”)" },
      {
        type: "p",
        content:
          "Au minimum : date d’envoi, montant, décision attendue, date de prochaine relance, canal (appel/mail), réponse client. Sans ce mini-tableau, vous perdez du temps à reconstituer l’historique — et vous relancez trop tard.",
      },
      { type: "h2", content: "Externaliser le suivi : ce qui se délègue, ce qui reste chez vous" },
      {
        type: "p",
        content:
          "Se délègue : préparation des messages, relances cadrées, mise à jour du suivi, reporting. Reste chez vous : validation du prix, arbitrages techniques, décision commerciale sur les concessions. C’est exactement la logique d’un pilotage administratif : tenir le suivi, sans vous retirer la décision.",
      },
      { type: "h2", content: "Conclusion" },
      {
        type: "p",
        content:
          "Si vous avez “des devis en attente” chaque semaine, ce n’est pas normal : c’est un manque de système. Une méthode simple + un suivi tenu dans le temps font souvent la différence entre un carnet plein et des semaines creuses.",
      },
    ],
  },
  "avenant-chantier-btp-process": {
    title: "Avenants chantier BTP : le process administratif pour éviter les litiges",
    description:
      "Avenants, travaux supplémentaires, ajustements : comment cadrer la demande, faire valider et archiver les pièces pour sécuriser votre chiffre d’affaires et éviter les “oui mais…” en fin de chantier.",
    excerpt:
      "Un process simple pour gérer les avenants : demande, chiffrage, validation, traçabilité. Objectif : sécuriser vos marges et votre encaissement.",
    keywords: [
      "avenant chantier",
      "travaux supplémentaires BTP",
      "process avenant",
      "litige chantier prévention",
      "facturation travaux supplémentaires",
      "suivi administratif chantier",
    ],
    publishedTime: "2026-04-13T09:00:00+02:00",
    articleSection: "Chantier & conformité",
    body: [
      { type: "h2", content: "Le risque : faire, puis “régulariser plus tard”" },
      {
        type: "p",
        content:
          "Sur le terrain, on avance. Mais sur le papier, un avenant mal cadré finit en discussion (ou en impayé). Le problème n’est pas l’avenant : c’est l’absence de validation claire et de traçabilité.",
      },
      { type: "h2", content: "Le process en 5 étapes" },
      {
        type: "p",
        content:
          "1) Demande formulée (qui, quoi, pourquoi). 2) Chiffrage (prix + délai + impact planning). 3) Validation écrite (mail signé, bon pour accord, outil). 4) Exécution. 5) Archivage + facturation (pièce jointe au dossier chantier).",
      },
      { type: "h2", content: "Les pièces à standardiser (pour gagner du temps)" },
      {
        type: "p",
        content:
          "Un modèle d’avenant, une checklist de pièces (photos, métrés, plans), et un espace de classement par chantier. Sans standard, vous réinventez à chaque fois — et l’urgence du terrain gagne.",
      },
      { type: "h2", content: "Ce qui se délègue en administratif" },
      {
        type: "p",
        content:
          "Préparer le document, récupérer les infos, relancer pour signature, classer et mettre à jour le suivi. Vous validez le fond (prix, technique, engagement). Résultat : plus de rigueur, moins de tension client, et un CA mieux sécurisé.",
      },
      { type: "h2", content: "Conclusion" },
      {
        type: "p",
        content:
          "Un avenant bien géré n’est pas “de la paperasse”. C’est une protection : de votre marge, de votre planning, et de votre trésorerie.",
      },
    ],
  },
  "tableau-suivi-chantier-administratif": {
    title: "Tableau de suivi administratif chantier : modèle simple pour tenir devis, factures et relances",
    description:
      "Un tableau unique pour suivre vos chantiers côté administratif : devis, situations, factures, relances, pièces et statuts. Objectif : ne plus rien oublier et gagner du temps chaque semaine.",
    excerpt:
      "Le modèle de tableau le plus simple (colonnes indispensables) pour suivre l’administratif chantier sans usine à gaz.",
    keywords: [
      "tableau suivi chantier",
      "suivi administratif chantier",
      "suivi factures relances",
      "organisation BTP",
      "process administratif BTP",
      "pilotage administratif",
    ],
    publishedTime: "2026-04-13T09:00:00+02:00",
    articleSection: "Organisation & méthodes",
    body: [
      { type: "h2", content: "Pourquoi un seul tableau change tout" },
      {
        type: "p",
        content:
          "Beaucoup d’oublis viennent d’un problème de dispersion : un peu dans la boîte mail, un peu dans le téléphone, un peu dans la tête. Un tableau unique, même basique, crée un “centre de gravité” : on sait ce qui est fait, ce qui manque, et la prochaine action.",
      },
      { type: "h2", content: "Les colonnes indispensables (version ultra simple)" },
      {
        type: "p",
        content:
          "Client / Chantier, Montant, Statut devis, Date d’envoi, Prochaine relance, Statut facture, Date d’échéance, Paiement reçu, Pièces manquantes, Commentaire. Rien de plus au départ : l’objectif est la régularité, pas la perfection.",
      },
      { type: "h2", content: "Le rituel qui rend le tableau rentable" },
      {
        type: "p",
        content:
          "15 minutes deux fois par semaine : vous mettez à jour le tableau et vous déclenchez les relances. C’est ce rituel qui sécurise la trésorerie et évite les grosses sessions de rattrapage.",
      },
      { type: "h2", content: "Comment déléguer sans perdre le contrôle" },
      {
        type: "p",
        content:
          "Un assistant peut tenir le tableau, préparer les relances, classer les pièces et vous remonter une liste courte de validations. Vous gardez les décisions (prix, arbitrages, litiges).",
      },
      { type: "h2", content: "Conclusion" },
      {
        type: "p",
        content:
          "Un tableau simple + un rituel fixe = moins d’oublis, plus de visibilité, et des encaissements plus réguliers.",
      },
    ],
  },
  "suivi-commandes-fournisseurs-chantier": {
    title: "Suivi fournisseurs et commandes chantier : éviter les retards (sans y passer la journée)",
    description:
      "Commandes, confirmations, livraisons, retours : un process administratif simple pour suivre les fournisseurs, limiter les ruptures et sécuriser votre planning chantier.",
    excerpt:
      "Un process concret pour suivre commandes et livraisons fournisseurs : confirmations, relances, pièces, et tableau de suivi.",
    keywords: [
      "suivi fournisseurs chantier",
      "commande fournisseur relance",
      "livraison chantier organisation",
      "retard fournisseur BTP",
      "logistique chantier",
      "coordination fournisseurs",
    ],
    publishedTime: "2026-04-13T09:00:00+02:00",
    articleSection: "Logistique & coordination",
    body: [
      { type: "h2", content: "Le vrai coût d’un retard fournisseur" },
      {
        type: "p",
        content:
          "Un retard de livraison peut immobiliser une équipe, décaler un lot et créer des jours “perdus”. Le suivi fournisseur n’est pas un détail : c’est une partie du pilotage chantier.",
      },
      { type: "h2", content: "Le process simple : commande → confirmation → livraison → preuve" },
      {
        type: "p",
        content:
          "À chaque commande : confirmer la référence, la quantité, le lieu, la date. Puis obtenir une confirmation écrite. Ensuite, relancer en amont de la date, et archiver la preuve de livraison (bon, email).",
      },
      { type: "h2", content: "Ce qu’un assistant peut faire à votre place" },
      {
        type: "p",
        content:
          "Suivre les confirmations, relancer, mettre à jour un tableau, centraliser bons de livraison et échanges. Vous intervenez uniquement en cas de blocage ou d’arbitrage (changement produit, urgence, surcoût).",
      },
      { type: "h2", content: "Conclusion" },
      {
        type: "p",
        content:
          "Avec un suivi bien tenu et traçable, vous limitez les “surprises” et vous gagnez en fiabilité auprès des clients.",
      },
    ],
  },
  "retenue-garantie-btp-sous-traitance": {
    title: "Retenue de garantie BTP (sous-traitance) : suivi, échéances et pièces utiles",
    description:
      "Comprendre le cycle administratif d’une retenue de garantie : suivi des dates, liens facturation/acomptes, pièces à conserver, et relances. Pour artisans et PME du bâtiment.",
    excerpt:
      "Un guide pratique pour suivre les retenues, sécuriser la traçabilité et relancer au bon moment — sans mélanger tout dans la messagerie.",
    keywords: [
      "retenue de garantie BTP",
      "retenue de garantie sous-traitant",
      "défaut de paiement retenue",
      "facturation BTP acomptes",
      "suivi administratif chantier",
      "pilotage administratif bâtiment",
    ],
    publishedTime: "2026-04-25T10:00:00+02:00",
    articleSection: "Facturation & trésorerie",
    body: [
      { type: "h2", content: "Ce que vous voulez éviter" },
      {
        type: "p",
        content:
          "Les retenues s’oublient souvent : la date, le taux, le plafond, la date de fin de garantie, la restitution, les factures d’entretien, les pièces “preuve d’entretien” éventuelles. Le résultat, c’est l’oubli, la surprise en fin d’ouvrage, ou une mauvaise surprise en comptabilité. Un cadre documentaire basique y remédie, même sans devenir juge du droit de ces clauses.",
      },
      { type: "h2", content: "Un suivi “tableau” suffit" },
      {
        type: "p",
        content:
          "Pour chaque retenue : client, affaire, montant, taux, plafond, facture(s) de référence, factures de retenue, date de constat, échéance, statut, pièces (PDF) et e-mails clés. Vous avez un point unique pour le dirigeant : ce qui se paie, ce qui se bloque, ce qui arrive à date.",
      },
      { type: "h2", content: "Relances : simples et calibrées" },
      {
        type: "p",
        content:
          "La relance n’est pas du harcèlement : c’est un rappel daté, avec montant et référence, qui arrive avant l’oubli. Côté exécution, un partenaire administratif encadré peut standardiser le message, conserver l’historique, et ne vous remonter que le sensible (litige, négociation, accord particulier). Voir nos pages dédiées trésorerie BTP (facturation, situations, relances) sur le site.",
      },
      { type: "h2", content: "Conclusion" },
      {
        type: "p",
        content:
          "La retenue, ce n’est pas seulement un montant comptable : c’est un engagement dans le temps. Avec un suivi propre, vous protégez la trésorerie et la relation fournisseurs / clients, tout en gagnant du temps sur l’exécution.",
      },
    ],
  },
  "devis-btp-structuration-conversion": {
    title: "Devis BTP : 7 leviers pour structurer l’offre et convertir plus vite",
    description:
      "Méthode de structuration d’un devis bâtiment : découpage, options, acomptes, délais, pièces, suivi. Comment réduire les allers-retours et augmenter le taux de signature.",
    excerpt:
      "Un cadre d’offre clair, des acomptes explicites et un suivi de relance — le trio qui fait payer le “temps caché” de la négociation par email.",
    keywords: [
      "devis BTP",
      "structurer un devis bâtiment",
      "relance devis artisan",
      "acompte chantier",
      "négociation devis PME",
      "assistant administratif devis",
    ],
    publishedTime: "2026-04-25T10:15:00+02:00",
    articleSection: "Ventes & devis",
    body: [
      { type: "h2", content: "1) Une page de synthèse lisible" },
      {
        type: "p",
        content:
          "Même si le technico est riche, le client a besoin d’un résumé exécutif : périmètre, durée, délais, modalités, exclusions, indexation éventuelle, révision. Si la première page est claire, la décision va plus vite.",
      },
      { type: "h2", content: "2) Découper le chantier (lots / phases)" },
      {
        type: "p",
        content:
          "Un découpage simple évite l’opacité. Il permet aussi d’envisager un plan d’avancement logique et, côté admin, d’ancrer les acomptes sur des déclencheurs réalistes (et traçables).",
      },
      { type: "h2", content: "3) Options et avenants" },
      {
        type: "p",
        content:
          "Dès qu’il y a de l’incertain, l’“option chiffrée” fait gagner un temps énorme : le client coche, vous facturez, la relation reste saine. Les avenants restent l’exception quand l’exécution a démarré — mais mieux vaut le prévoir que le subir. Pour un vrai cadrage, voir aussi l’approche avenant sur le site (page dédiée) et l’offre forfait BeWork (tarifs).",
      },
      { type: "h2", content: "4) Acomptes, situations, rythme" },
      {
        type: "p",
        content:
          "Déclarez tôt l’exigence de rythme d’encaissement. Les entreprises saines s’appuient sur des acomptes clairs, des situations, et un suivi. BeWork le traite en flux administratif, pas en mode “brouillons dans l’e-mail du chef”.",
      },
      { type: "h2", content: "5) Délai de validité" },
      {
        type: "p",
        content:
          "Un devis n’est “bon” qu’une fenêtre. La date de validité, associée à des conditions d’achat, évite d’hériter d’un prix obsolète quand l’inflation ou les coûts matériaux varient rapidement (spécialement en BTP).",
      },
      { type: "h2", content: "6) Preuves et conformité" },
      {
        type: "p",
        content:
          "Mention des versions de normes, des notices, de la période d’exécution, des contraintes d’accès, des retraits — pas pour “faire l’avocat”, mais pour réduire les interprétations. Le gain est administratif : moins d’e-mails, moins de reprises, moins d’incompréhensions de facturation.",
      },
      { type: "h2", content: "7) Relance" },
      {
        type: "p",
        content:
          "Le devis n’est jamais “fini” : plan J+2 / J+7 / J+14, ton professionnel, traçable. C’est l’un des gisements les plus efficaces pour le CA — un article entier y est consacré sur le blog (relance devis) et s’enchaîne naturellement avec l’inscription d’un devis cadré côté admin.",
      },
    ],
  },
  "dpgf-budget-chantier-ecart": {
    title: "DPGF et budget de chantier : lire, suivre l’écart, anticiper la fin de travaux",
    description:
      "Comment s’y retrouver entre budget initial, avenants, coût réel et marge, sans mélange entre planning technique et trésorerie. Pour chefs d’entreprise BTP, artisans et PME du bâtiment.",
    excerpt:
      "L’enjeu n’est pas de remplacer votre BE : c’est d’avoir le même chiffre “quelque part” pour piloter, facturer, et ne pas se réveiller avec un écart marge/vision.",
    keywords: [
      "DPGF chantier",
      "écart budget chantier",
      "marge BTP suivi",
      "avenant budget travaux",
      "pilotage budgétaire PME bâtiment",
      "trésorerie chantier",
    ],
    publishedTime: "2026-04-25T10:30:00+02:00",
    articleSection: "Pilotage chantier",
    body: [
      { type: "h2", content: "DPGF, budget, marge : trois niveaux" },
      {
        type: "p",
        content:
          "Le DPGF structure le détail, le “budget d’exécution” suit ce que vous avez négocié, et le coût réel s’inscrit dans le temps. Quand la finance et le chantier ne partagent pas la même “échelle”, l’écart marge/vision explose. Le travail d’abord, c’est un référentiel unique : devis, avenant, dernière version validée, et mises à jour datées.",
      },
      { type: "h2", content: "Avenants : la principale source d’écart" },
      {
        type: "p",
        content:
          "La majorité des écarts “surprises” vient d’avenants gérés en conversation plutôt qu’en document. La discipline est simple : numéroter, dater, relier chaque avenant au budget de référence, et cadrer l’incidence comptable. BeWork a une offre cadrant ce flux en administratif, sans remplacer votre expertise technique. La page avenant du site sert d’amorce côté SEO, le blog ici sert d’explication de méthode.",
      },
      { type: "h2", content: "Trésorerie de chantier" },
      {
        type: "p",
        content:
          "L’écart budget, ce n’est pas seulement de la marge : c’est du cash. Anticiper les acomptes, les situations, les retards, et le décalage de TVA, relève d’un rythme administratif. C’est l’enchaînement naturel de nos contenus “facturation, situations, relances” et des landings pédagogiques du site (tarifs, offre, FAQ).",
      },
      { type: "h2", content: "Conclusion" },
      {
        type: "p",
        content:
          "Le pilotage, ce n’est pas “plus de chiffres” : c’est moins d’improvisation. Avec un référentiel unique, vous sécurisez le chantier et la marge, sans diluer la relecture terrain.",
      },
    ],
  },
  "preuve-photo-chantier-tracabilite": {
    title: "Photos de chantier et preuve : ce qui compte côté administratif (et relation client)",
    description:
      "Compte-rendus, photos, échanges, datage : constituer une preuve utile en cas d’incompréhension, d’itération client, ou de suivi d’entretien. Guide orienté PME BTP, artisans et TPE du bâtiment.",
    excerpt:
      "Moins d’e-mails, plus de faits : nommer les plans, dater, archiver, relier le dossier. Le gain, c’est la paix d’esprit (et moins d’heures perdues en “je te renvoie la photo”).",
    keywords: [
      "photos chantier",
      "compte rendu de chantier",
      "traçabilité BTP",
      "litige client artisan",
      "preuve travaux bâtiment",
      "dossier technique chantier",
    ],
    publishedTime: "2026-04-25T10:45:00+02:00",
    articleSection: "Preuve & suivi de chantier",
    body: [
      { type: "h2", content: "Ce que la preuve sert (vraiment)" },
      {
        type: "p",
        content:
          "Dans 90% des conflits “techniques” non juridiques, le problème est la mémoire : qui a dit quoi, quand, avec quelle version des plans, avec quel accord. La preuve n’est pas un procès, c’est un alignement. Quand c’est propre, le client s’y retrouve, l’exécution avance, la facture justifie, et l’entretien post-chantier ne devient pas un héritage d’ambiguïté.",
      },
      { type: "h2", content: "Le minimum : nommage, date, lieu, lot" },
      {
        type: "p",
        content:
          "Évitez l’“IMG_4521.jpg” sans contexte. Un nom type “CH24_Lot-03_2026-04-20_Raccord-xxx.jpg” s’y retrouve. Idem pour e-mails de synthèse : en-tête, pièces jointes, suite logique, réponse attendue, délai. C’est bête, c’est 80% de la bataille.",
      },
      { type: "h2", content: "Comment une équipe distante aide (sans usurper le rôle d’ouvrier sur site)" },
      {
        type: "p",
        content:
          "L’agencement admin consiste à classer, relier, relancer, vérifier la complétude, préparer l’e-mail, préparer l’inclusion dans le dossier “chantier” et la fiche de synthèse. C’est l’orchestration : pas la pose. BeWork a une plateforme et des forfaits TTC, sans embauche (voir l’offre, les tarifs, et la prise de contact).",
      },
      { type: "h2", content: "Conclusion" },
      {
        type: "p",
        content:
          "Un dossier propre, c’est un chantier moins lourd, une facture plus lisse, un client moins angoissé, et moins d’heures “gratuites” en arbitrage. Le ROI, c’est direct.",
      },
    ],
  },
  "plis-techniques-dce-versions": {
    title: "DCE / plis techniques : suivi de versions, transmittaux et zéro pièce perdue",
    description:
      "Méthode d’ordre : versions de plans, devis, transmittaux, additifs, et pièces reçues. Comment éviter de facturer l’ancienne version ou de construire “à côté” du cahier des charges.",
    excerpt:
      "Le chaos coûte cher : ici, un cadre d’intitulé, d’obsolescence, et d’inclusion. Idéal en travaux, rénovation, lotissement technique et marchés en plusieurs envois.",
    keywords: [
      "DCE BTP",
      "transmittal pièces",
      "version de plan",
      "classement administratif chantier",
      "additif marché BTP",
      "coordination de chantier PME",
    ],
    publishedTime: "2026-04-25T11:00:00+02:00",
    articleSection: "Dossier & coordination",
    body: [
      { type: "h2", content: "Le vrai sujet, ce sont les versions" },
      {
        type: "p",
        content:
          "Tant que l’on ne gèle pas l’“état courant de référence”, toute l’exécution se bat avec des documents divergents. Règles de base : une version, une source, un statut, une date, une feuille de transmission (transmittal) quand c’est gros, ou un e-mail cadré quand c’est moyen. Le client voit l’adulte dans la pièce — et vous, vous n’inventez plus ce qui a été reçu le mardi 14h.",
      },
      { type: "h2", content: "L’inventaire simple (pas un ERP, juste l’utile)" },
      {
        type: "p",
        content:
          "Inventorier : plan, devis, additif, fiche d’incompatibilité, compte-rendu de visite, photos, fiches produits, réceptions. Quand c’est moins de 30 pièces, un tableau suffit. Quand c’est 300, il faut des étiquettes de nommage et un référent. Le point commun : n’alimentez jamais la facture sans revenir sur la dernière version reconnue par les correspondants. BeWork ajuste ce rythme en administratif, pas en expertise technique, mais c’est le chaînon le plus manquant en PME.",
      },
      { type: "h2", content: "Relation avec les autres articles du blog" },
      {
        type: "p",
        content:
          "Les preuves photos, le suivi fournisseurs, la retenue, la DPGF, le devis, et les situations de travaux s’enchaînent. Prenez ce blog comme un “parcours” : commencez par ce qui vous manque, puis reliez. Si vous avez un besoin “clé en main” du flux admin, l’inscription, la prise de rendez-vous découverte, et l’onboarding, sont sur le site.",
      },
    ],
  },
} satisfies Record<string, BlogArticle>;

export type BlogSlug = keyof typeof BLOG_ARTICLES;

export const BLOG_SLUGS = Object.keys(BLOG_ARTICLES) as BlogSlug[];
