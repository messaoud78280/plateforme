/** Tutoriels présentés sur /ressources et /ressources/tutos — ajouter en tête pour mettre en avant. */
export type ResourceStatus = "Tuto PDF";
export type ResourceIcon = "document";

export type ResourceTutoItem = {
  title: string;
  desc: string;
  href: string;
  status: ResourceStatus;
  icon: ResourceIcon;
};

/** Titres d’entrée : alignés sur les couvertures des PDF (« Crée ton skill », « Trie tes DCE… », etc.). */
export const RESOURCE_TUTO_ITEMS: readonly ResourceTutoItem[] = [
  {
    title: "Tuto Crée ton skill — Préparation de RDV client",
    desc: "Brief contact, ordre du jour chronométré et trame de CR post-RDV en 15 min — PDF et prompts pour Claude.",
    href: "/ressources/tuto-skill-rdv-client-bework",
    status: "Tuto PDF",
    icon: "document",
  },
  {
    title: "Tuto Crée ton skill — Plan d'Installation de Chantier",
    desc: "PIC complet et conforme en 1 h — base vie, co-activité, grue, déchets, checklist SPS — PDF et prompts.",
    href: "/ressources/tuto-skill-pic-bework",
    status: "Tuto PDF",
    icon: "document",
  },
  {
    title: "Tuto Crée ton skill — Ordre de Service",
    desc: "Décortiquer, contester et chiffrer un OS en 5 min — CCAG art. 3.8, courrier de réserves, fourchette plus-value, délai 15 jours — PDF et prompts.",
    href: "/ressources/tuto-skill-ordre-de-service-bework",
    status: "Tuto PDF",
    icon: "document",
  },
  {
    title: "Tuto Crée ton skill — DC4 (sous-traitance)",
    desc: "DC4 conforme en 12 min — 9 rubriques, paiement direct, pièces à joindre et mail MOA — PDF et prompts pour marchés publics BTP.",
    href: "/ressources/tuto-skill-dc4-bework",
    status: "Tuto PDF",
    icon: "document",
  },
  {
    title: "Tuto Crée ton bureau depuis ton chantier",
    desc: "Pairer PC et mobile, 8 commandes vocales BTP, sécurité et routine — PDF intégré, prompts à copier.",
    href: "/ressources/tuto-dispatch-bework",
    status: "Tuto PDF",
    icon: "document",
  },
  {
    title: "Tuto Trie tes DCE avec Claude in Chrome",
    desc: "BOAMP et plateformes, raccourci veille 8 h, filtres métier — PDF intégré et prompts prêts à coller.",
    href: "/ressources/tuto-tri-dce-claude-chrome-bework",
    status: "Tuto PDF",
    icon: "document",
  },
  {
    title: "Tuto Crée ton skill — Chiffrage de devis BTP",
    desc: "BPU, coefficients, fichiers Word + Excel — prompts de calibrage et d’usage quotidien, PDF intégré.",
    href: "/ressources/tuto-skill-chiffrage-devis-bework",
    status: "Tuto PDF",
    icon: "document",
  },
  {
    title: "Tuto Crée ton skill — Analyse express · CCTP",
    desc: "Prestations à chiffrer, DTU/AQS, clauses pénalisantes, fiche Go/No Go — prompts intégrés, PDF gratuit.",
    href: "/ressources/tuto-skill-analyse-express-cctp-bework",
    status: "Tuto PDF",
    icon: "document",
  },
  {
    title: "Tuto Crée ton skill — Métré quantitatif et qualitatif",
    desc: "Plans + CCTP, unités U/ml/m²/m³, ratios, DPGF Excel — prompts calibrage et usage quotidien, PDF gratuit.",
    href: "/ressources/tuto-skill-metre-bework",
    status: "Tuto PDF",
    icon: "document",
  },
  {
    title: "Tuto Crée ton skill — Constat de retard",
    desc: "7 éléments LRAR, CCAG art.19, CIBTP — PDF intégré et prompts prêts à coller.",
    href: "/ressources/tuto-skill-constat-retard-bework",
    status: "Tuto PDF",
    icon: "document",
  },
  {
    title: "Tuto Crée ton skill — DUERP",
    desc: "7 éléments R4121, matrice F×G, plan d’action — PDF intégré et prompts prêts à coller.",
    href: "/ressources/tuto-skill-duerp-bework",
    status: "Tuto PDF",
    icon: "document",
  },
  {
    title: "Tuto Crée ton skill — DOE",
    desc: "9 rubriques CCAG, sommaire .docx, checklist manquants — PDF intégré et prompts prêts à coller.",
    href: "/ressources/tuto-skill-doe-bework",
    status: "Tuto PDF",
    icon: "document",
  },
  {
    title: "Tuto Crée ton skill — PV de levée de réserves",
    desc: "7 blocs obligatoires, .docx signable, retenue de garantie — PDF intégré et prompts prêts à coller.",
    href: "/ressources/tuto-skill-pv-levee-reserves-bework",
    status: "Tuto PDF",
    icon: "document",
  },
  {
    title: "Tuto Crée ton skill — Mémoire Technique BTP",
    desc: "Trame 11 sections, reproduction de votre style — PDF intégré et prompts prêts à coller.",
    href: "/ressources/tuto-skill-memoire-technique-bework",
    status: "Tuto PDF",
    icon: "document",
  },
  {
    title: "Tuto Crée ton skill — Analyse de DCE",
    desc: "Fiche standardisée, Go/No Go, citations de pages — PDF intégré et prompts prêts à coller.",
    href: "/ressources/tuto-skill-analyse-dce-bework",
    status: "Tuto PDF",
    icon: "document",
  },
  {
    title: "Tuto Crée ton skill — PPSPS (Plan Particulier Sécurité et Santé)",
    desc: "Guide BeWork gratuit : 9 rubriques R4532-64, prompts de calibrage et d’usage quotidien, PDF intégré.",
    href: "/ressources/tuto-skill-ppsps-bework",
    status: "Tuto PDF",
    icon: "document",
  },
  {
    title: "Tuto Crée ton skill — Compte rendu de chantier",
    desc: "CR hebdo en 10 min — 8 rubriques, notes brutes ou vocales, prompts prêts à coller (Claude & skills).",
    href: "/ressources/compte-rendu-chantier-guide-btp",
    status: "Tuto PDF",
    icon: "document",
  },
];
