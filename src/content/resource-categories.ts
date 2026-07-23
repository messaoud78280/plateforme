/** Catégories éditoriales hub ressources (SEO + navigation) — liens vers hubs existants. */
export type ResourceCategory = {
  id: string;
  title: string;
  description: string;
  links: { href: string; label: string }[];
};

export const RESOURCE_GUIDE_CATEGORIES: readonly ResourceCategory[] = [
  {
    id: "gestion-chantier",
    title: "Gestion de chantier",
    description: "Comptes rendus, planning, suivi opérationnel et coordination.",
    links: [
      { href: "/ressources/compte-rendu-chantier", label: "Compte rendu de chantier" },
      { href: "/ressources/planning-chantier-btp", label: "Planning chantier" },
      { href: "/services/compte-rendu-chantier", label: "Service compte rendu" },
    ],
  },
  {
    id: "appels-offres",
    title: "Appels d’offres",
    description: "DCE, mémoires techniques et chiffrage.",
    links: [
      { href: "/ressources/analyse-dce-btp", label: "Analyse DCE" },
      { href: "/ressources/analyse-dce-chiffrage-btp", label: "Analyse DCE & appui chiffrage" },
      { href: "/ressources/memoire-technique-btp", label: "Mémoire technique" },
      { href: "/ressources/chiffrage-devis-btp", label: "Chiffrage & devis" },
      { href: "/ressources/guide-dirigeant-btp-bework", label: "Guide dirigeant — Go/No-Go & clauses" },
      { href: "/services/analyse-dce-btp", label: "Service analyse DCE" },
    ],
  },
  {
    id: "documents-admin",
    title: "Documents administratifs BTP",
    description: "DICT, voirie, occupations, autorisations et dossiers.",
    links: [
      { href: "/dict-dt-travaux", label: "DICT & dossiers travaux" },
      { href: "/situation-travaux-btp", label: "Situations de travaux" },
      { href: "/avenant-chantier", label: "Avenants chantier" },
    ],
  },
  {
    id: "securite",
    title: "Sécurité chantier",
    description: "PPSPS, DUERP et documents associés.",
    links: [
      { href: "/ressources/ppsps-btp", label: "PPSPS" },
      { href: "/ressources/tuto-skill-duerp-bework", label: "Tutoriel DUERP" },
      { href: "/services/ppsps", label: "Service PPSPS" },
    ],
  },
  {
    id: "devis-facturation",
    title: "Devis, facturation et relances",
    description: "Encaissement, relances clients et suivi commercial.",
    links: [
      { href: "/relance-devis-btp", label: "Relance devis" },
      { href: "/impayes-btp-relances", label: "Impayés & relances" },
      { href: "/services/chiffrage-devis-btp", label: "Service chiffrage & devis" },
    ],
  },
  {
    id: "conducteur-travaux",
    title: "Organisation conducteur de travaux",
    description: "Pilotage administratif, fournisseurs et charge de bureau.",
    links: [
      { href: "/ressources/guide-cdt-bework", label: "Guide conducteur de travaux (PDF 52 pages)" },
      { href: "/ressources/guide-conducteur-de-travaux-ia-bework", label: "Article guide conducteur & IA" },
      { href: "/suivi-fournisseurs-chantier", label: "Fournisseurs & achats" },
      { href: "/assistants-administratifs-taches", label: "Missions BeWork" },
      { href: "/services/assistant-conducteur-de-travaux", label: "Assistant conducteur de travaux" },
    ],
  },
  {
    id: "dirigeant-pme",
    title: "Dirigeant PME BTP",
    description: "Go/No-Go AO, clauses à risque, rentabilité, réclamations et recrutement.",
    links: [
      { href: "/ressources/guide-dirigeant-btp-bework", label: "Guide du Dirigeant BTP (PDF 20 pages)" },
      { href: "/ressources/guide-claude-btp-bework", label: "Claude IA — 18 cas d’usage métier" },
      { href: "/ressources/analyse-dce-btp", label: "Analyse DCE" },
      { href: "/assistant-administratif-externalise", label: "Externalisation administrative" },
    ],
  },
] as const;
