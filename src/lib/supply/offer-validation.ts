/**
 * Validation SupplyOffer — aucun prix inventé, traçabilité obligatoire si prix.
 */
import type { SupplyOfferInput } from "@/lib/supply/offer-types";

function isValidHttpUrl(raw: string | null | undefined): boolean {
  if (!raw?.trim()) return false;
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function hasDate(v: Date | string | null | undefined): boolean {
  if (v == null || v === "") return false;
  const d = v instanceof Date ? v : new Date(v);
  return !Number.isNaN(d.getTime());
}

function n(v: unknown): number | null {
  if (v == null || v === "") return null;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : null;
}

/**
 * Valide une offre. unitPrice null = toujours autorisé (prix à renseigner).
 * Si unitPrice ≠ null → règles de provenance selon priceSourceType.
 */
export function validateSupplyOfferInput(
  input: SupplyOfferInput,
): { ok: true } | { ok: false; error: string } {
  if (!input.supplierExternalOrgId?.trim()) {
    return { ok: false, error: "Fournisseur requis" };
  }
  if (!input.productLabel?.trim()) {
    return { ok: false, error: "Désignation produit requise" };
  }
  if (!input.priceSourceType) {
    return { ok: false, error: "Provenance du prix requise" };
  }

  const unitPrice = n(input.unitPrice);
  if (unitPrice == null) {
    // Offre sans prix : valide
    return { ok: true };
  }
  if (unitPrice < 0) {
    return { ok: false, error: "Le prix ne peut pas être négatif" };
  }

  const priceUnit = (input.priceUnit ?? "").trim();
  if (!priceUnit) {
    return { ok: false, error: "Unité tarifaire requise lorsque le prix est renseigné" };
  }
  if (!input.priceTaxMode || (input.priceTaxMode !== "HT" && input.priceTaxMode !== "TTC")) {
    return { ok: false, error: "Mode HT/TTC requis lorsque le prix est renseigné" };
  }

  switch (input.priceSourceType) {
    case "WEB_VERIFIED": {
      if (!isValidHttpUrl(input.sourceUrl)) {
        return {
          ok: false,
          error: "WEB_VERIFIED avec prix exige une URL source valide",
        };
      }
      if (!hasDate(input.observedAt)) {
        return {
          ok: false,
          error: "WEB_VERIFIED avec prix exige une date d’observation",
        };
      }
      break;
    }
    case "SUPPLIER_QUOTE": {
      const proof =
        (input.quoteNumber?.trim() || "") ||
        (input.quoteDocumentRef?.trim() || "");
      if (!proof) {
        return {
          ok: false,
          error:
            "SUPPLIER_QUOTE avec prix exige un n° de devis ou une référence document",
        };
      }
      if (!hasDate(input.observedAt) && !hasDate(input.recordedAt)) {
        return {
          ok: false,
          error: "SUPPLIER_QUOTE avec prix exige une date",
        };
      }
      break;
    }
    case "USER_ENTERED": {
      if (!hasDate(input.recordedAt) && !hasDate(input.observedAt)) {
        // recordedAt sera mis à now() côté service si absent — autoriser
        break;
      }
      break;
    }
    case "IMPORT": {
      // Même exigences minimales qu’une saisie : unité + HT/TTC déjà vérifiés
      break;
    }
    default:
      return { ok: false, error: "Provenance de prix inconnue" };
  }

  // Frais : null autorisé, 0 autorisé, négatif interdit
  for (const [label, fee] of [
    ["Livraison", input.deliveryFee],
    ["Grutage", input.craneFee],
    ["Autres frais", input.otherFees],
  ] as const) {
    const f = n(fee);
    if (fee !== undefined && fee !== null && f == null) {
      return { ok: false, error: `${label} invalide` };
    }
    if (f != null && f < 0) {
      return { ok: false, error: `${label} ne peut pas être négatif` };
    }
  }

  return { ok: true };
}

/** Normalise une unité pour comparaison (pas de conversion inventée). */
export function normalizePriceUnit(unit: string | null | undefined): string {
  const u = (unit ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!u) return "";
  if (u === "UNIT" || u === "UN" || u === "PCE" || u === "PIECE" || u === "PIÈCE") {
    return "U";
  }
  if (u === "M²" || u === "M2") return "M2";
  if (u === "M³" || u === "M3") return "M3";
  if (u === "ML" || u === "M.L" || u === "MLIN") return "ML";
  if (u === "PALETTE" || u === "PAL") return "PALLET";
  if (u === "COLIS" || u === "PACK") return "PACK";
  if (u === "T" || u === "TNE") return "TONNE";
  return u;
}

export function unitsAreCompatible(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const na = normalizePriceUnit(a);
  const nb = normalizePriceUnit(b);
  if (!na || !nb) return false;
  return na === nb;
}
