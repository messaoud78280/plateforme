/**
 * Listes métier pour l’inscription essai SaaS BeWork.
 * Corps de métier alignés sur le lexique Devis BeWork (+ options entreprise).
 */

import { BEWORK_DEVIS_FAMILY_LEXICON } from "@/lib/bework-devis-family-codes";

/** Tailles d’entreprise (effectifs). */
export const COMPANY_SIZES = [
  "1 personne (indépendant)",
  "2 à 5 salariés",
  "6 à 10 salariés",
  "11 à 20 salariés",
  "21 à 50 salariés",
  "51 à 100 salariés",
  "Plus de 100 salariés",
] as const;

export type CompanySize = (typeof COMPANY_SIZES)[number];

const EXTRA_CORPS = [
  "Entreprise générale / Tous corps d’état",
  "Gros œuvre",
  "Second œuvre",
  "Électricité",
  "Plomberie / Chauffage",
  "Couverture / Étanchéité",
  "Cloisons / Isolation / Plâtrerie",
  "Revêtements de sols",
  "Peinture / Décoration",
  "Menuiserie",
  "Métallerie / Serrurerie",
  "Ascenseurs",
  "Désamiantage",
  "Curage / Déconstruction",
  "Agencement",
  "Autre corps de métier BTP",
] as const;

/** Menu déroulant — corps de métier BTP (lexique + compléments courants). */
export const BTP_CORPS_METIER: readonly string[] = (() => {
  const fromLexicon = [...BEWORK_DEVIS_FAMILY_LEXICON]
    .filter((f) => f.code !== "GAR" && f.code !== "DIV")
    .sort((a, b) => a.order - b.order)
    .map((f) => f.label);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const label of [...EXTRA_CORPS, ...fromLexicon]) {
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out.sort((a, b) => a.localeCompare(b, "fr"));
})();

export function isValidCompanySize(value: string): boolean {
  return (COMPANY_SIZES as readonly string[]).includes(value);
}

export function isValidBtpCorpsMetier(value: string): boolean {
  return BTP_CORPS_METIER.includes(value);
}

/** Normalise un SIRET (14 chiffres). */
export function normalizeSiret(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidSiret(raw: string): boolean {
  const digits = normalizeSiret(raw);
  return digits.length === 14;
}
