/**
 * Points de vigilance dérivés des données réelles — aucune alerte artificielle.
 */
import type { MaterialRequirementRow } from "@/lib/materiaux/load-for-project";
import type { SupplyOfferView } from "@/lib/supply/offer-types";
import { unitsAreCompatible } from "@/lib/supply/offer-validation";

export type StudyWarning = {
  id: string;
  message: string;
  tone: "watch" | "critical" | "info";
};

export function buildNeedWarnings(need: MaterialRequirementRow): StudyWarning[] {
  const out: StudyWarning[] = [];
  if (need.sourceType === "HYPOTHESIS" || need.status === "PROPOSED") {
    out.push({
      id: "need-hypothesis",
      message:
        "Quantité d’achat proposée — pas encore une validation professionnelle.",
      tone: "watch",
    });
  }
  if (need.sourceDrift !== "NONE") {
    out.push({
      id: "metre-drift",
      message:
        need.sourceDrift === "METRE_CHANGED_AFTER_ORDER"
          ? "Métré modifié après commande — la commande n’a pas été ajustée."
          : "Métré source modifié depuis la création du besoin.",
      tone: "critical",
    });
  }
  if (need.neededAt) {
    const d = new Date(need.neededAt).getTime();
    const days = (d - Date.now()) / (1000 * 60 * 60 * 24);
    if (Number.isFinite(days) && days >= 0 && days <= 14) {
      out.push({
        id: "needed-soon",
        message: "Date de besoin proche (≤ 14 jours).",
        tone: "watch",
      });
    }
  }
  if (need.hasOrderLinks) {
    out.push({
      id: "has-po",
      message: "Besoin déjà lié à une commande — prudence sur les quantités.",
      tone: "info",
    });
  }
  return out;
}

export function buildOfferWarnings(
  offer: SupplyOfferView,
  need: MaterialRequirementRow,
): StudyWarning[] {
  const out: StudyWarning[] = [];
  if (offer.equivalenceStatus === "TO_VERIFY") {
    out.push({
      id: "equiv",
      message: "Équivalence technique à vérifier.",
      tone: "watch",
    });
  }
  if (offer.unitPrice != null && !offer.priceTaxMode) {
    out.push({
      id: "tax",
      message: "Mode HT/TTC manquant.",
      tone: "critical",
    });
  }
  if (offer.priceTaxMode === "TTC" && offer.vatRate == null && offer.unitPrice != null) {
    out.push({
      id: "ttc-vat",
      message: "Prix TTC — TVA inconnue (aucune conversion HT inventée).",
      tone: "watch",
    });
  }
  if (!offer.availabilityNote) {
    out.push({
      id: "avail",
      message: "Disponibilité non renseignée.",
      tone: "info",
    });
  }
  if (offer.deliveryFee == null) {
    out.push({
      id: "delivery",
      message: "Frais de livraison non renseignés (null ≠ 0).",
      tone: "watch",
    });
  }
  if (offer.leadTimeDays == null) {
    out.push({
      id: "lead",
      message: "Délai fournisseur inconnu.",
      tone: "info",
    });
  }
  if (
    offer.unitPrice != null &&
    !unitsAreCompatible(offer.priceUnit, need.unit)
  ) {
    out.push({
      id: "unit-mismatch",
      message: `Unité tarifaire (${offer.priceUnit}) ≠ unité d’achat (${need.unit}) — pas de multiplication directe.`,
      tone: "critical",
    });
  }
  if (offer.freshness === "EXPIRED" || offer.freshness === "TO_REFRESH") {
    out.push({
      id: "fresh",
      message:
        offer.freshness === "EXPIRED"
          ? "Prix potentiellement périmé — à revalider."
          : "Prix à rafraîchir.",
      tone: "watch",
    });
  }
  if (
    offer.priceSourceType === "WEB_VERIFIED" &&
    offer.unitPrice != null &&
    (!offer.sourceUrl || !offer.observedAt)
  ) {
    out.push({
      id: "web-proof",
      message: "WEB_VERIFIED incomplet (URL ou date d’observation manquante).",
      tone: "critical",
    });
  }
  return out;
}
