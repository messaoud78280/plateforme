/**
 * Catalogue des skills internes BeWork (dashboard).
 * Ajouter une entrée ici + route sous /dashboard/skills/[slug].
 */
export type BeworkSkillDefinition = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  badge: string;
  status: "available" | "coming_soon";
};

export const BEWORK_SKILLS: readonly BeworkSkillDefinition[] = [
  {
    slug: "cctp",
    title: "Rédaction de CCTP",
    subtitle:
      "Guide méthode, fiches ouvrage, checklist documentaire et cohérence DPGF — CCTP clair, chiffrable et exécutable.",
    description:
      "Méthode en 6 étapes, modèles par lot, fiches ouvrage (13 rubriques), audit, cohérence DPGF, import multi-formats et export PDF / Word.",
    href: "/dashboard/skills/cctp",
    badge: "CCTP",
    status: "available",
  },
  {
    slug: "ppsps",
    title: "Génération PPSPS",
    subtitle:
      "Préparez l'analyse des risques et les modes opératoires de votre PPSPS avec l'assistant BeWork.",
    description:
      "5 modes (analyse, PPSPS complet, audit, enrichissement, coordination), profil chantier, références prévention, lien projet, duplication et export.",
    href: "/dashboard/skills/ppsps",
    badge: "PPSPS",
    status: "available",
  },
] as const;

export function getBeworkSkill(slug: string): BeworkSkillDefinition | undefined {
  return BEWORK_SKILLS.find((s) => s.slug === slug);
}
