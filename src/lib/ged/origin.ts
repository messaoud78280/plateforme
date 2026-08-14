/** Provenance GED — dérivée des liens existants, sans colonne obligatoire. */

export type GedOrigin =
  | "MESSAGERIE"
  | "COMMANDE"
  | "CHANTIER"
  | "FOURNISSEUR"
  | "DEVIS"
  | "DOE"
  | "FICHE_SUIVI"
  | "UPLOAD"
  | "BEWORK";

export const GED_ORIGIN_LABELS: Record<GedOrigin, string> = {
  MESSAGERIE: "Messagerie",
  COMMANDE: "Commande",
  CHANTIER: "Chantier",
  FOURNISSEUR: "Fournisseur",
  DEVIS: "Devis & Facturation",
  DOE: "DOE",
  FICHE_SUIVI: "Fiche suivi",
  UPLOAD: "Dépôt manuel",
  BEWORK: "BeWork",
};

export type GedLinkLite = {
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
};

export function originFromLinks(opts: {
  links: GedLinkLite[];
  folderCode?: string | null;
  sourceDocumentId?: string | null;
}): { origin: GedOrigin; label: string; refLabel: string | null; actionLabel: string | null } {
  const links = opts.links ?? [];
  const msg = links.find((l) => l.entityType === "message_attachment");
  if (msg) {
    return {
      origin: "MESSAGERIE",
      label: GED_ORIGIN_LABELS.MESSAGERIE,
      refLabel: msg.entityLabel && msg.entityLabel !== "Messagerie" ? msg.entityLabel : null,
      actionLabel: "Voir la conversation",
    };
  }
  const po = links.find(
    (l) =>
      l.entityType === "purchase_order" ||
      l.entityType === "purchase_order_document" ||
      l.entityType === "purchase_order_receipt",
  );
  if (po) {
    const supplier = links.find((l) => l.entityType === "supplier");
    return {
      origin: "COMMANDE",
      label: GED_ORIGIN_LABELS.COMMANDE,
      refLabel: [po.entityLabel, supplier?.entityLabel].filter(Boolean).join(" · ") || null,
      actionLabel: "Voir la commande",
    };
  }
  const inv = links.find((l) => l.entityType === "commercial_invoice");
  if (inv) {
    const isAvoir = (inv.entityLabel ?? "").toLowerCase().includes("avoir");
    return {
      origin: "DEVIS",
      label: GED_ORIGIN_LABELS.DEVIS,
      refLabel: inv.entityLabel ?? null,
      actionLabel: isAvoir ? "Voir l’avoir" : "Voir la facture",
    };
  }
  const st = links.find((l) => l.entityType === "commercial_progress");
  if (st) {
    return {
      origin: "DEVIS",
      label: GED_ORIGIN_LABELS.DEVIS,
      refLabel: st.entityLabel ?? null,
      actionLabel: "Voir la situation",
    };
  }
  const quote =
    links.find((l) => l.entityType === "commercial_quote") ??
    links.find((l) => l.entityType === "commercial_quote_snapshot");
  if (quote) {
    return {
      origin: "DEVIS",
      label: GED_ORIGIN_LABELS.DEVIS,
      refLabel: quote.entityLabel ?? null,
      actionLabel: "Voir le devis",
    };
  }
  const sheet = links.find((l) => l.entityType === "follow_up_sheet");
  if (sheet) {
    return {
      origin: "FICHE_SUIVI",
      label: GED_ORIGIN_LABELS.FICHE_SUIVI,
      refLabel: sheet.entityLabel ?? null,
      actionLabel: "Voir la fiche",
    };
  }
  const doe = links.find((l) => l.entityType === "doe_item");
  if (doe || opts.folderCode === "11") {
    return {
      origin: "DOE",
      label: GED_ORIGIN_LABELS.DOE,
      refLabel: doe?.entityLabel ?? null,
      actionLabel: "Voir le DOE",
    };
  }
  const supplier = links.find((l) => l.entityType === "supplier");
  if (supplier) {
    return {
      origin: "FOURNISSEUR",
      label: GED_ORIGIN_LABELS.FOURNISSEUR,
      refLabel: supplier.entityLabel ?? null,
      actionLabel: "Voir le fournisseur",
    };
  }
  if (opts.sourceDocumentId) {
    return {
      origin: "CHANTIER",
      label: "Ajouté depuis le chantier",
      refLabel: null,
      actionLabel: "Voir le chantier",
    };
  }
  return {
    origin: "CHANTIER",
    label: "Ajouté depuis le chantier",
    refLabel: null,
    actionLabel: "Voir le chantier",
  };
}

export function originHref(opts: {
  origin: GedOrigin;
  links: GedLinkLite[];
  projectId: string | null;
}): string | null {
  const links = opts.links ?? [];
  if (opts.origin === "COMMANDE") {
    const po = links.find((l) => l.entityType === "purchase_order" && l.entityId);
    if (po?.entityId) return `/dashboard/commandes/${po.entityId}?focus=documents`;
  }
  if (opts.origin === "DEVIS") {
    const q = links.find((l) => l.entityType === "commercial_quote" && l.entityId);
    if (q?.entityId && !links.some((l) => l.entityType === "commercial_invoice" || l.entityType === "commercial_progress")) {
      return `/dashboard/devis-facturation/devis/${q.entityId}`;
    }
    const inv = links.find((l) => l.entityType === "commercial_invoice" && l.entityId);
    if (inv?.entityId) return `/dashboard/devis-facturation/factures/${inv.entityId}`;
    const st = links.find((l) => l.entityType === "commercial_progress" && l.entityId);
    if (st?.entityId) return `/dashboard/devis-facturation/situations/${st.entityId}`;
    if (q?.entityId) return `/dashboard/devis-facturation/devis/${q.entityId}`;
  }
  if (opts.origin === "FICHE_SUIVI") {
    const s = links.find((l) => l.entityType === "follow_up_sheet" && l.entityId);
    if (s?.entityId) return `/dashboard/fiches-suivi/${s.entityId}`;
  }
  if (opts.origin === "MESSAGERIE") {
    if (opts.projectId) return `/dashboard/messagerie?view=chantiers&project=${opts.projectId}`;
    return "/dashboard/messagerie?view=contacts";
  }
  if (opts.origin === "DOE") {
    if (opts.projectId) return `/dashboard/projets/${opts.projectId}#tab-documents`;
    return "/dashboard/documents";
  }
  if (opts.origin === "FOURNISSEUR") {
    return "/dashboard/fournisseurs";
  }
  if (opts.projectId) return `/dashboard/projets/${opts.projectId}#tab-documents`;
  return "/dashboard/documents";
}

export function folderDisplayLabel(label: string, _code?: string | null): string {
  return label.replace(/^\d{2}\s+/, "").trim() || label;
}
