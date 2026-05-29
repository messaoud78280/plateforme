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
  "metre lineaire": "ml",
  "metre linéaire": "ml",
  "metres lineaires": "ml",
  "metres linéaires": "ml",
  "metre carre": "m2",
  "metre carré": "m2",
  "metres carres": "m2",
  "metres carrés": "m2",
  "metre cube": "m3",
  "metre cubique": "m3",
  "metres cubes": "m3",
  u: "u",
  unite: "u",
  unité: "u",
  ens: "ens",
  ensemble: "ens",
  forfait: "forfait",
};

const PHRASE_SYNONYMS: [RegExp, string][] = [
  [/\bfourniture\s*\+\s*pose\b/gi, "fourniture et pose"],
  [/\bf\+p\b/gi, "fourniture et pose"],
  [/\bf\s*\/\s*p\b/gi, "fourniture et pose"],
  [/\bm\s*²\b/gi, "m2"],
  [/\bm\s*2\b/gi, "m2"],
  [/\bm\s*³\b/gi, "m3"],
  [/\bm\s*3\b/gi, "m3"],
  [/\bml\b/gi, "ml"],
  [/\bgros\s*oeuvre\b/gi, "gros oeuvre"],
  [/\bgros\s*œuvre\b/gi, "gros oeuvre"],
];

const PLURAL_SUFFIXES = ["s", "x"] as const;

/** Retire pluriels simples pour rapprocher des libellés proches. */
function stripSimplePlural(token: string): string {
  if (token.length < 5) return token;
  for (const suf of PLURAL_SUFFIXES) {
    if (token.endsWith(suf) && token.length - suf.length >= 4) {
      return token.slice(0, -suf.length);
    }
  }
  return token;
}

/** Normalise une désignation en clé de comparaison. */
export function normalizeWorkItemDesignation(raw: string): string {
  let s = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .replace(/[''`´’]/g, "'")
    .replace(/[""«»]/g, " ")
    .replace(/\s*\/\s*/g, " ")
    .replace(/\s+/g, " ");

  for (const [from, to] of Object.entries(UNIT_SYNONYMS)) {
    s = s.replace(new RegExp(`\\b${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), to);
  }

  for (const [re, repl] of PHRASE_SYNONYMS) {
    s = s.replace(re, repl);
  }

  s = s
    .replace(/(\d+)\s*[x×]\s*(\d+)/gi, "$1x$2")
    .replace(/(\d+)\s*cm\b/gi, "$1cm")
    .replace(/(\d+)\s*mm\b/gi, "$1mm")
    .replace(/[^\p{L}\p{N}\s.'+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  s = s
    .split(" ")
    .map(stripSimplePlural)
    .join(" ")
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
