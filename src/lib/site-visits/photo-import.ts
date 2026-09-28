/** URL affichable d’une photo de visite (référence storage opaque → aperçu authentifié). */
export function siteVisitPhotoSrc(
  visitId: string,
  media: { id: string; fileUrl: string | null },
): string | null {
  const url = media.fileUrl?.trim() ?? "";
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }
  return `/api/site-visits/${visitId}/media?mediaId=${encodeURIComponent(media.id)}`;
}

/** Copie immédiate : un FileList vivant est vidé dès que l’input est réinitialisé. */
export function snapshotPhotoFiles(files: FileList | File[] | null | undefined): File[] {
  if (!files || files.length === 0) return [];
  return Array.from(files);
}

export function unsupportedPhotoReason(file: { name: string; type: string }): string | null {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (
    type === "image/heic" ||
    type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  ) {
    return `${file.name} : format HEIC/HEIF non pris en charge. Enregistrez la photo en JPG ou PNG.`;
  }
  if (type && !type.startsWith("image/")) {
    return `${file.name} : ce fichier n’est pas une image.`;
  }
  return null;
}

export function photoImportSummary(added: number, failureCount: number): string {
  const addedLabel =
    added > 0 ? `${added} photo${added > 1 ? "s" : ""} ajoutée${added > 1 ? "s" : ""}` : "";
  if (added > 0 && failureCount === 0) return addedLabel;
  if (added > 0) {
    return `${addedLabel}, ${failureCount} échec${failureCount > 1 ? "s" : ""}`;
  }
  return failureCount > 0 ? "Import impossible" : "Aucune photo ajoutée";
}
