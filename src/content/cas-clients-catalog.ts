/** Cas clients marketing — liste + fiche détail CCMI Martin. */

export type CasClientSimpleCase = {
  kind: "simple";
  title: string;
  before: string;
  after: string;
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
};

export const CAS_CLIENT_SIMPLE_CASES: CasClientSimpleCase[] = [
  {
    kind: "simple",
    title: "Relances devis : plus de réponses, moins d’oubli",
    before: "Devis envoyés mais peu relancés, décisions client floues.",
    after: "Rythme de relance + statuts + prochaines étapes, réponses plus rapides.",
    kpis: ["Suivi J+2/J+7/J+14", "Traçabilité des réponses", "Décisions client clarifiées"],
  },
  {
    kind: "simple",
    title: "Trésorerie : factures et impayés mieux pilotés",
    before: "Facturation en retard, relances irrégulières, stress sur l’encaissement.",
    after: "Calendrier de relance + preuves + reporting, trésorerie plus stable.",
    kpis: ["Relances cadrées", "Pièces classées par chantier", "Reporting impayés"],
  },
  {
    kind: "simple",
    title: "Chantier : dossier propre (situations, avenants, DT/DICT)",
    before: "Pièces dispersées, délais qui glissent, relances faites au dernier moment.",
    after: "Process simple : préparation, suivi, classement, validations au bon moment.",
    kpis: ["Tableau de suivi", "Checklists pièces", "Validation des points sensibles"],
  },
];

export const CCMI_MARTIN_CASE: CasClientFeaturedCase = {
  kind: "featured",
  slug: "ccmi-martin-audit-devis",
  cardTitle: "CCMI Martin : devis audité avant signature",
  cardSubtitle: "287 180 € TTC — 92 lignes analysées, 75 points à préciser ou reformuler.",
  cardSummary:
    "Un devis CCMI semblait complet. L’audit BeWork a révélé des postes flous, des oublis liés à la G2, des points DTU à préciser et des risques de plus-values ou litiges en chantier.",
  badges: ["Devis CCMI", "Audit technique", "DTU", "Étude G2", "Avant / Après"],
  href: "/cas-clients/ccmi-martin-audit-devis",
  pdfPresentableHref: "/cas-clients/ccmi-martin/pdf/devis-corrige-presentable.pdf",
  pdfCompleteHref: "/cas-clients/ccmi-martin/pdf/cas-client-complet.pdf",
};

export const CCMI_MARTIN_SLIDES = Array.from({ length: 8 }, (_, i) => ({
  src: `/cas-clients/ccmi-martin/carousel/slide-${String(i + 1).padStart(2, "0")}.jpg`,
  alt: `Cas client CCMI Martin — visuel ${i + 1} sur 8`,
}));

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
