/** Formes juridiques entreprises (clients BeWork = toujours des sociétés). */
export const FORMES_JURIDIQUES = [
  "SAS",
  "SASU",
  "SARL",
  "EURL",
  "SA",
  "SCI",
  "SNC",
  "SCP",
  "SCM",
  "GIE",
  "Association",
  "Auto-entrepreneur / Micro-entreprise",
  "Profession libérale",
  "SEL",
  "EIRL",
  "Autre",
] as const;

export const SECTEURS_ACTIVITE = [
  "BTP / Construction",
  "E-commerce",
  "Juridique",
  "Commercial",
  "Réseaux sociaux / Médias",
  "Événementiel",
  "Agroalimentaire",
  "Santé",
  "Conseils / Consulting",
  "Finance / Assurances",
  "Industrie",
  "Autre",
] as const;

export type FormeJuridique = (typeof FORMES_JURIDIQUES)[number];
export type SecteurActivite = (typeof SECTEURS_ACTIVITE)[number];

export function isValidFormeJuridique(value: string): boolean {
  return (FORMES_JURIDIQUES as readonly string[]).includes(value);
}

export function isValidSecteurActivite(value: string): boolean {
  return (SECTEURS_ACTIVITE as readonly string[]).includes(value);
}
