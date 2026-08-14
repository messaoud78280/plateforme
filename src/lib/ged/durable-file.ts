/**
 * GED V2 — documents durables vs médias / PJ temporaires.
 * Pas d’IA : règles déterministes sur nom + mime.
 */

const DURABLE_EXT = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "odt",
  "ods",
  "rtf",
  "dwg",
  "dxf",
  "dwf",
  "ifc",
  "csv",
  "txt",
];

const MEDIA_EXT = ["jpg", "jpeg", "png", "gif", "webp", "heic", "bmp", "mp4", "mov", "mp3", "wav", "m4a", "webm"];

export function extensionOfName(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i + 1).toLowerCase() : "";
}

/** PDF, bureautique, plans — entre automatiquement dans la GED. */
export function isDurableDocument(opts: {
  name?: string | null;
  mimeType?: string | null;
  kind?: string | null;
}): boolean {
  if (opts.kind === "audio" || opts.kind === "image") return false;
  const ext = extensionOfName(opts.name ?? "");
  if ((DURABLE_EXT as string[]).includes(ext)) return true;
  const mime = (opts.mimeType ?? "").toLowerCase();
  if (mime.includes("pdf")) return true;
  if (mime.includes("word") || mime.includes("excel") || mime.includes("spreadsheet") || mime.includes("officedocument")) {
    return true;
  }
  if (mime.includes("dwg") || mime.includes("dxf")) return true;
  return false;
}

/** Photos / vidéos chantier — GED uniquement si dépôt chantier explicite, pas chaque PJ chat. */
export function isMediaAttachment(opts: {
  name?: string | null;
  mimeType?: string | null;
  kind?: string | null;
}): boolean {
  if (opts.kind === "image" || opts.kind === "audio") return true;
  const ext = extensionOfName(opts.name ?? "");
  if ((MEDIA_EXT as string[]).includes(ext)) return true;
  const mime = (opts.mimeType ?? "").toLowerCase();
  return mime.startsWith("image/") || mime.startsWith("video/") || mime.startsWith("audio/");
}
