/**
 * Normalisation des désignations ouvrages pour détection de doublons.
 * Réutilise les principes de chantier-resources avec règles BTP ouvrages.
 */

const UNIT_SYNONYMS: Record<string, string> = {
  centimetre: "cm",
  centimetres: "cm",
  centimètre: "cm",
  centimètres: "cm",
  millimetre: "mm",
  millimetres: "mm",
  millimètre: "mm",
  millimètres: "mm",
  metre: "m",
  metres: "m",
  mètre: "m",
  mètres: "m",
};

/** Normalise une désignation en clé de comparaison. */
export function normalizeWorkItemDesignation(raw: string): string {
  let s = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[''`´’]/g, "'")
    .replace(/[""«»]/g, " ")
    .replace(/\s*\/\s*/g, " ")
    .replace(/\s+/g, " ");

  for (const [from, to] of Object.entries(UNIT_SYNONYMS)) {
    s = s.replace(new RegExp(`\\b${from}\\b`, "gi"), to);
  }

  s = s
    .replace(/(\d+)\s*[x×]\s*(\d+)/gi, "$1x$2")
    .replace(/(\d+)\s*cm\b/gi, "$1cm")
    .replace(/(\d+)\s*mm\b/gi, "$1mm")
    .replace(/[^\p{L}\p{N}\s.'+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  return s;
}

/** Libellé affiché pour comparaison (titre + description courte). */
export function workItemDesignationForMerge(item: {
  title: string;
  shortDescription?: string | null;
  fullDescription?: string | null;
}): string {
  const title = item.title.trim();
  const short = item.shortDescription?.trim();
  const full = item.fullDescription?.trim();
  if (full && full.length > title.length + 20) return full;
  if (short && short.length > title.length) return short;
  return title;
}
