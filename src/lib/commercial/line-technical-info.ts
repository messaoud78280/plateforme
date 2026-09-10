/**
 * Infos techniques optionnelles d’une ligne devis (épaisseur, etc.).
 * Stockées dans compositionSnapshotJson.technical — sans migration Prisma.
 */

export type LineTechnicalInfo = {
  /** Ex. "12 à 15 cm" — libre, jamais hardcodé globalement. */
  thicknessNote?: string | null;
};

export function parseLineTechnicalInfo(raw: unknown): LineTechnicalInfo {
  if (!raw || typeof raw !== "object") return {};
  const tech = (raw as { technical?: unknown }).technical;
  if (!tech || typeof tech !== "object") return {};
  const t = tech as Record<string, unknown>;
  const thicknessNote =
    typeof t.thicknessNote === "string" ? t.thicknessNote.trim() || null : null;
  return { thicknessNote };
}

export function mergeTechnicalIntoCompositionSnapshot(
  existing: unknown,
  technical: LineTechnicalInfo,
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object"
      ? { ...(existing as Record<string, unknown>) }
      : {};
  const prevTech =
    base.technical && typeof base.technical === "object"
      ? { ...(base.technical as Record<string, unknown>) }
      : {};
  if (technical.thicknessNote !== undefined) {
    if (technical.thicknessNote) prevTech.thicknessNote = technical.thicknessNote;
    else delete prevTech.thicknessNote;
  }
  if (Object.keys(prevTech).length) base.technical = prevTech;
  else delete base.technical;
  return base;
}

/** Enrichit la description PDF avec l’épaisseur si absente du texte. */
export function appendThicknessToDescription(
  description: string | null | undefined,
  thicknessNote: string | null | undefined,
): string | null {
  const desc = (description ?? "").trim();
  const th = (thicknessNote ?? "").trim();
  if (!th) return desc || null;
  if (desc.toLowerCase().includes("épaisseur") || desc.toLowerCase().includes("epaisseur")) {
    return desc || null;
  }
  const clause = `Épaisseur moyenne d'environ ${th} après compactage.`;
  return desc ? `${desc} ${clause}` : clause;
}

/** Alerte interne réutilisable — jamais sur le PDF client. */
export const DELIMITATION_GRAVILLON_ALERT =
  "Délimitations et maintien périphérique du gravillon à confirmer selon les bordures et ouvrages existants conservés.";

export function ensureInternalVerifyAlert(
  internalNotes: string | null | undefined,
  alertText: string,
): string {
  const notes = (internalNotes ?? "").trim();
  if (notes.includes(alertText)) return notes;
  const line = `⚠ ${alertText}`;
  if (!notes.includes("=== À vérifier avant envoi ===")) {
    return notes
      ? `${notes}\n\n=== À vérifier avant envoi ===\n${line}`
      : `=== À vérifier avant envoi ===\n${line}`;
  }
  return notes.replace(
    /=== À vérifier avant envoi ===/,
    `=== À vérifier avant envoi ===\n${line}`,
  );
}
