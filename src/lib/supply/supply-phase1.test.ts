/**
 * Approvisionnements Phase 1 — tests purs (pas d’I/O DB).
 * npx tsx src/lib/supply/supply-phase1.test.ts
 */
import assert from "node:assert/strict";
import {
  applyLossFactor,
  buildRenderedCost,
  proposeOrderQuantity,
  quantityDriftGap,
  resolveValidatedOrderQuantity,
  roundToPackaging,
  toSupplyQuantities,
} from "@/lib/supply/quantities";
import {
  buildDriftDecisionPayload,
  computeSourceFingerprint,
  evaluateMetreDrift,
} from "@/lib/supply/drift";
import { computeOrderDeadline } from "@/lib/supply/deadline";
import { mapMaterialRequirementToSupplyNeed } from "@/lib/supply/map-material-requirement";

// --- Quantités séparées ---
{
  const q = toSupplyQuantities({
    quantityRequired: 1000,
    unit: "bloc",
    sourceQuantity: 95.123,
    sourceUnit: "m²",
    calculatedQuantity: 952,
    validatedOrderQuantity: 1050,
    lossFactor: 0.05,
    packaging: "palette 70",
    packagingSize: 70,
    packagingUnit: "palette",
  });
  assert.equal(q.sourceQuantity, 95.123);
  assert.equal(q.sourceUnit, "m²");
  assert.equal(q.calculatedQuantity, 952);
  assert.equal(q.validatedOrderQuantity, 1050);
  assert.equal(q.orderUnit, "bloc");
  assert.equal(resolveValidatedOrderQuantity({ quantityRequired: 1000 }), 1000);
  assert.equal(
    resolveValidatedOrderQuantity({
      quantityRequired: 1000,
      validatedOrderQuantity: 1050,
    }),
    1050,
  );
  console.log("ok — quantités source / calculée / validée séparées");
}

// --- Pas de perte inventée ---
{
  assert.equal(applyLossFactor(100, null), 100);
  assert.equal(applyLossFactor(100, undefined), 100);
  assert.equal(applyLossFactor(100, 0.05), 105);
  const noPack = roundToPackaging(103, null);
  assert.equal(noPack.roundedQty, 103);
  assert.equal(noPack.packages, null);
  const pack = roundToPackaging(103, 70);
  assert.equal(pack.packages, 2);
  assert.equal(pack.roundedQty, 140);
  console.log("ok — perte / conditionnement sans invention");
}

// --- Proposition commande (ne touche pas source) ---
{
  const p = proposeOrderQuantity({
    sourceQuantity: 95.123,
    calculatedQuantity: 952,
    lossFactor: 0.05,
    packagingSize: 70,
  });
  assert.equal(p.basis, "calculated");
  assert.ok(p.proposed != null && p.proposed >= 952);
  assert.equal(p.packages, Math.ceil((952 * 1.05) / 70));
  console.log("ok — proposeOrderQuantity depuis calculated");
}

// --- Coût rendu : partiel si frais manquants ---
{
  const partial = buildRenderedCost({
    productCostHt: 1200,
    deliveryFeeHt: 80,
    includeCrane: true,
    craneFeeHt: null,
  });
  assert.equal(partial.completeness, "PARTIAL");
  assert.equal(partial.totalHt, null);
  const complete = buildRenderedCost({
    productCostHt: 1200,
    deliveryFeeHt: 80,
    includeDelivery: true,
  });
  assert.equal(complete.completeness, "COMPLETE");
  assert.equal(complete.totalHt, 1280);
  const empty = buildRenderedCost({ productCostHt: null });
  assert.equal(empty.completeness, "EMPTY");
  console.log("ok — coût rendu COMPLETE / PARTIAL / EMPTY");
}

// --- Deadline uniquement si délai réel ---
{
  const needed = new Date("2026-10-15T00:00:00.000Z");
  assert.equal(computeOrderDeadline({ neededAt: needed, supplierLeadTimeDays: null }), null);
  assert.equal(computeOrderDeadline({ neededAt: null, supplierLeadTimeDays: 2 }), null);
  const d = computeOrderDeadline({ neededAt: needed, supplierLeadTimeDays: 2 });
  assert.ok(d);
  assert.equal(d!.toISOString().slice(0, 10), "2026-10-13");
  console.log("ok — orderDeadline sans délai inventé");
}

// --- Drift ---
{
  const fp1 = computeSourceFingerprint({
    takeoffCodes: ["GO-05-03"],
    sourceQuantities: [{ code: "GO-05-03", qty: 95.123, unit: "m2" }],
    studyVersion: 8,
  });
  const fp2 = computeSourceFingerprint({
    takeoffCodes: ["GO-05-03"],
    sourceQuantities: [{ code: "GO-05-03", qty: 110, unit: "m2" }],
    studyVersion: 9,
  });
  assert.notEqual(fp1, fp2);
  const soft = evaluateMetreDrift({
    previousFingerprint: fp1,
    nextFingerprint: fp2,
    hasActiveOrderLinks: false,
  });
  assert.equal(soft.drift, "METRE_CHANGED");
  const hard = evaluateMetreDrift({
    previousFingerprint: fp1,
    nextFingerprint: fp2,
    hasActiveOrderLinks: true,
  });
  assert.equal(hard.drift, "METRE_CHANGED_AFTER_ORDER");
  assert.equal(hard.requiresHumanDecision, true);
  const gap = quantityDriftGap({ newRequiredQty: 110, orderedQty: 95.123 });
  assert.ok(gap.needsComplement);
  const decision = buildDriftDecisionPayload({
    drift: "METRE_CHANGED_AFTER_ORDER",
    orderedQty: 95.123,
    newRequiredQty: 110,
  });
  assert.ok(decision.allowedActions.includes("CREATE_COMPLEMENT"));
  console.log("ok — drift métré / après commande");
}

// --- Mapping MaterialRequirement → SupplyNeed (legacy row) ---
{
  const now = new Date("2026-10-08T08:00:00.000Z");
  const need = mapMaterialRequirementToSupplyNeed({
    id: "req1",
    organizationId: "org1",
    projectId: "proj1",
    label: "Blocs béton 20",
    description: null,
    category: "MATERIAL",
    procurementMode: "ACHAT",
    status: "VALIDATED",
    quantityRequired: 1920,
    unit: "u",
    lossFactor: null,
    sourceQuantity: null,
    sourceUnit: null,
    calculatedQuantity: null,
    validatedOrderQuantity: 1920,
    packaging: null,
    packagingSize: null,
    packagingUnit: null,
    neededAt: null,
    orderDeadlineAt: null,
    supplierLeadTimeDays: null,
    takeoffCodes: ["GO-05-03"],
    scheduleTaskIds: [],
    prepStudyId: null,
    schedulePlanId: null,
    sourceFingerprint: null,
    sourceDrift: "NONE",
    sourceType: "MANUAL",
    sourceId: null,
    sourceLabel: "Saisie manuelle",
    siteResourceId: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
  } as Parameters<typeof mapMaterialRequirementToSupplyNeed>[0]);
  assert.equal(need.quantities.validatedOrderQuantity, 1920);
  assert.equal(need.category, "MATERIAL");
  assert.deepEqual(need.takeoffCodes, ["GO-05-03"]);
  console.log("ok — mapping SupplyNeed depuis MaterialRequirement");
}

console.log("\nTous les tests supply-phase1 OK");
