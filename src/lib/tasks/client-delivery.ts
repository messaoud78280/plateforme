export type ClientDeliveryPayload = {
  visibleDocumentIds: string[];
  visibleChantierFileIds: string[];
  showCorrectionNote: boolean;
};

export function parseClientDeliveryJson(raw: unknown): ClientDeliveryPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    visibleDocumentIds: Array.isArray(o.visibleDocumentIds)
      ? o.visibleDocumentIds.filter((id): id is string => typeof id === "string")
      : [],
    visibleChantierFileIds: Array.isArray(o.visibleChantierFileIds)
      ? o.visibleChantierFileIds.filter((id): id is string => typeof id === "string")
      : [],
    showCorrectionNote: Boolean(o.showCorrectionNote),
  };
}

export function filterDocumentsForClient<T extends { id: string }>(
  documents: T[],
  sentAt: Date | string | null | undefined,
  delivery: ClientDeliveryPayload | null
): T[] {
  if (!sentAt) return [];
  if (!delivery) return documents;
  const ids = new Set(delivery.visibleDocumentIds);
  return documents.filter((d) => ids.has(d.id));
}
