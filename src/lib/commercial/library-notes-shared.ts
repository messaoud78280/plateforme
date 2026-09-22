/**
 * Constantes notes bibliothèque — safe côté client (pas de node:crypto / prisma).
 */

export const LIBRARY_NOTE_KINDS = [
  "INTERNAL",
  "IMPLEMENTATION",
  "VIGILANCE",
  "SUPPLIER",
  "COMMENT",
  "OTHER",
] as const;

export type LibraryNoteKind = (typeof LIBRARY_NOTE_KINDS)[number];

export const LIBRARY_NOTE_KIND_LABELS: Record<LibraryNoteKind, string> = {
  INTERNAL: "Note interne",
  IMPLEMENTATION: "Conseil de mise en œuvre",
  VIGILANCE: "Point de vigilance",
  SUPPLIER: "Information fournisseur",
  COMMENT: "Commentaire",
  OTHER: "Autre",
};

/** Ne jamais inclure dans snapshots devis / PDF client. */
export function isClientSafeNoteKind(kind: string): boolean {
  return kind !== "INTERNAL";
}

export function assertLibraryNoteKind(kind: string): LibraryNoteKind {
  if ((LIBRARY_NOTE_KINDS as readonly string[]).includes(kind)) {
    return kind as LibraryNoteKind;
  }
  throw new Error("Catégorie de note invalide");
}
