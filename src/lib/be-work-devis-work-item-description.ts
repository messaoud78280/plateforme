/**
 * Résolution de la désignation complète (fullDescription) à l’import JSON ouvrage.
 */

const PLACEHOLDER_DESCRIPTIONS = new Set([
  "",
  "à compléter",
  "a completer",
  "à compléter.",
  "a completer.",
  "—",
  "-",
  "n/a",
  "na",
]);

/** Champs « détaillés » (ordre de priorité). */
const DETAILED_DESCRIPTION_PASTE_KEYS = [
  "designationComplete",
  "designation_complete",
  "descriptionComplete",
  "description_complete",
  "fullDescription",
  "description",
  "designation",
] as const;

/** Derniers recours avant génération automatique. */
const FALLBACK_DESCRIPTION_PASTE_KEYS = ["title", "name"] as const;

const TITLE_FALLBACK_KEYS = ["title", "name", "designation", "libelle", "label"] as const;

const MATERIAL_TYPE_HINT_KEYS = [
  "itemType",
  "type",
  "nature",
  "typeOuvrage",
  "categorie",
  "category",
  "natureOuvrage",
  "kind",
] as const;

function coercePasteString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

function pickPasteString(obj: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      const leaf = coercePasteString(obj[k]);
      if (leaf !== null && leaf.trim()) return leaf.trim();
    }
  }
  const byLower = new Map<string, string>();
  for (const k of Object.keys(obj)) {
    byLower.set(k.toLowerCase(), k);
  }
  for (const k of keys) {
    const actual = byLower.get(k.toLowerCase());
    if (actual) {
      const leaf = coercePasteString(obj[actual]);
      if (leaf !== null && leaf.trim()) return leaf.trim();
    }
  }
  return null;
}

/** Texte vide ou placeholder type « À compléter ». */
export function isIncompleteDescriptionText(value: string | null | undefined): boolean {
  if (value == null) return true;
  const t = value.trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return true;
  return PLACEHOLDER_DESCRIPTIONS.has(t);
}

/** Ouvrage « matériaux / fourniture seule » (heuristique sur champs JSON). */
export function isMaterialOnlyWorkItemPaste(obj: Record<string, unknown>): boolean {
  if (obj.fournitureSeule === true || obj.materielSeul === true || obj.materiauxSeuls === true) {
    return true;
  }
  if (obj.isMaterial === true || obj.materialOnly === true) return true;

  const hint = pickPasteString(obj, MATERIAL_TYPE_HINT_KEYS);
  if (!hint) return false;

  const n = hint
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");

  if (n.includes("materiel") || n.includes("materiau")) return true;
  if (n.includes("fourniture") && (n.includes("seul") || !n.includes("pose"))) return true;
  if (n === "mat" || n === "material" || n === "supply") return true;

  return false;
}

const TEMPLATE_OUVRAGE_TECHNIQUE =
  "Fourniture et/ou mise en œuvre de {title}, comprenant les sujétions courantes d’exécution, de transport, de préparation, d’implantation, de nettoyage et d’adaptation aux prescriptions du CCTP.";

const TEMPLATE_MATERIAUX_SEULS =
  "Fourniture de {title}, comprenant l’approvisionnement, le transport, le déchargement sur chantier et toutes sujétions liées aux conditions d’accès, de stockage et aux prescriptions du CCTP.";

