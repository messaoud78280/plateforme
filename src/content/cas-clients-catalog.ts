/** Cas clients marketing — liste + fiche détail CCMI Martin. */

export type CasClientSimpleCase = {
  kind: "simple";
  title: string;
  /** Profil entreprise (anonymisé) */
  profil?: string;
  /** Contexte chantier / marché */
  contexte?: string;
  before: string;
  after: string;
  /** Périmètre BeWork */
  mission?: string;
  kpis: readonly string[];
};

export type CasClientFeaturedCase = {
  kind: "featured";
  slug: string;
  cardTitle: string;
  cardSubtitle: string;
  cardSummary: string;
  badges: readonly string[];
  href: string;
  pdfPresentableHref: string;
  pdfCompleteHref: string;
  pdfDtuReportHref: string;
};

export const CAS_CLIENT_SIMPLE_CASES: CasClientSimpleCase[] = [
  {
    kind: "simple",
    title: "Appel d'offres : DCE analysé avant le week-end",
    profil: "PME second œuvre — 18 salariés, Île-de-France",
    contexte: "Lot peinture en marché public, dépôt dans 8 jours ouvrés, CT mobilisé sur deux réceptions.",
    before: "DCE reçu tard, pas de synthèse partagée, risque de lancer le chiffrage sans lecture CCAP complète.",
    mission: "Tri des pièces, synthèse lots/risques, plan de mémoire technique et checklist dépôt.",
    after: "Go/No-go cadré en interne, mémoire structuré, dépôt validé par le dirigeant — sans sacrifier les chantiers en cours.",
    kpis: ["Synthèse DCE en 48 h", "Points pénalités CCAP repérés", "Checklist dépôt complète"],
  },
  {
    kind: "simple",
    title: "Marché public : situations et DOE au fil de l'eau",
    profil: "Entreprise menuiserie — titulaire accord-cadre multi-sites",
    contexte: "Situations mensuelles Chorus Pro, relances MOE et DOE lot par lot sur 4 sites.",
    before: "Factures rejetées faute de pièces, DOE repoussé en fin de marché, stress sur pénalités.",
    mission: "Tableau de suivi marché, préparation situations, relances pièces, compilation DOE progressive.",
    after: "Situations déposées à date, pièces manquantes tracées, DOE avancé avant la réception — validation CT sur l'avancement terrain.",
    kpis: ["Calendrier situations tenu", "Relances MOE tracées", "DOE structuré par site"],
  },
  {
    kind: "simple",
    title: "Conducteur débordé : trois chantiers, un fil documentaire",
    profil: "Conducteur de travaux — entreprise générale, 3 chantiers actifs",
    contexte: "Relances fournisseurs, CR en retard, réserves ouvertes sur deux opérations.",
    before: "Mails et relances repoussés chaque semaine, pièces dispersées, MOE relancé trop tard.",
    mission: "CR à partir de notes terrain, relances fournisseurs/MOE, tableau réserves et prochaines actions.",
    after: "Relances tenues, CR diffusés après validation, réserves suivies avec preuves — le CT garde le pilotage terrain.",
    kpis: ["CR hebdo prêts à valider", "Relances avec statuts", "Réserves numérotées et suivies"],
  },
];

export const CCMI_MARTIN_CASE: CasClientFeaturedCase = {
  kind: "featured",
  slug: "ccmi-martin-audit-devis",
  cardTitle: "CCMI Martin : devis audité avant signature",
  cardSubtitle: "287 180 € TTC — 92 lignes analysées, 75 points à préciser ou reformuler.",
  cardSummary:
    "Un devis CCMI semblait complet. L’audit BeWork a produit un rapport DTU × devis (23 normes, 28 alertes), corrigé les postes flous et intégré les préconisations G2 avant signature.",
  badges: ["Devis CCMI", "Audit technique", "DTU", "Étude G2", "Avant / Après"],
  href: "/cas-clients/ccmi-martin-audit-devis",
  pdfPresentableHref: "/cas-clients/ccmi-martin/pdf/devis-corrige-presentable.pdf",
  pdfCompleteHref: "/cas-clients/ccmi-martin/pdf/cas-client-complet.pdf",
  pdfDtuReportHref: "/cas-clients/ccmi-martin/pdf/rapport-dtu-martin.pdf",
};

