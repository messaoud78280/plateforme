/** Tutoriels présentés sur /ressources et /ressources/tutos — ajouter en tête pour mettre en avant. */
export type ResourceStatus = "Guide PDF";
export type ResourceIcon = "document";

export type ResourceTutoItem = {
  title: string;
  desc: string;
  href: string;
  status: ResourceStatus;
  icon: ResourceIcon;
};

export const RESOURCE_TUTO_ITEMS: readonly ResourceTutoItem[] = [
  {
    title: "Tutoriel PDF — tri DCE avec Claude in Chrome",
    desc: "BOAMP et plateformes, raccourci veille 8 h, filtres métier — PDF intégré et prompts prêts à coller.",
    href: "/ressources/tuto-tri-dce-claude-chrome-bework",
    status: "Guide PDF",
    icon: "document",
  },
  {
    title: "Tutoriel PDF — constat de retard avec l’IA (Claude & skills)",
    desc: "7 éléments LRAR, CCAG art.19, CIBTP — PDF intégré et prompts prêts à coller.",
    href: "/ressources/tuto-skill-constat-retard-bework",
    status: "Guide PDF",
    icon: "document",
  },
  {
    title: "Tutoriel PDF — DUERP avec l’IA (Claude & skills)",
    desc: "7 éléments R4121, matrice F×G, plan d’action — PDF intégré et prompts prêts à coller.",
    href: "/ressources/tuto-skill-duerp-bework",
    status: "Guide PDF",
    icon: "document",
  },
  {
    title: "Tutoriel PDF — DOE avec l’IA (Claude & skills)",
    desc: "9 rubriques CCAG, sommaire .docx, checklist manquants — PDF intégré et prompts prêts à coller.",
    href: "/ressources/tuto-skill-doe-bework",
    status: "Guide PDF",
    icon: "document",
  },
  {
    title: "Tutoriel PDF — PV levée de réserves avec l’IA (Claude & skills)",
    desc: "7 blocs obligatoires, .docx signable, retenue de garantie — PDF intégré et prompts prêts à coller.",
    href: "/ressources/tuto-skill-pv-levee-reserves-bework",
    status: "Guide PDF",
    icon: "document",
  },
  {
    title: "Tutoriel PDF — mémoire technique avec l’IA (Claude & skills)",
    desc: "Trame 11 sections, reproduction de votre style — PDF intégré et prompts prêts à coller.",
    href: "/ressources/tuto-skill-memoire-technique-bework",
    status: "Guide PDF",
    icon: "document",
  },
  {
    title: "Tutoriel PDF — analyse de DCE avec l’IA (Claude & skills)",
    desc: "Fiche standardisée, Go/No Go, citations de pages — PDF intégré et prompts prêts à coller.",
    href: "/ressources/tuto-skill-analyse-dce-bework",
    status: "Guide PDF",
    icon: "document",
  },
  {
    title: "Tutoriel PDF — skill PPSPS avec l’IA (Claude & skills)",
    desc: "Guide BeWork gratuit : 9 rubriques R4532-64, prompts de calibrage et d’usage quotidien, PDF intégré.",
    href: "/ressources/tuto-skill-ppsps-bework",
    status: "Guide PDF",
    icon: "document",
  },
  {
    title: "Tutoriel PDF — compte rendu de chantier avec l’IA (Claude & skills)",
    desc: "Guide BeWork gratuit : mise en page PDF à consulter, transcription intégrale, prompts prêts à coller.",
    href: "/ressources/compte-rendu-chantier-guide-btp",
    status: "Guide PDF",
    icon: "document",
  },
];
