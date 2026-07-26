/** Guides hors blog (pages /ressources/…) — listés comme « Guides » avec les articles du blog. */
export type ResourceGuideBadge = "Guide PDF" | "Tuto PDF";

export type ResourceGuidePageItem = {
  href: string;
  title: string;
  excerpt: string;
  /** ISO pour le tri commun avec les articles blog */
  publishedTime: string;
  badge?: ResourceGuideBadge;
};

export const RESOURCE_GUIDE_PAGE_ITEMS: readonly ResourceGuidePageItem[] = [
  {
    href: "/ressources/analyse-dce-chiffrage-btp",
    title: "Analyse DCE et appui chiffrage BTP",
    excerpt:
      "Comment BeWork aide les entreprises à analyser un DCE, structurer les postes, préparer une base de chiffrage et repérer les points d’alerte avant validation.",
    publishedTime: "2026-05-29T10:00:00+02:00",
  },
  {
    href: "/ressources/guide-chef-de-chantier-bework",
    title: "Le Guide du Chef de Chantier — 6 outils Claude au quotidien",
    excerpt:
      "PDF 17 pages : accueil sécurité, mode opératoire, quart d’heure sécurité, rapport journalier, appro et auto-contrôle — pensé pour l’app Claude sur ton téléphone, dictée et photos.",
    publishedTime: "2026-07-26T12:00:00+02:00",
    badge: "Guide PDF",
  },
  {
    href: "/ressources/guide-rh-btp-ia-bework",
    title: "Le Guide RH du BTP augmenté par l’IA — 18 cas d’usage Claude",
    excerpt:
      "PDF 36 pages : de la fiche de poste au bilan social — recrutement, onboarding, plan de formation Constructys, droit social BTP et pilotage RH avec Claude, prompts prêts à coller.",
    publishedTime: "2026-07-24T15:00:00+02:00",
    badge: "Guide PDF",
  },
  {
    href: "/ressources/guide-dirigeant-btp-bework",
    title: "Le Guide du Dirigeant BTP — 6 leviers de pilotage PME",
    excerpt:
      "PDF 20 pages : Go/No-Go AO, clauses à risque, rentabilité & trésorerie, réclamations, tableau de bord direction, recrutement — 24 prompts Claude, ~53 h de direction récupérées par mois.",
    publishedTime: "2026-07-22T07:30:00+02:00",
    badge: "Guide PDF",
  },
  {
    href: "/ressources/guide-debloquer-claude-bework",
    title: "Débloquer le vrai potentiel de Claude — Projets, MCP, Skills & Cowork",
    excerpt:
      "PDF 9 pages : installer un environnement Claude qui travaille sur l’administratif chantier — Projets, connecteurs MCP, Skills, instructions système, 3 cas d’usage + Cowork (AO, devis, CR).",
    publishedTime: "2026-07-21T19:00:00+02:00",
    badge: "Guide PDF",
  },
  {
    href: "/ressources/guide-claude-btp-bework",
    title: "Claude IA pour le Bâtiment & les TP — 18 cas d’usage par métier",
    excerpt:
      "PDF 14 pages : ce que Claude sait faire sur vos DCE, chantiers, écrits et équipes — 18 cas d’usage et 18 prompts à copier pour dirigeants, bureaux d’études, conducteurs de travaux, chargés d’affaires, MOE et RH BTP.",
    publishedTime: "2026-07-15T09:00:00+02:00",
    badge: "Guide PDF",
  },
  {
    href: "/ressources/guide-assistants-travaux-bework",
    title: "Le Guide des Assistants Travaux — 12 missions d’un marché de travaux",
    excerpt:
      "PDF 21 pages : les 12 missions administratives d’un marché de travaux (prise en main, situations, TS, DOE…), classées IA / mixte / humain — prompts Claude, checklist avant signature, ~112 h d’encadrement récupérées par mois.",
    publishedTime: "2026-07-15T08:00:00+02:00",
    badge: "Guide PDF",
  },
  {
    href: "/ressources/guide-moe-bework",
    title: "Guide Maîtrise d’œuvre × IA — 12 missions MOE (Claude)",
    excerpt:
      "PDF 22 pages : tâches IA / mixte / humain pour MOE, BET, architectes et économistes — limites, checklist de relecture et méthode pour récupérer du temps (week-ends).",
    publishedTime: "2026-05-28T08:00:00+02:00",
    badge: "Guide PDF",
  },
  {
    href: "/ressources/guide-cdt-bework",
    title: "Le guide du conducteur de travaux — 6 outils Claude",
    excerpt:
      "PDF 52 pages : DCE, PPSPS, CR, constat de retard, PV de levée, DOE — méthode skills Claude, prompts à copier, 30 à 50 h gagnées par chantier.",
    publishedTime: "2026-05-12T08:00:00+02:00",
    badge: "Guide PDF",
  },
  {
    href: "/ressources/guide-conducteur-de-travaux-ia-bework",
    title: "Guide du conducteur de travaux — 6 outils IA (CR, PPSPS, DCE, DOE)",
    excerpt:
      "PDF gratuit : automatiser les livrables administratifs de chantier avec Claude AI — gains de 30 à 50 h par chantier, 6 tutoriels skills.",
    publishedTime: "2026-05-11T10:00:00+02:00",
    badge: "Guide PDF",
  },
];
