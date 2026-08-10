/** Intentions formulaire « idée / besoin » — values stables pour ContactRequest.mainNeed. */
export const IDEA_INTENT_OPTIONS = [
  { value: "automatiser_processus", label: "Automatiser un processus" },
  { value: "exploiter_documents_ia", label: "Exploiter mes documents avec l'IA" },
  { value: "creer_outil_metier", label: "Créer un outil métier" },
  { value: "connecter_logiciels", label: "Connecter mes logiciels" },
  { value: "creer_plateforme", label: "Créer une plateforme" },
  { value: "decouvrir_bework", label: "Découvrir BeWork" },
  { value: "ne_sais_pas_encore", label: "Je ne sais pas encore" },
] as const;

export type IdeaIntentValue = (typeof IDEA_INTENT_OPTIONS)[number]["value"];

const ideaLabels = Object.fromEntries(IDEA_INTENT_OPTIONS.map((o) => [o.value, o.label])) as Record<
  string,
  string
>;

export function labelIdeaIntent(value: string): string {
  return ideaLabels[value] ?? value;
}
