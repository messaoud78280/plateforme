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
    subtitle: "Structurez, rédigez et améliorez vos CCTP BTP avec l'assistant BeWork.",
    description:
      "Sommaires, articles techniques, relecture et détection des manques — contenu prêt à intégrer dans vos dossiers marchés.",
    href: "/dashboard/skills/cctp",
    badge: "CCTP",
    status: "available",
  },
] as const;

export function getBeworkSkill(slug: string): BeworkSkillDefinition | undefined {
  return BEWORK_SKILLS.find((s) => s.slug === slug);
}
