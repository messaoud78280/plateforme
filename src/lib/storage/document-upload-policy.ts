/** Politique d'upload documents mission / bibliothèque client (alignée dossier chantier). */

export const MISSION_DOCUMENT_MAX_BYTES = 100 * 1024 * 1024; // 100 Mo
export const MISSION_DOCUMENT_MAX_LABEL = "100 Mo";

const BLOCKED_MIME_PREFIXES = [
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-executable",
  "application/x-sh",
  "application/x-bash",
  "application/x-php",
  "application/x-python",
  "application/javascript",
  "text/javascript",
];

const ALLOWED_MIME_PREFIXES = [
  "application/",
  "image/",
  "video/",
  "audio/",
  "text/",
  "font/",
];

const BLOCKED_EXTENSIONS = /\.(exe|bat|cmd|com|msi|scr|ps1|vbs|js|jar|sh|bash)$/i;

export function isAllowedMissionDocument(file: { type?: string; name: string }): boolean {
  if (BLOCKED_EXTENSIONS.test(file.name)) return false;
  const mime = (file.type || "").toLowerCase();
  if (!mime) return true;
  if (BLOCKED_MIME_PREFIXES.some((p) => mime.startsWith(p))) return false;
  return ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p));
}

export function missionDocumentRejectReason(file: { type?: string; name: string }): string | null {
  if (!isAllowedMissionDocument(file)) {
    return `${file.name} : type de fichier non autorisé (exécutables et scripts interdits)`;
  }
  return null;
}