function stripLeadingFournitureDe(title: string): string {
  return title.replace(/^fourniture\s+(de\s+|d['’])/i, "").trim();
}

export function generateFullDescriptionFromTitle(title: string, materialOnly: boolean): string {
  const t = title.trim();
  if (!t) {
    return TEMPLATE_OUVRAGE_TECHNIQUE.replace("{title}", "l’ouvrage");
  }

  if (materialOnly) {
    if (/^fourniture\b/i.test(t)) {
      const lead = t.charAt(0).toUpperCase() + t.slice(1);
      return `${lead}, comprenant l’approvisionnement, le transport, le déchargement sur chantier et toutes sujétions liées aux conditions d’accès, de stockage et aux prescriptions du CCTP.`;
    }
    const subject = stripLeadingFournitureDe(t) || t;
    return TEMPLATE_MATERIAUX_SEULS.replace("{title}", subject);
  }

  return TEMPLATE_OUVRAGE_TECHNIQUE.replace("{title}", t);
}

/**
 * Choisit la désignation complète à enregistrer à partir du JSON collé.
 * Ne renvoie « À compléter » que si aucun titre exploitable n’existe.
 */
export function resolveImportedFullDescription(
  obj: Record<string, unknown>,
  options?: { titleHint?: string; materialOnly?: boolean },
): string {
  for (const key of DETAILED_DESCRIPTION_PASTE_KEYS) {
    const raw = pickPasteString(obj, [key]);
    if (raw && !isIncompleteDescriptionText(raw)) {
      return raw;
    }
  }

  for (const key of FALLBACK_DESCRIPTION_PASTE_KEYS) {
    const raw = pickPasteString(obj, [key]);
    if (raw && !isIncompleteDescriptionText(raw)) {
      return raw;
    }
  }

  const title =
    (options?.titleHint?.trim() || "") ||
    pickPasteString(obj, TITLE_FALLBACK_KEYS) ||
    "";

  if (title && !isIncompleteDescriptionText(title)) {
    const materialOnly = options?.materialOnly ?? isMaterialOnlyWorkItemPaste(obj);
    return generateFullDescriptionFromTitle(title, materialOnly);
  }

  return "À compléter.";
}

/** Heuristique matériaux seuls à partir des données déjà en base (sans JSON source). */
export function inferMaterialOnlyFromStoredWorkItem(item: {
  title: string;
  unit?: string | null;
  shortDescription?: string | null;
}): boolean {
  const t = item.title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (t.includes("mise en oeuvre") || t.includes("mise en œuvre") || t.includes("mise en place")) {
    return false;
  }
  if (/^fourniture\b/.test(t)) {
    return true;
  }
  if (t.startsWith("approvisionnement") || t.includes("materiau")) {
    return true;
  }
  const short = item.shortDescription?.trim().toLowerCase() ?? "";
  if (
    (short.startsWith("fourniture de") || short.startsWith("fourniture d'")) &&
    !short.includes("mise en")
  ) {
    return true;
  }
  return false;
}

/**
 * Résout une désignation complète pour un ouvrage déjà en base (script de rattrapage).
 * Retourne `null` si aucune mise à jour n’est nécessaire ou possible.
 */
export function resolveFullDescriptionForExistingWorkItem(item: {
  title: string;
  shortDescription?: string | null;
  fullDescription: string;
  unit?: string | null;
}): string | null {
  if (!isIncompleteDescriptionText(item.fullDescription)) {
    return null;
  }

  if (item.shortDescription && !isIncompleteDescriptionText(item.shortDescription)) {
    return item.shortDescription.trim();
  }

  const title = item.title.trim();
  if (!title || title === "Sans titre") {
    return null;
  }

  const materialOnly = inferMaterialOnlyFromStoredWorkItem(item);
  return generateFullDescriptionFromTitle(title, materialOnly);
}

/** Applique titre + désignation complète résolus sur les valeurs formulaire d’import. */
export function applyResolvedDescriptionsToPasteValues(
  obj: Record<string, unknown>,
  values: { title: string; fullDescription: string },
): void {
  const titleFromJson = pickPasteString(obj, TITLE_FALLBACK_KEYS);
  if (titleFromJson && !values.title.trim()) {
    values.title = titleFromJson;
  }

  const materialOnly = isMaterialOnlyWorkItemPaste(obj);
  const resolved = resolveImportedFullDescription(obj, {
    titleHint: values.title.trim() || titleFromJson || undefined,
    materialOnly,
  });

  if (isIncompleteDescriptionText(values.fullDescription) || values.fullDescription.trim() === "À compléter.") {
    values.fullDescription = resolved;
  } else if (!values.fullDescription.trim()) {
    values.fullDescription = resolved;
  }
}
