/** Configuration transmission de documents — Skill CCTP */

export const CCTP_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;
export const CCTP_MAX_REFERENCE_FILES = 10;
export const CCTP_EXTRACT_MAX_CHARS = 80_000;

/** Extensions dangereuses refusées */
const BLOCKED_EXT = /\.(exe|msi|bat|cmd|com|scr|ps1|vbs|jar|app|dmg|deb|rpm)$/i;

export type CctpFileCategory = "document" | "spreadsheet" | "image" | "cad" | "archive" | "other";

export function getCctpFileCategory(fileName: string, mimeType: string): CctpFileCategory {
  const n = fileName.toLowerCase();
  const t = mimeType.toLowerCase();
  if (/\.(dwg|dxf|dgn|ifc|rvt|skp|pln)$/i.test(n) || t.includes("cad")) return "cad";
  if (/\.(zip|rar|7z|tar|gz)$/i.test(n) || t.includes("zip") || t.includes("compressed")) return "archive";
  if (t.startsWith("image/") || /\.(jpe?g|png|gif|webp|bmp|tiff?|heic|svg)$/i.test(n)) return "image";
  if (
    /\.(xlsx?|csv|ods)$/i.test(n) ||
    t.includes("spreadsheet") ||
    t.includes("excel") ||
    t === "text/csv"
  ) {
    return "spreadsheet";
  }
  if (
    /\.(pdf|docx?|odt|rtf|txt|md|html?|json|xml)$/i.test(n) ||
    t.includes("pdf") ||
    t.includes("word") ||
    t.startsWith("text/")
  ) {
    return "document";
  }
  return "other";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function isCctpFileAccepted(file: { name: string; size: number }): boolean {
  if (file.size <= 0 || file.size > CCTP_UPLOAD_MAX_BYTES) return false;
  if (BLOCKED_EXT.test(file.name)) return false;
  return true;
}

export const CCTP_ACCEPTED_FORMATS_HINT =
  "PDF, Word, Excel, images (JPG, PNG…), plans (DWG, DXF), CSV, TXT, HTML, ZIP… — 20 Mo max / fichier, 10 fichiers max.";
