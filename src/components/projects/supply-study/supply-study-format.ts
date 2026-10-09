/**
 * Formatage Affichage Étude d’approvisionnement — pur, sans I/O.
 */
import type { SupplyOfferView } from "@/lib/supply/offer-types";
import { SUPPLY_NEED_STATUS_LABELS } from "@/lib/supply/categories";

export function formatStudyDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatStudyMoney(
  v: number | null | undefined,
  maxFrac = 4,
): string {
  if (v == null || !Number.isFinite(v)) return "Prix non disponible";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: maxFrac,
  }).format(v);
}

export function needStatusLabel(status: string): string {
  return SUPPLY_NEED_STATUS_LABELS[status] ?? status;
}

/**
 * Libellé source compréhensible — dérivé des champs réels, pas seulement du type.
 */
export function qualifyOfferSourceLabel(o: SupplyOfferView): string {
  const hasPrice = o.unitPrice != null && Number.isFinite(o.unitPrice);
  const hasUrl = Boolean(o.sourceUrl?.trim());
  const hasQuoteProof =
    Boolean(o.quoteNumber?.trim()) || Boolean(o.quoteDocumentRef?.trim());

  if (o.priceSourceType === "WEB_VERIFIED") {
    if (hasPrice && hasUrl && o.observedAt) return "Prix web relevé";
    if (hasUrl && !hasPrice) return "Produit sourcé, prix non renseigné";
    if (hasPrice && (!hasUrl || !o.observedAt))
      return "Prix web — preuve incomplète";
    return "Produit sourcé, prix non renseigné";
  }
  if (o.priceSourceType === "SUPPLIER_QUOTE") {
    if (hasPrice && hasQuoteProof) return "Offre sur devis";
    if (!hasPrice) return "Produit sourcé, prix non renseigné";
    return "Offre sur devis — preuve incomplète";
  }
  if (o.priceSourceType === "IMPORT") return "Import";
  return "Saisie manuelle";
}

/** Prix exploitable + source justifiée (aligné offer-validation). */
export function isJustifiedPricedOffer(o: SupplyOfferView): boolean {
  if (o.archivedAt) return false;
  if (o.unitPrice == null || !Number.isFinite(o.unitPrice)) return false;
  switch (o.priceSourceType) {
    case "WEB_VERIFIED": {
      const url = (o.sourceUrl ?? "").trim();
      if (!/^https?:\/\//i.test(url)) return false;
      if (!o.observedAt) return false;
      return true;
    }
    case "SUPPLIER_QUOTE": {
      const proof =
        (o.quoteNumber ?? "").trim() || (o.quoteDocumentRef ?? "").trim();
      return Boolean(proof);
    }
    case "USER_ENTERED":
    case "IMPORT":
      return Boolean((o.priceUnit ?? "").trim());
    default:
      return false;
  }
}

export function normalizeOfferUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    return u.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return null;
  }
}

export function validateProductUrl(
  raw: string,
): { ok: true; url: string } | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: false, error: "Collez une URL http(s)." };
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { ok: false, error: "Seules les URL http et https sont acceptées." };
    }
    return { ok: true, url: u.toString() };
  } catch {
    return { ok: false, error: "URL invalide." };
  }
}

export function percentVsBest(
  offer: SupplyOfferView,
  bestId: string | null,
  offers: SupplyOfferView[],
): string | null {
  if (!bestId || offer.id === bestId) return null;
  if (offer.unitPrice == null) return null;
  const best = offers.find((o) => o.id === bestId);
  if (!best || best.unitPrice == null || best.unitPrice <= 0) return null;
  const pct = ((offer.unitPrice - best.unitPrice) / best.unitPrice) * 100;
  if (!Number.isFinite(pct)) return null;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)} % vs meilleure`;
}
