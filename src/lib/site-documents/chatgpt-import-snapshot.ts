/**
 * Phase B1 — Snapshot / undo de l’import ChatGPT document.
 *
 * Nouveaux imports : snapshot objet avec toutes les colonnes touchées par applyChatgptImport.
 * Anciens imports : snapshot = payloadJson brut → restauration partielle (présence de propriété).
 */
import type { Prisma } from "@prisma/client";

export const DOCUMENT_IMPORT_STALE_CODE = "DOCUMENT_IMPORT_STALE" as const;
export const DOCUMENT_UNDO_STALE_CODE = "DOCUMENT_UNDO_STALE" as const;

export const DOCUMENT_IMPORT_STALE_MESSAGE =
  "Le document a été modifié depuis la préparation de cet import. Vérifiez de nouveau le contenu avant de l’appliquer.";

export const DOCUMENT_UNDO_STALE_MESSAGE =
  "Le document a été modifié depuis cet import. L’annulation automatique n’est plus disponible.";

/** Colonnes réellement écrites par applyChatgptImport (hors updatedById). */
export type SiteDocumentImportSnapshotV2 = {
  payloadJson: unknown;
  title: string;
  visitDate: string | null;
  visitTime: string | null;
  weather: string | null;
  authorName: string | null;
  sourceFormat: string | null;
};

export type ImportSummaryMeta = {
  kind: string;
  format: string;
  documentBaseVersion: number;
  versionAfter: number;
};

function visitDateToIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  return s ? s.slice(0, 10) : null;
}

export function buildImportSnapshotBefore(doc: {
  payloadJson: unknown;
  title: string;
  visitDate: Date | string | null;
  visitTime: string | null;
  weather: string | null;
  authorName: string | null;
  sourceFormat: string | null;
}): SiteDocumentImportSnapshotV2 {
  return {
    payloadJson: doc.payloadJson,
    title: doc.title,
    visitDate: visitDateToIso(doc.visitDate),
    visitTime: doc.visitTime,
    weather: doc.weather,
    authorName: doc.authorName,
    sourceFormat: doc.sourceFormat,
  };
}

export function isImportSnapshotV2(raw: unknown): raw is SiteDocumentImportSnapshotV2 {
  return (
    !!raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    Object.prototype.hasOwnProperty.call(raw, "payloadJson")
  );
}

/**
 * Construit le data Prisma d’undo à partir du snapshot.
 * - V2 : restaure chaque propriété présente.
 * - Legacy : restaure uniquement payloadJson (le snapshot EST le payload).
 * Ne remplit jamais une colonne absente avec null.
 */
export function buildUndoDataFromSnapshot(
  snapshotBeforeJson: unknown,
): Prisma.SiteDocumentUpdateInput {
  if (isImportSnapshotV2(snapshotBeforeJson)) {
    const data: Prisma.SiteDocumentUpdateInput = {};
    const snap = snapshotBeforeJson as Record<string, unknown>;

    if (Object.prototype.hasOwnProperty.call(snap, "payloadJson")) {
      data.payloadJson = snap.payloadJson as Prisma.InputJsonValue;
    }
    if (Object.prototype.hasOwnProperty.call(snap, "title") && typeof snap.title === "string") {
      data.title = snap.title;
    }
    if (Object.prototype.hasOwnProperty.call(snap, "visitDate")) {
      const iso = visitDateToIso(snap.visitDate as string | null);
      data.visitDate = iso ? new Date(iso) : null;
    }
    if (Object.prototype.hasOwnProperty.call(snap, "visitTime")) {
      data.visitTime = (snap.visitTime as string | null) ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(snap, "weather")) {
      data.weather = (snap.weather as string | null) ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(snap, "authorName")) {
      data.authorName = (snap.authorName as string | null) ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(snap, "sourceFormat")) {
      data.sourceFormat = (snap.sourceFormat as string | null) ?? null;
    }
    return data;
  }

  // Ancien format : snapshot = payloadJson seul
  return {
    payloadJson: snapshotBeforeJson as Prisma.InputJsonValue,
  };
}

export function readImportSummaryMeta(
  summaryJson: unknown,
): { documentBaseVersion: number | null; versionAfter: number | null } {
  if (!summaryJson || typeof summaryJson !== "object" || Array.isArray(summaryJson)) {
    return { documentBaseVersion: null, versionAfter: null };
  }
  const o = summaryJson as Record<string, unknown>;
  const base =
    typeof o.documentBaseVersion === "number" && Number.isFinite(o.documentBaseVersion)
      ? o.documentBaseVersion
      : null;
  const after =
    typeof o.versionAfter === "number" && Number.isFinite(o.versionAfter)
      ? o.versionAfter
      : null;
  return { documentBaseVersion: base, versionAfter: after };
}

export function buildImportSummaryJson(meta: ImportSummaryMeta): Prisma.InputJsonValue {
  return {
    kind: meta.kind,
    format: meta.format,
    documentBaseVersion: meta.documentBaseVersion,
    versionAfter: meta.versionAfter,
  };
}
