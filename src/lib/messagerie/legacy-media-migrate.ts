/**
 * Migration MESSAGERIE-V2C.2 — helpers purs (idempotents).
 * Legacy public documents/dm/… → bucket privé messagerie + storage://
 */

import {
  LEGACY_DM_PREFIX,
  MESSAGERIE_MEDIA_BUCKET,
  buildMessagerieStorageRef,
  parseMessagerieStorageRef,
} from "@/lib/messagerie/media-storage";
import type { MsgAttachment } from "@/lib/messagerie/media-preview";

export type LegacyAttachmentHit = {
  index: number;
  attachment: MsgAttachment;
  legacyBucket: string;
  legacyPath: string;
  alreadyMigrated: boolean;
};

export function isLegacyPublicMessagerieUrl(fileUrl: string): boolean {
  const parsed = parseMessagerieStorageRef(fileUrl);
  if (!parsed) {
    // URL publique non parsée mais contenant /documents/dm/
    return /\/documents\/dm\//i.test(fileUrl) || fileUrl.startsWith(LEGACY_DM_PREFIX);
  }
  return parsed.bucket === "documents" && parsed.path.startsWith(LEGACY_DM_PREFIX);
}

export function isAlreadyMigratedRef(fileUrl: string): boolean {
  const parsed = parseMessagerieStorageRef(fileUrl);
  return Boolean(
    parsed &&
      parsed.bucket === MESSAGERIE_MEDIA_BUCKET &&
      (parsed.path.startsWith("legacy/") || parsed.path.startsWith("v2c/")),
  );
}

/** Chemin cible déterministe (idempotent si relancé). */
export function buildLegacyTargetPath(params: {
  messageKind: "DIRECT" | "TASK" | "PROJECT";
  messageId: string;
  legacyPath: string;
  fileName?: string;
}): string {
  const base =
    params.legacyPath.split("/").pop()?.replace(/[^a-zA-Z0-9._-]/g, "_") ||
    params.fileName?.replace(/[^a-zA-Z0-9._-]/g, "_") ||
    "file";
  // Hash court du path legacy pour éviter collisions de noms
  const slug = params.legacyPath
    .replace(/^dm\//, "")
    .replace(/[^a-zA-Z0-9._/-]/g, "_")
    .replace(/\//g, "__");
  return `legacy/${params.messageKind.toLowerCase()}/${params.messageId}/${slug || base}`;
}

export function findLegacyAttachments(atts: unknown): LegacyAttachmentHit[] {
  if (!Array.isArray(atts)) return [];
  const hits: LegacyAttachmentHit[] = [];
  atts.forEach((raw, index) => {
    const a = raw as MsgAttachment;
    if (!a?.fileUrl) return;
    if (isAlreadyMigratedRef(a.fileUrl) && !isLegacyPublicMessagerieUrl(a.fileUrl)) {
      return;
    }
    if (!isLegacyPublicMessagerieUrl(a.fileUrl)) return;
    const parsed = parseMessagerieStorageRef(a.fileUrl);
    const legacyPath =
      parsed?.path ??
      (a.fileUrl.startsWith(LEGACY_DM_PREFIX)
        ? a.fileUrl
        : a.fileUrl.match(/\/documents\/(dm\/.+)$/i)?.[1] ?? "");
    if (!legacyPath.startsWith(LEGACY_DM_PREFIX)) return;
    hits.push({
      index,
      attachment: a,
      legacyBucket: "documents",
      legacyPath,
      alreadyMigrated: Boolean(a.storagePath?.startsWith("legacy/")),
    });
  });
  return hits;
}

export function applyMigratedAttachment(
  atts: MsgAttachment[],
  index: number,
  targetPath: string,
): MsgAttachment[] {
  const next = atts.map((a, i) => {
    if (i !== index) return a;
    const fileUrl = buildMessagerieStorageRef(MESSAGERIE_MEDIA_BUCKET, targetPath);
    return {
      ...a,
      fileUrl,
      bucket: MESSAGERIE_MEDIA_BUCKET,
      storagePath: targetPath,
    };
  });
  return next;
}

export type MigrateStats = {
  messagesScanned: number;
  messagesWithLegacy: number;
  attachmentsFound: number;
  migrated: number;
  skippedAlready: number;
  skippedMissing: number;
  purged: number;
  errors: number;
};
