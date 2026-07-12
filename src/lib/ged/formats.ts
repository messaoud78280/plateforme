/** Constantes GED chantier BeWork — formats, catégories, preview. */

export const GED_CATEGORIES = [
  "Marché",
  "Administratif",
  "Contractuel",
  "Études",
  "Plans",
  "Méthodes",
  "Sécurité",
  "Qualité",
  "Environnement",
  "Fournisseurs",
  "Sous-traitants",
  "Financier",
  "Factures",
  "Situations",
  "Travaux supplémentaires",
  "Réunions",
  "Contrôles",
  "Photos",
  "Réception",
  "Réserves",
  "DOE",
  "Archives",
  "À classer",
] as const;

export const GED_VISIBILITY = [
  "Interne BeWork",
  "Interne entreprise cliente",
  "BeWork et entreprise cliente",
  "Intervenants autorisés",
  "Partage temporaire",
] as const;

/** Extensions avec aperçu natif navigateur ou proxy BeWork. */
export const GED_NATIVE_PREVIEW_EXT = [
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "bmp",
  "txt",
  "csv",
] as const;

/** Extensions convertibles en PDF (aperçu généré — original intact). */
export const GED_CONVERTIBLE_EXT = [
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "odt",
  "ods",
  "rtf",
] as const;

/** Formats techniques : téléchargement + métadonnées ; aperçu seulement si PDF/image associé. */
export const GED_TECHNICAL_EXT = [
  "dwg",
  "dxf",
  "dwf",
  "ifc",
  "rvt",
  "nwd",
  "nwc",
  "skp",
] as const;

export const GED_ARCHIVE_EXT = ["zip", "7z", "rar"] as const;

export type GedPreviewMode =
  | "native"
  | "converted"
  | "metadata_only"
  | "download_only"
  | "unavailable";

export function extensionOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i + 1).toLowerCase() : "";
}

export function resolveGedPreviewMode(filename: string, mimeType?: string | null): GedPreviewMode {
  const ext = extensionOf(filename);
  const mime = (mimeType ?? "").toLowerCase();

  if (
    (GED_NATIVE_PREVIEW_EXT as readonly string[]).includes(ext) ||
    mime.includes("pdf") ||
    mime.startsWith("image/") ||
    mime.startsWith("text/")
  ) {
    return "native";
  }
  if ((GED_CONVERTIBLE_EXT as readonly string[]).includes(ext)) return "converted";
  if ((GED_TECHNICAL_EXT as readonly string[]).includes(ext)) return "metadata_only";
  if ((GED_ARCHIVE_EXT as readonly string[]).includes(ext)) return "download_only";
  if (mime.startsWith("video/") || mime.startsWith("audio/")) return "download_only";
  return "unavailable";
}

export function previewModeLabel(mode: GedPreviewMode): string {
  switch (mode) {
    case "native":
      return "Aperçu disponible";
    case "converted":
      return "Aperçu généré — le fichier original reste disponible au téléchargement.";
    case "metadata_only":
      return "Format technique : métadonnées et téléchargement de l’original.";
    case "download_only":
      return "Aperçu non disponible — téléchargement sécurisé de l’original.";
    default:
      return "Aperçu indisponible pour ce format.";
  }
}

/** Suggestion de rubrique classeur à partir du nom / catégorie. */
export function suggestFolderCode(opts: {
  filename: string;
  category?: string | null;
  documentType?: string | null;
}): string {
  const cat = (opts.category ?? "").toLowerCase();
  const type = `${opts.documentType ?? ""} ${opts.filename}`.toLowerCase();

  if (cat.includes("classer") || !cat) return "00";
  if (cat === "marché" || /ccap|cctp|dpgf|bpu|dqe|acte d.engagement|notification|avenant|os\b/.test(type))
    return "12";
  if (cat === "plans" || /\.(dwg|dxf|ifc)|plan\b/.test(type)) return "03";
  if (cat === "photos" || /\.(jpe?g|png|webp|heic)$/.test(type)) return "07";
  if (cat === "factures" || cat === "financier" || cat === "situations") return "09";
  if (cat === "sous-traitants") return "04";
  if (cat === "fournisseurs") return "05";
  if (cat === "réunions" || /compte.?rendu|cr\b/.test(type)) return "06";
  if (cat === "doe") return "11";
  if (cat === "réception" || cat === "réserves") return "10";
  if (cat === "sécurité" || cat === "méthodes") return "13";
  if (cat === "qualité" || cat === "contrôles") return "14";
  if (/devis|avenant/.test(type)) return "01";
  if (/contrat|commande/.test(type)) return "02";
  return "00";
}

export const GED_MAX_BYTES = 100 * 1024 * 1024;
