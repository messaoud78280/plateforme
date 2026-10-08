/**
 * Compatibilité MaterialRequirement pré–Phase 1 → SupplyNeed.
 * Fixture avec uniquement les champs legacy (nouveaux = défauts / null).
 * npx tsx src/lib/supply/legacy-material-requirement.test.ts
 */
import assert from "node:assert/strict";
import { mapMaterialRequirementToSupplyNeed } from "@/lib/supply/map-material-requirement";
import { resolveValidatedOrderQuantity, toSupplyQuantities } from "@/lib/supply/quantities";
import { summarizeSupplyNeeds } from "@/lib/supply/summary";
import { calculateMaterialRequirementProgress } from "@/lib/materiaux/progress";

/** Ancien enregistrement MATERIAUX-V1B (avant extension Approvisionnements). */
const legacyRow = {
  id: "legacy-mr-1",
  organizationId: "org-1",
  projectId: "proj-1",
  label: "EPDM",
  description: null,
  /** Défauts DB Phase 1 — colonne NOT NULL DEFAULT */
  category: "MATERIAL" as const,
  procurementMode: "ACHAT" as const,
  status: "VALIDATED" as const,
  quantityRequired: 120,
  unit: "m²",
  lossFactor: null,
  sourceQuantity: null,
  sourceUnit: null,
  calculatedQuantity: null,
  /** Avant backfill : null → fallback quantityRequired */
  validatedOrderQuantity: null,
  packaging: null,
  packagingSize: null,
  packagingUnit: null,
  neededAt: null,
  orderDeadlineAt: null,
  supplierLeadTimeDays: null,
  takeoffCodes: null,
  scheduleTaskIds: null,
  prepStudyId: null,
  schedulePlanId: null,
  sourceFingerprint: null,
  sourceDrift: "NONE" as const,
  sourceType: "MANUAL" as const,
  sourceId: null,
  sourceLabel: "Saisie manuelle",
  siteResourceId: null,
  notes: null,
  createdAt: new Date("2026-09-01T10:00:00.000Z"),
  updatedAt: new Date("2026-09-01T10:00:00.000Z"),
};

{
  const qty = resolveValidatedOrderQuantity({
    quantityRequired: legacyRow.quantityRequired,
    validatedOrderQuantity: legacyRow.validatedOrderQuantity,
  });
  assert.equal(qty, 120);
  const q = toSupplyQuantities({
    quantityRequired: legacyRow.quantityRequired,
    unit: legacyRow.unit,
    validatedOrderQuantity: legacyRow.validatedOrderQuantity,
    sourceQuantity: legacyRow.sourceQuantity,
    calculatedQuantity: legacyRow.calculatedQuantity,
    lossFactor: legacyRow.lossFactor,
  });
  assert.equal(q.validatedOrderQuantity, 120);
  assert.equal(q.sourceQuantity, null);
  assert.equal(q.calculatedQuantity, null);
  console.log("ok — legacy quantityRequired → validatedOrderQuantity");
}

{
  const need = mapMaterialRequirementToSupplyNeed(
    legacyRow as Parameters<typeof mapMaterialRequirementToSupplyNeed>[0],
  );
  assert.equal(need.label, "EPDM");
  assert.equal(need.category, "MATERIAL");
  assert.equal(need.procurementMode, "ACHAT");
  assert.equal(need.status, "VALIDATED");
  assert.equal(need.quantities.validatedOrderQuantity, 120);
  assert.equal(need.quantities.orderUnit, "m²");
  assert.deepEqual(need.takeoffCodes, []);
  assert.equal(need.sourceDrift, "NONE");
  console.log("ok — mapping SupplyNeed sans crash (legacy)");
}

{
  const progress = calculateMaterialRequirementProgress({
    status: "VALIDATED",
    quantityRequired: 120,
    unit: "m²",
    allocations: [],
  });
  assert.equal(progress.coverageState, "A_COMMANDER");
  assert.equal(progress.need, 120);
  const summary = summarizeSupplyNeeds([
    {
      status: "VALIDATED",
      category: "MATERIAL",
      sourceDrift: "NONE",
      coverageState: progress.coverageState,
      remainingToOrder: progress.remainingToOrder,
      offerCount: 0,
      hasPricedOffer: false,
      hasSelectedOffer: false,
    },
  ]);
  assert.equal(summary.total, 1);
  assert.equal(summary.toOrder, 1);
  assert.equal(summary.withoutSupplier, 1);
  assert.equal(summary.withoutPrice, 1);
  assert.equal(summary.withSelectedOffer, 0);
  console.log("ok — progress + résumé cockpit sur fixture legacy");
}

console.log("\nTous les tests legacy-material-requirement OK");
