/**
 * Détection de doublons SupplyOffer — signaux d’identité commerciale uniquement.
 * Jamais de fusion sur la seule désignation ou les dimensions.
 */

export type SupplyOfferDupCandidate = {
  id: string;
  supplierExternalOrgId: string;
  productLabel: string;
  productRef: string | null;
  sourceUrl: string | null;
  unitPrice: number | null;
  archivedAt: string | null;
  matchReasons: string[];
};

export function normalizeProductRef(ref: string | null | undefined): string | null {
  const t = (ref ?? "").trim().toLowerCase().replace(/\s+/g, "");
  return t || null;
}

/** URL canonique pour comparaison (sans hash, sans slash final, minuscule). */
export function canonicalizeOfferUrl(
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    u.hostname = u.hostname.toLowerCase();
    const path = u.pathname.replace(/\/+$/, "") || "";
    u.pathname = path;
    // ignore tracking query noise légère
    const drop = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "fbclid", "gclid"];
    for (const k of drop) u.searchParams.delete(k);
    return u.toString().toLowerCase();
  } catch {
    return null;
  }
}

export function extractEanFromTechAttributes(
  tech: unknown,
): string | null {
  if (!tech || typeof tech !== "object") return null;
  const o = tech as Record<string, unknown>;
  for (const key of ["ean", "gtin", "ean13", "barcode", "EAN", "GTIN"]) {
    const v = o[key];
    if (typeof v === "string" && /^\d{8,14}$/.test(v.trim())) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) {
      const s = String(Math.trunc(v));
      if (/^\d{8,14}$/.test(s)) return s;
    }
  }
  return null;
}

/**
 * Trouve les offres potentiellement identiques sur le même besoin.
 * matchReasons explique pourquoi (pour l’UI).
 */
export function findSupplyOfferDuplicateCandidates(opts: {
  candidates: Array<{
    id: string;
    supplierExternalOrgId: string;
    productLabel: string;
    productRef: string | null;
    sourceUrl: string | null;
    unitPrice: number | null;
    archivedAt: Date | string | null;
    techAttributes?: unknown;
  }>;
  input: {
    supplierExternalOrgId: string;
    productRef?: string | null;
    sourceUrl?: string | null;
    techAttributes?: unknown;
  };
  excludeOfferId?: string | null;
  /** Inclure les archivées (défaut false). */
  includeArchived?: boolean;
}): SupplyOfferDupCandidate[] {
  const ref = normalizeProductRef(opts.input.productRef);
  const url = canonicalizeOfferUrl(opts.input.sourceUrl);
  const ean = extractEanFromTechAttributes(opts.input.techAttributes);
  const out: SupplyOfferDupCandidate[] = [];

  for (const c of opts.candidates) {
    if (opts.excludeOfferId && c.id === opts.excludeOfferId) continue;
    if (!opts.includeArchived && c.archivedAt) continue;

    const reasons: string[] = [];
    const cRef = normalizeProductRef(c.productRef);
    const cUrl = canonicalizeOfferUrl(c.sourceUrl);
    const cEan = extractEanFromTechAttributes(c.techAttributes);

    if (
      ref &&
      cRef &&
      ref === cRef &&
      c.supplierExternalOrgId === opts.input.supplierExternalOrgId
    ) {
      reasons.push("même fournisseur + référence produit");
    }
    if (url && cUrl && url === cUrl) {
      reasons.push("même URL produit");
    }
    if (ean && cEan && ean === cEan) {
      reasons.push("même EAN/GTIN");
    }
    // Identité faible : même fournisseur sans aucun signal distinctif
    if (
      !ref &&
      !url &&
      !ean &&
      !cRef &&
      !cUrl &&
      !cEan &&
      c.supplierExternalOrgId === opts.input.supplierExternalOrgId
    ) {
      reasons.push(
        "même fournisseur sans référence ni URL (risque de doublon)",
      );
    }

    if (reasons.length === 0) continue;
    out.push({
      id: c.id,
      supplierExternalOrgId: c.supplierExternalOrgId,
      productLabel: c.productLabel,
      productRef: c.productRef,
      sourceUrl: c.sourceUrl,
      unitPrice:
        c.unitPrice == null || !Number.isFinite(Number(c.unitPrice))
          ? null
          : Number(c.unitPrice),
      archivedAt:
        c.archivedAt == null
          ? null
          : typeof c.archivedAt === "string"
            ? c.archivedAt
            : c.archivedAt.toISOString(),
      matchReasons: reasons,
    });
  }

  return out;
}
