/** Lien de téléchargement sécurisé (URL signée côté serveur). */
export function documentDownloadHref(documentId: string): string {
  return `/api/documents/${documentId}/download`;
}
