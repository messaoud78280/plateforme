/**
 * Stockage médias Messagerie V2C.1 — bucket privé + référence opaque.
 * Ne jamais exposer une URL publique dans l’UI : passer par /api/messagerie/media.
 */

export const MESSAGERIE_MEDIA_BUCKET = "messagerie";
/** Ancien préfixe encore présent dans documents (public) — accès uniquement via ACL. */
export const LEGACY_DM_PREFIX = "dm/";

export const MESSAGERIE_MEDIA_MAX_BYTES = 15 * 1024 * 1024;
/** TTL signed URL médias messagerie (15 min). */
export const MESSAGERIE_SIGNED_URL_TTL_SEC = 15 * 60;

/** Référence stockée dans attachmentsJson.fileUrl (non téléchargeable seule). */
export function buildMessagerieStorageRef(bucket: string, path: string): string {
  return `storage://${bucket}/${path.replace(/^\/+/, "")}`;
}

export function parseMessagerieStorageRef(
  fileUrl: string,
): { bucket: string; path: string } | null {
  const raw = String(fileUrl || "").trim();
  if (!raw) return null;

  if (raw.startsWith("storage://")) {
    const rest = raw.slice("storage://".length);
    const slash = rest.indexOf("/");
    if (slash <= 0) return null;
    const bucket = rest.slice(0, slash);
    const path = decodeURIComponent(rest.slice(slash + 1));
    if (!bucket || !path) return null;
    return { bucket, path };
  }

  // Compat anciennes URLs publiques documents/dm/...
  try {
    const u = new URL(raw);
    const m = u.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
    if (!m?.[1] || !m[2]) return null;
    return {
      bucket: decodeURIComponent(m[1]),
      path: decodeURIComponent(m[2]),
    };
  } catch {
    // Path nu éventuel
    if (raw.startsWith(LEGACY_DM_PREFIX) || raw.startsWith("v2c/")) {
      return { bucket: "documents", path: raw };
    }
    return null;
  }
}

export function isMessagerieMediaPath(bucket: string, path: string): boolean {
  if (bucket === MESSAGERIE_MEDIA_BUCKET) return true;
  if (bucket === "documents" && path.startsWith(LEGACY_DM_PREFIX)) return true;
  return false;
}
