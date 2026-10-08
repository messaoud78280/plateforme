/**
 * Comparaison d’offres — jamais « meilleure offre » si données incomplètes.
 */
import { unitsAreCompatible } from "@/lib/supply/offer-validation";
import type { SupplyOfferView } from "@/lib/supply/offer-types";

export type SupplyOfferComparison = {
  comparableUnitPrice: boolean;
  lowestUnitPriceOfferId: string | null;
  comparableRenderedComplete: boolean;
  lowestRenderedCostOfferId: string | null;
  notes: string[];
};

export function compareSupplyOffers(
  offers: SupplyOfferView[],
): SupplyOfferComparison {
  const active = offers.filter((o) => !o.archivedAt);
  const notes: string[] = [];

  // Prix unitaire homogène : même unité tarifaire + prix connu + même HT/TTC
  const withPrice = active.filter((o) => o.unitPrice != null);
  let comparableUnitPrice = false;
  let lowestUnitPriceOfferId: string | null = null;

  if (withPrice.length >= 2) {
    const unit0 = withPrice[0]!.priceUnit;
    const tax0 = withPrice[0]!.priceTaxMode;
    const homogeneous = withPrice.every(
      (o) =>
        unitsAreCompatible(o.priceUnit, unit0) && o.priceTaxMode === tax0,
    );
    if (homogeneous) {
      comparableUnitPrice = true;
      let best = withPrice[0]!;
      for (const o of withPrice) {
        if ((o.unitPrice ?? Infinity) < (best.unitPrice ?? Infinity)) best = o;
      }
      lowestUnitPriceOfferId = best.id;
    } else {
      notes.push(
        "Prix unitaires non comparables directement (unités ou HT/TTC différents).",
      );
    }
  } else if (withPrice.length === 1) {
    notes.push("Une seule offre avec prix — pas de comparaison unitaire.");
  } else {
    notes.push("Aucun prix renseigné pour comparer.");
  }

  // Coût rendu le plus bas : uniquement si COMPLETE et au moins 2
  const complete = active.filter(
    (o) =>
      o.renderedCost.completeness === "COMPLETE" &&
      o.renderedCost.knownTotal != null,
  );
  let comparableRenderedComplete = false;
  let lowestRenderedCostOfferId: string | null = null;

  if (complete.length >= 2) {
    comparableRenderedComplete = true;
    let best = complete[0]!;
    for (const o of complete) {
      if ((o.renderedCost.knownTotal ?? Infinity) < (best.renderedCost.knownTotal ?? Infinity)) {
        best = o;
      }
    }
    lowestRenderedCostOfferId = best.id;
  } else if (complete.length === 1) {
    notes.push(
      "Une seule offre avec coût rendu COMPLETE — pas de classement rendu chantier.",
    );
  } else {
    notes.push(
      "Aucun classement « coût rendu » : données incomplètes (PARTIAL / EMPTY).",
    );
  }

  return {
    comparableUnitPrice,
    lowestUnitPriceOfferId,
    comparableRenderedComplete,
    lowestRenderedCostOfferId,
    notes,
  };
}