/** Synthèse du rapport « Vérification DTU × Devis » (15/05/2026, 21 p.). */
export const CCMI_MARTIN_DTU_REPORT = {
  title: "Rapport d'analyse BeWork — Vérification DTU × Devis",
  date: "15 mai 2026",
  devisRef: "Devis CCMI n° MIF-2026-0473",
  pages: 21,
  linesAnalyzed: 92,
  dtuCount: 23,
  confidence: { high: 20, medium: 61, low: 11 },
  completenessAlerts: 28,
  alertLines: 25,
  disclaimer:
    "Outil de repérage interne : identifie les DTU probablement concernés par chaque ligne de devis pour orienter une vérification technique. Aucun extrait officiel de DTU n'est reproduit — le texte des articles doit être consulté dans le DTU officiel (AFNOR / CSTB) avant toute exploitation contractuelle. Le niveau de confiance n'engage pas la conformité du devis ni de l'exécution.",
  deliverables: [
    "Rapprochement ligne de devis → ouvrage détecté → DTU probable",
    "Articles à vérifier (sans citation du texte normatif)",
    "Niveau de confiance par ligne (élevé, moyen, faible)",
    "Bloc alertes de complétude (hors DTU, accessoires manquants, etc.)",
  ],
} as const;

export const CCMI_MARTIN_SLIDES = [
  {
    src: "/cas-clients/ccmi-martin/carousel/slide-01.jpg",
    alt: "Audit devis CCMI Martin — couverture et synthèse du dossier client",
  },
  {
    src: "/cas-clients/ccmi-martin/carousel/slide-02.jpg",
    alt: "Audit devis CCMI — périmètre des 92 lignes analysées et montant initial",
  },
  {
    src: "/cas-clients/ccmi-martin/carousel/slide-03.jpg",
    alt: "Résultat audit devis — répartition lignes conformes, à préciser et à reformuler",
  },
  {
    src: "/cas-clients/ccmi-martin/carousel/slide-04.jpg",
    alt: "Audit devis BTP — rapprochement ligne de devis et DTU probablement applicable",
  },
  {
    src: "/cas-clients/ccmi-martin/carousel/slide-05.jpg",
    alt: "Exemple audit CCMI — désignation drainage périphérique à préciser",
  },
  {
    src: "/cas-clients/ccmi-martin/carousel/slide-06.jpg",
    alt: "Alertes de complétude devis — oublis structurants et points hors DTU",
  },
  {
    src: "/cas-clients/ccmi-martin/carousel/slide-07.jpg",
    alt: "Synthèse audit devis — avenants potentiels et niveaux de confiance par ligne",
  },
  {
    src: "/cas-clients/ccmi-martin/carousel/slide-08.jpg",
    alt: "Livrable audit devis CCMI Martin — recommandations avant engagement contractuel",
  },
] as const;

export const CCMI_MARTIN_KEY_FIGURES = [
  { label: "Montant initial", value: "287 180 € TTC" },
  { label: "Lignes analysées", value: "92" },
  { label: "Lignes conformes", value: "17" },
  { label: "À préciser", value: "64" },
  { label: "À reformuler", value: "11" },
  { label: "Oublis structurants", value: "6" },
  { label: "Avenants potentiels", value: "7 183 € HT" },
] as const;

export const CCMI_MARTIN_CONTROLS = [
  "Désignations",
  "Unités",
  "Prix",
  "DTU applicables",
  "Notices fabricants",
  "Points hors DTU",
  "Réseaux",
  "Fondations",
  "Soubassements",
  "Pièces humides",
  "Finitions",
  "Garanties",
  "Assurances",
  "Préconisations étude de sol G2",
] as const;

export const CCMI_MARTIN_ISSUES = [
  {
    title: "Drainage périphérique",
    text: "Le drainage était prévu, mais il fallait préciser diamètre, pente, géotextile, regards, exutoire et limites exactes de prestation.",
  },
  {
    title: "Étude de sol G2",
    text: "La G2 faisait apparaître un dispositif anti-évaporation autour du bâti, type trottoir béton périphérique, non clairement chiffré dans le devis initial.",
  },
  {
    title: "Réseaux EU / EP",
    text: "Les réseaux devaient être mieux détaillés : diamètres, pentes, regards, séparation des eaux et raccordements.",
  },
  {
    title: "Raccordements concessionnaires",
    text: "Enedis, eau potable, télécom et assainissement ne doivent pas rester en lignes forfaitaires floues : ils dépendent de prescriptions concessionnaires ou règlements locaux.",
  },
  {
    title: "Pièces humides",
    text: "Receveur, pente, bonde, siphon accessible, raccords, SPEC éventuel et étanchéité périphérique devaient être précisés.",
  },
  {
    title: "Finitions et menuiseries",
    text: "Les peintures, finitions et menuiseries extérieures nécessitaient des précisions sur niveau de finition, pose, seuils, calfeutrement, performances et fiches fabricants.",
  },
] as const;

/** @deprecated Utiliser CAS_CLIENT_SIMPLE_CASES — conservé pour compat imports existants. */
export const CAS_CLIENT_CASES = CAS_CLIENT_SIMPLE_CASES.map(({ title, before, after, kpis }) => ({
  title,
  before,
  after,
  kpis,
}));
