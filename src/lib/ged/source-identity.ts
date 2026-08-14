/**
 * GED V2.0.1 — identité source (1 fichier physique → 1 entrée ChantierFile).
 * Les types primaires portent la déduplication. Les types secondaires
 * (commande, fournisseur, devis…) sont des relations, pas des identités.
 */

export const GED_PRIMARY_ENTITY_TYPES = [
  "message_attachment",
  "purchase_order_document",
  "commercial_quote_snapshot",
  "commercial_quote",
  "commercial_invoice",
  "commercial_progress",
  "doe_item",
  "pilotage_photo",
  "pilotage_market_document",
  "legacy_document",
  "pilotage_subcontractor_doc",
] as const;

export type GedPrimaryEntityType = (typeof GED_PRIMARY_ENTITY_TYPES)[number];

/**
 * Unique SQL : uniquement les identités jamais utilisées comme lien secondaire.
 * `commercial_quote` sert aussi de relation sur facture / situation / snapshot.
 */
export const GED_UNIQUE_SOURCE_TYPES = GED_PRIMARY_ENTITY_TYPES.filter(
  (t) => t !== "commercial_quote",
);

export type GedSourceIdentity = {
  entityType: string;
  entityId: string;
  entityLabel?: string | null;
};

export function isGedPrimaryEntityType(type: string): type is GedPrimaryEntityType {
  return (GED_PRIMARY_ENTITY_TYPES as readonly string[]).includes(type);
}

/** Clé déterministe pièce jointe messagerie / mission (inchangée vs GED V2). */
export function messageAttachmentEntityId(
  messageKind: string,
  messageId: string,
  fileUrl: string,
): string {
  return `${messageKind}:${messageId}:${fileUrl.slice(-48)}`;
}

export function parseMessageAttachmentEntityId(
  entityId: string,
): { kind: string; messageId: string } | null {
  const parts = entityId.split(":");
  if (parts.length < 3) return null;
  const kind = parts[0];
  const messageId = parts[1];
  if (!kind || !messageId) return null;
  return { kind, messageId };
}

export type PoGedMeta = {
  folderCode: string;
  documentType: string;
  category: string;
  subcategory: string | null;
  classificationStatus: "CLASSE" | "A_CLASSER";
};

/** Classification déterministe d’un document commande — pas d’IA. */
export function poKindToGedMeta(kind: string): PoGedMeta {
  const k = (kind || "AUTRE").toUpperCase();
  if (k === "BL") {
    return {
      folderCode: "05",
      documentType: "BON_LIVRAISON",
      category: "Fournisseurs",
      subcategory: "Bon de livraison",
      classificationStatus: "CLASSE",
    };
  }
  if (k === "BC") {
    return {
      folderCode: "02",
      documentType: "BON_COMMANDE",
      category: "Fournisseurs",
      subcategory: "Bon de commande",
      classificationStatus: "CLASSE",
    };
  }
  if (k === "FACTURE") {
    return {
      folderCode: "09",
      documentType: "FACTURE",
      category: "Factures",
      subcategory: "Facture fournisseur",
      classificationStatus: "CLASSE",
    };
  }
  if (k === "FICHE_TECHNIQUE") {
    return {
      folderCode: "05",
      documentType: "FICHE_TECHNIQUE",
      category: "Fournisseurs",
      subcategory: "Fiche technique",
      classificationStatus: "CLASSE",
    };
  }
  if (k === "DEVIS") {
    return {
      folderCode: "01",
      documentType: "DEVIS_FOURNISSEUR",
      category: "Fournisseurs",
      subcategory: "Devis fournisseur",
      classificationStatus: "CLASSE",
    };
  }
  if (k === "CONFIRMATION") {
    return {
      folderCode: "05",
      documentType: "CONFIRMATION",
      category: "Fournisseurs",
      subcategory: "Confirmation",
      classificationStatus: "CLASSE",
    };
  }
  return {
    folderCode: "00",
    documentType: k || "DOCUMENT",
    category: "À classer",
    subcategory: null,
    classificationStatus: "A_CLASSER",
  };
}

/**
 * Un index GED ne doit jamais supprimer l’objet Storage d’un autre module.
 * Seuls les dépôts natifs classeur (`chantiers/{projectId}/…`) sont « propriétaires ».
 */
export function gedIndexOwnsStorage(opts: {
  fileUrl?: string | null;
  projectId?: string | null;
  hasPrimarySourceLink?: boolean;
  sourceDocumentId?: string | null;
}): boolean {
  if (opts.hasPrimarySourceLink) return false;
  if (opts.sourceDocumentId) return false;
  const url = opts.fileUrl ?? "";
  if (!url || url.startsWith("/api/") || url.startsWith("ged://")) return false;
  if (!opts.projectId) return false;
  return url.includes(`chantiers/${opts.projectId}/`);
}
