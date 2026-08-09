/**
 * GED-V2A.2 — Classification / conversion des références bucket `documents`.
 * Conversion URL publique → storage://documents/{path} sans copie de fichier.
 */
import {
  DOCUMENTS_BUCKET,
  buildDocumentsStorageRef,
  extractStoragePathFromUrl,
} from "@/lib/storage/supabase-object";

export type DocumentsRefClass =
  | "A_STORAGE_REF"
  | "B_PUBLIC_CONVERTIBLE"
  | "C_EXTERNAL"
  | "D_EMPTY"
  | "E_RAW_PATH";

export type DocumentsRefAnalysis = {
  class: DocumentsRefClass;
  original: string;
  path: string | null;
  storageRef: string | null;
};

/** Détecte une URL Supabase documents (public ou sign). */
export function isSupabaseDocumentsUrl(url: string): boolean {
  const raw = String(url || "").trim();
  if (!raw) return false;
  try {
    const u = new URL(raw);
    return /\/storage\/v1\/object\/(public|sign)\/documents\//i.test(u.pathname);
  } catch {
    return false;
  }
}

export function classifyDocumentsRef(raw: string | null | undefined): DocumentsRefAnalysis {
  const original = String(raw ?? "").trim();
  if (!original) {
    return { class: "D_EMPTY", original, path: null, storageRef: null };
  }

  if (original.startsWith(`storage://${DOCUMENTS_BUCKET}/`)) {
    const path = extractStoragePathFromUrl(original, DOCUMENTS_BUCKET);
    return {
      class: "A_STORAGE_REF",
      original,
      path,
      storageRef: path ? buildDocumentsStorageRef(path) : original,
    };
  }

  // Autre bucket storage:// (messagerie, etc.) — hors migration documents
  if (original.startsWith("storage://")) {
    return { class: "C_EXTERNAL", original, path: null, storageRef: null };
  }

  if (isSupabaseDocumentsUrl(original)) {
    const path = extractStoragePathFromUrl(original, DOCUMENTS_BUCKET);
    if (!path) {
      return { class: "C_EXTERNAL", original, path: null, storageRef: null };
    }
    return {
      class: "B_PUBLIC_CONVERTIBLE",
      original,
      path,
      storageRef: buildDocumentsStorageRef(path),
    };
  }

  // Path nu type chantiers/... déjà dans documents
  if (
    !original.includes("://") &&
    (original.startsWith("chantiers/") ||
      original.startsWith("purchase-orders/") ||
      original.startsWith("reports/") ||
      original.startsWith("appointments/") ||
      original.startsWith("projects/") ||
      original.startsWith("skill-") ||
      original.startsWith("dico-") ||
      original.startsWith("dm/"))
  ) {
    return {
      class: "E_RAW_PATH",
      original,
      path: original.replace(/^\/+/, ""),
      storageRef: buildDocumentsStorageRef(original.replace(/^\/+/, "")),
    };
  }

  return { class: "C_EXTERNAL", original, path: null, storageRef: null };
}

/** Convertit si B ou E ; sinon null (ne pas écrire). */
export function toDocumentsStorageRef(raw: string | null | undefined): string | null {
  const a = classifyDocumentsRef(raw);
  if (a.class === "B_PUBLIC_CONVERTIBLE" || a.class === "E_RAW_PATH") {
    return a.storageRef;
  }
  return null;
}
