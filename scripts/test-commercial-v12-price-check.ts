/**
 * COMMERCIAL V1.2 — Vérification des prix (snapshot vs bibliothèque).
 * Run: npx tsx scripts/test-commercial-v12-price-check.ts
 *
 * Ne modifie pas les formules V1.1 — réutilise calculateWorkItemCosting / marque helpers.
 */
import {
  calculateWorkItemCosting,
  marquePercentFromCostSell,
  roundMoney,
} from "../src/lib/commercial/money";
import {
  evaluateQuotePriceChanges,
  type PriceMaps,
} from "../src/lib/commercial/price-check";
import { shouldOfferPriceCheck } from "../src/lib/commercial/price-check-ui";
import type { CompositionSnapshot } from "../src/lib/commercial/library";

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK:", msg);
  }
}

function emptyMaps(): PriceMaps {
  return {
    materials: new Map(),
    labor: new Map(),
    equipmentDb: new Map(),
  };
}

function baseSnapshot(overrides?: Partial<CompositionSnapshot>): CompositionSnapshot {
  const components = overrides?.components ?? [
    {
      name: "Membrane EPDM",
      type: "MATERIAL",
      quantityPerUnit: 100,
      unit: "m²",
      unitCostHt: 8.4,
      lossPercent: 10,
      lineCostHt: 924,
      materialId: "mat-epdm",
      laborId: null,
      equipmentId: null,
    },
    {
      name: "Main d’œuvre étanchéité",
      type: "LABOR",
      quantityPerUnit: 10,
      unit: "h",
      unitCostHt: 32,
      lossPercent: 0,
      lineCostHt: 320,
      materialId: null,
      laborId: "lab-etanch",
      equipmentId: null,
    },
  ];
  const costing = calculateWorkItemCosting({
    components: components.map((c) => ({
      type: c.type,
      quantityPerUnit: c.quantityPerUnit,
      unitCostHt: c.unitCostHt,
      lossPercent: c.lossPercent,
    })),
    feesPercent: 0,
    feesAmountHt: 0,
    sellMode: "MARGIN",
    marginPercent: 20,
  });
  return {
    workItemId: "wi-etanch",
    workItemName: "Étanchéité terrasse",
    saleUnit: "m²",
    kind: "COMPOSITE",
    feesPercent: 0,
    feesAmountHt: 0,
    sellMode: "MARGIN",
    marginPercent: costing.marquePercent,
    unitCostHt: costing.costPriceHt,
    unitSellHt: costing.unitSellHt,
    snappedAt: "2026-01-15T10:00:00.000Z",
    components,
    breakdown: {
      materialsHt: costing.materialsHt,
      laborHt: costing.laborHt,
      equipmentHt: costing.equipmentHt,
      subcontractHt: costing.subcontractHt,
      otherHt: costing.otherHt,
      dryCostHt: costing.dryCostHt,
      feesHt: costing.feesHt,
      costPriceHt: costing.costPriceHt,
      marquePercent: costing.marquePercent,
      markupPercent: costing.markupPercent,
      sellCoefficient: costing.sellCoefficient,
    },
    ...overrides,
    components: overrides?.components ?? components,
  };
}

{
  // --- Scénario de référence (brief §61) ---
  // Membrane 8,40 × 110 m² (100 + 10 % perte) + MO 32 × 10 h = 1 244 €
  const snap = baseSnapshot();
  assert(snap.unitCostHt === 1244, `coût snapshot = 1244 (got ${snap.unitCostHt})`);
  assert(snap.unitSellHt === 1555, `PV marque 20 % = 1555 (got ${snap.unitSellHt})`);

  const maps: PriceMaps = {
    materials: new Map([
      [
        "mat-epdm",
        {
          id: "mat-epdm",
          name: "Membrane EPDM",
          unitCostHt: 9.15,
          unit: "m²",
          isActive: true,
          updatedAt: new Date(),
        },
      ],
    ]),
    labor: new Map([
      [
        "lab-etanch",
        {
          id: "lab-etanch",
          name: "Main d’œuvre étanchéité",
          unitCostHt: 34,
          unit: "h",
          isActive: true,
          updatedAt: new Date(),
        },
      ],
    ]),
    equipmentDb: new Map(),
  };

  // Manuel : 110×9,15 + 10×34 = 1 006,5 + 340 = 1 346,5
  const expectedCurrent = 1346.5;
  const expectedDelta = roundMoney(expectedCurrent - 1244, 2); // 102.5
  const expectedMarque = marquePercentFromCostSell(expectedCurrent, 1555);

  const result = evaluateQuotePriceChanges({
    quoteId: "q1",
    versionId: "v1",
    quoteStatus: "DRAFT",
    lockState: "DRAFT",
    minMarginPercent: 18,
    maps,
    lines: [
      {
        id: "line-1",
        designation: "Étanchéité terrasse",
        quantity: 1,
        unit: "ens",
        unitCostHt: snap.unitCostHt,
        unitSellHt: snap.unitSellHt,
        discountPercent: 0,
        vatRate: 20,
        kind: "WORK",
        isOptional: false,
        commercialWorkItemId: "wi-etanch",
        compositionSnapshotJson: snap,
      },
    ],
  });

  assert(result.status === "CHANGES_FOUND", "référence → CHANGES_FOUND");
  assert(result.changedResourceCount === 2, "2 ressources changées");
  assert(result.costDeltaHt === expectedDelta, `delta coût ${expectedDelta} (got ${result.costDeltaHt})`);
  assert(
    result.currentEstimatedCostHt === expectedCurrent,
    `coût actuel ${expectedCurrent} (got ${result.currentEstimatedCostHt})`,
  );
  assert(
    result.currentIndicativeMarquePercent === expectedMarque,
    `marque indicative ${expectedMarque} (got ${result.currentIndicativeMarquePercent})`,
  );
  assert(result.belowMinMarginAlert === true, "alerte sous objectif 18 %");
  assert(result.canApply === true, "DRAFT peut appliquer");

  const membrane = result.changedResources.find((r) => r.resourceId === "mat-epdm");
  assert(Boolean(membrane), "membrane dans changements");
  assert(membrane!.deltaUnitHt === 0.75, "membrane +0,75 €/m²");
  assert(membrane!.deltaPercent === 8.93, `membrane +8,93 % (got ${membrane!.deltaPercent})`);
  // 110 × 0,75 = 82,5
  assert(membrane!.totalCostImpactHt === 82.5, `impact membrane 82,5 (got ${membrane!.totalCostImpactHt})`);
}

{
  // Prix inchangé 12 → 12
  const maps: PriceMaps = {
    materials: new Map([
      [
        "m1",
        {
          id: "m1",
          name: "Parpaing",
          unitCostHt: 12,
          isActive: true,
          updatedAt: new Date(),
        },
      ],
    ]),
    labor: new Map(),
    equipmentDb: new Map(),
  };
  const snap = baseSnapshot({
    components: [
      {
        name: "Parpaing",
        type: "MATERIAL",
        quantityPerUnit: 1,
        unit: "U",
        unitCostHt: 12,
        lossPercent: 0,
        lineCostHt: 12,
        materialId: "m1",
      },
    ],
    unitCostHt: 12,
    unitSellHt: 15,
    marginPercent: 20,
  });
  const r = evaluateQuotePriceChanges({
    quoteId: "q",
    versionId: "v",
    quoteStatus: "DRAFT",
    lockState: "DRAFT",
    minMarginPercent: null,
    maps,
    lines: [
      {
        id: "l1",
        designation: "Mur",
        quantity: 10,
        unit: "m²",
        unitCostHt: 12,
        unitSellHt: 15,
        discountPercent: 0,
        vatRate: 20,
        kind: "WORK",
        isOptional: false,
        compositionSnapshotJson: snap,
      },
    ],
  });
  assert(r.status === "UP_TO_DATE", "12→12 UP_TO_DATE");
  assert(r.changedResourceCount === 0, "aucune variation listée");
  assert(r.costDeltaHt === 0, "delta 0");
}

{
  // Hausse 10 → 12 = +20 %
  const maps: PriceMaps = {
    materials: new Map([
      [
        "m1",
        {
          id: "m1",
          name: "X",
          unitCostHt: 12,
          isActive: true,
          updatedAt: new Date(),
        },
      ],
    ]),
    labor: new Map(),
    equipmentDb: new Map(),
  };
  const snap = baseSnapshot({
    components: [
      {
        name: "X",
        type: "MATERIAL",
        quantityPerUnit: 5,
        unit: "U",
        unitCostHt: 10,
        lossPercent: 0,
        lineCostHt: 50,
        materialId: "m1",
      },
    ],
    unitCostHt: 50,
    unitSellHt: 62.5,
    marginPercent: 20,
  });
  const r = evaluateQuotePriceChanges({
    quoteId: "q",
    versionId: "v",
    quoteStatus: "DRAFT",
    lockState: "DRAFT",
    minMarginPercent: null,
    maps,
    lines: [
      {
        id: "l1",
        designation: "Ligne",
        quantity: 2,
        unit: "ens",
        unitCostHt: 50,
        unitSellHt: 62.5,
        discountPercent: 0,
        vatRate: 20,
        kind: "WORK",
        isOptional: false,
        compositionSnapshotJson: snap,
      },
    ],
  });
  assert(r.changedResources[0]?.deltaPercent === 20, "hausse +20 %");
  // unit cost 50 → 60 ; line qty 2 → delta 20
  assert(r.affectedLines[0]?.costDeltaHt === 20, `impact ligne +20 (got ${r.affectedLines[0]?.costDeltaHt})`);
}

{
  // Baisse 10 → 8 = -20 %
  const maps: PriceMaps = {
    materials: new Map([
      [
        "m1",
        {
          id: "m1",
          name: "X",
          unitCostHt: 8,
          isActive: true,
          updatedAt: new Date(),
        },
      ],
    ]),
    labor: new Map(),
    equipmentDb: new Map(),
  };
  const snap = baseSnapshot({
    components: [
      {
        name: "X",
        type: "MATERIAL",
        quantityPerUnit: 1,
        unit: "U",
        unitCostHt: 10,
        lossPercent: 0,
        lineCostHt: 10,
        materialId: "m1",
      },
    ],
    unitCostHt: 10,
    unitSellHt: 12.5,
  });
  const r = evaluateQuotePriceChanges({
    quoteId: "q",
    versionId: "v",
    quoteStatus: "DRAFT",
    lockState: "DRAFT",
    minMarginPercent: null,
    maps,
    lines: [
      {
        id: "l1",
        designation: "Ligne",
        quantity: 1,
        unit: "U",
        unitCostHt: 10,
        unitSellHt: 12.5,
        discountPercent: 0,
        vatRate: 20,
        kind: "WORK",
        isOptional: false,
        compositionSnapshotJson: snap,
      },
    ],
  });
  assert(r.changedResources[0]?.deltaPercent === -20, "baisse -20 %");
  assert(r.costDeltaHt < 0, "impact coût négatif");
}

{
  // Ressource supprimée
  const snap = baseSnapshot({
    components: [
      {
        name: "Ghost",
        type: "MATERIAL",
        quantityPerUnit: 1,
        unit: "U",
        unitCostHt: 10,
        lossPercent: 0,
        lineCostHt: 10,
        materialId: "gone",
      },
    ],
    unitCostHt: 10,
    unitSellHt: 12.5,
  });
  const r = evaluateQuotePriceChanges({
    quoteId: "q",
    versionId: "v",
    quoteStatus: "DRAFT",
    lockState: "DRAFT",
    minMarginPercent: null,
    maps: emptyMaps(),
    lines: [
      {
        id: "l1",
        designation: "Ligne",
        quantity: 1,
        unit: "U",
        unitCostHt: 10,
        unitSellHt: 12.5,
        discountPercent: 0,
        vatRate: 20,
        kind: "WORK",
        isOptional: false,
        compositionSnapshotJson: snap,
      },
    ],
  });
  assert(r.status === "MANUAL_REVIEW_REQUIRED", "introuvable → MANUAL_REVIEW");
  assert(r.missingResources[0]?.currentUnitCostHt === null, "pas current=0");
  assert(r.currentEstimatedCostHt === 10, "coût conserve snapshot pour composant missing");
}

{
  // Composant manuel
  const snap = baseSnapshot({
    components: [
      {
        name: "Saisie manuelle",
        type: "OTHER",
        quantityPerUnit: 1,
        unit: "U",
        unitCostHt: 50,
        lossPercent: 0,
        lineCostHt: 50,
      },
    ],
    unitCostHt: 50,
    unitSellHt: 62.5,
  });
  const r = evaluateQuotePriceChanges({
    quoteId: "q",
    versionId: "v",
    quoteStatus: "DRAFT",
    lockState: "DRAFT",
    minMarginPercent: null,
    maps: emptyMaps(),
    lines: [
      {
        id: "l1",
        designation: "Ligne",
        quantity: 1,
        unit: "U",
        unitCostHt: 50,
        unitSellHt: 62.5,
        discountPercent: 0,
        vatRate: 20,
        kind: "WORK",
        isOptional: false,
        compositionSnapshotJson: snap,
      },
    ],
  });
  assert(r.status === "NOTHING_TO_COMPARE", "manuel → NOTHING_TO_COMPARE");
  assert(r.manualComponentCount === 1, "1 composant manuel");
}

{
  // Composition bibliothèque changée : price-check garde snapshot (Membrane A)
  // même si work item actuel a Membrane B
  const snap = baseSnapshot();
  const maps: PriceMaps = {
    materials: new Map([
      [
        "mat-epdm",
        {
          id: "mat-epdm",
          name: "Membrane EPDM",
          unitCostHt: 9.15,
          isActive: true,
          updatedAt: new Date(),
        },
      ],
      [
        "mat-b",
        {
          id: "mat-b",
          name: "Membrane B",
          unitCostHt: 20,
          isActive: true,
          updatedAt: new Date(),
        },
      ],
    ]),
    labor: new Map([
      [
        "lab-etanch",
        {
          id: "lab-etanch",
          name: "MO",
          unitCostHt: 34,
          isActive: true,
          updatedAt: new Date(),
        },
      ],
    ]),
    equipmentDb: new Map(),
  };
  const r = evaluateQuotePriceChanges({
    quoteId: "q",
    versionId: "v",
    quoteStatus: "DRAFT",
    lockState: "DRAFT",
    minMarginPercent: null,
    maps,
    currentWorkItemResourceKeys: new Map([
      ["wi-etanch", new Set(["MATERIAL:mat-b", "LABOR:lab-etanch"])],
    ]),
    lines: [
      {
        id: "l1",
        designation: "Étanchéité terrasse",
        quantity: 1,
        unit: "ens",
        unitCostHt: snap.unitCostHt,
        unitSellHt: snap.unitSellHt,
        discountPercent: 0,
        vatRate: 20,
        kind: "WORK",
        isOptional: false,
        commercialWorkItemId: "wi-etanch",
        compositionSnapshotJson: snap,
      },
    ],
  });
  assert(
    r.changedResources.some((x) => x.resourceId === "mat-epdm"),
    "compare Membrane A du snapshot, pas Membrane B",
  );
  assert(
    !r.changedResources.some((x) => x.resourceId === "mat-b"),
    "n’introduit pas Membrane B",
  );
  assert(r.compositionHints.length === 1, "hint composition évoluée");
  assert(r.currentEstimatedCostHt === 1346.5, "recalcul ancienne composition + nouveaux prix");
}

{
  // Grouping : même ressource sur 2 lignes
  const maps: PriceMaps = {
    materials: new Map([
      [
        "mat-epdm",
        {
          id: "mat-epdm",
          name: "Membrane EPDM",
          unitCostHt: 9.15,
          isActive: true,
          updatedAt: new Date(),
        },
      ],
    ]),
    labor: new Map(),
    equipmentDb: new Map(),
  };
  const snap = baseSnapshot({
    components: [
      {
        name: "Membrane EPDM",
        type: "MATERIAL",
        quantityPerUnit: 100,
        unit: "m²",
        unitCostHt: 8.4,
        lossPercent: 10,
        lineCostHt: 924,
        materialId: "mat-epdm",
      },
    ],
    unitCostHt: 924,
    unitSellHt: 1155,
  });
  const r = evaluateQuotePriceChanges({
    quoteId: "q",
    versionId: "v",
    quoteStatus: "DRAFT",
    lockState: "DRAFT",
    minMarginPercent: null,
    maps,
    lines: [
      {
        id: "l1",
        designation: "Terrasse A",
        quantity: 1,
        unit: "ens",
        unitCostHt: 924,
        unitSellHt: 1155,
        discountPercent: 0,
        vatRate: 20,
        kind: "WORK",
        isOptional: false,
        compositionSnapshotJson: snap,
      },
      {
        id: "l2",
        designation: "Terrasse B",
        quantity: 1,
        unit: "ens",
        unitCostHt: 924,
        unitSellHt: 1155,
        discountPercent: 0,
        vatRate: 20,
        kind: "WORK",
        isOptional: false,
        compositionSnapshotJson: snap,
      },
    ],
  });
  assert(r.changedResourceCount === 1, "groupement 1 ressource");
  assert(r.changedResources[0].affectedLineIds.length === 2, "utilisée dans 2 lignes");
  assert(r.changedResources[0].totalCostImpactHt === 165, "impact total 2×82,5");
}

{
  // SENT : check ok, apply bloqué
  const snap = baseSnapshot();
  const maps: PriceMaps = {
    materials: new Map([
      [
        "mat-epdm",
        {
          id: "mat-epdm",
          name: "M",
          unitCostHt: 9.15,
          isActive: true,
          updatedAt: new Date(),
        },
      ],
    ]),
    labor: new Map([
      [
        "lab-etanch",
        {
          id: "lab-etanch",
          name: "L",
          unitCostHt: 34,
          isActive: true,
          updatedAt: new Date(),
        },
      ],
    ]),
    equipmentDb: new Map(),
  };
  const r = evaluateQuotePriceChanges({
    quoteId: "q",
    versionId: "v",
    quoteStatus: "SENT",
    lockState: "LOCKED",
    minMarginPercent: null,
    maps,
    lines: [
      {
        id: "l1",
        designation: "X",
        quantity: 1,
        unit: "ens",
        unitCostHt: snap.unitCostHt,
        unitSellHt: snap.unitSellHt,
        discountPercent: 0,
        vatRate: 20,
        kind: "WORK",
        isOptional: false,
        compositionSnapshotJson: snap,
      },
    ],
  });
  assert(r.canApply === false, "SENT ne peut pas apply");
  assert(Boolean(r.applyBlockedReason), "raison apply bloqué");
}

{
  assert(shouldOfferPriceCheck("DRAFT"), "bouton DRAFT");
  assert(shouldOfferPriceCheck("TO_VALIDATE"), "bouton TO_VALIDATE");
  assert(shouldOfferPriceCheck("VALIDATED"), "bouton VALIDATED");
  assert(shouldOfferPriceCheck("SENT"), "bouton SENT");
  assert(!shouldOfferPriceCheck("ACCEPTED"), "pas ACCEPTED");
  assert(!shouldOfferPriceCheck("REFUSED"), "pas REFUSED");
  assert(!shouldOfferPriceCheck("CANCELLED"), "pas CANCELLED");
  assert(!shouldOfferPriceCheck("EXPIRED"), "pas EXPIRED");
}

{
  // Renommage : même id, désignation différente → comparaison valide
  const maps: PriceMaps = {
    materials: new Map([
      [
        "mat-epdm",
        {
          id: "mat-epdm",
          name: "EPDM Premium (nouveau nom)",
          unitCostHt: 9.15,
          isActive: true,
          updatedAt: new Date(),
        },
      ],
    ]),
    labor: new Map(),
    equipmentDb: new Map(),
  };
  const snap = baseSnapshot({
    components: [
      {
        name: "Membrane EPDM",
        type: "MATERIAL",
        quantityPerUnit: 1,
        unit: "m²",
        unitCostHt: 8.4,
        lossPercent: 0,
        lineCostHt: 8.4,
        materialId: "mat-epdm",
      },
    ],
    unitCostHt: 8.4,
    unitSellHt: 10.5,
  });
  const r = evaluateQuotePriceChanges({
    quoteId: "q",
    versionId: "v",
    quoteStatus: "DRAFT",
    lockState: "DRAFT",
    minMarginPercent: null,
    maps,
    lines: [
      {
        id: "l1",
        designation: "L",
        quantity: 1,
        unit: "m²",
        unitCostHt: 8.4,
        unitSellHt: 10.5,
        discountPercent: 0,
        vatRate: 20,
        kind: "WORK",
        isOptional: false,
        compositionSnapshotJson: snap,
      },
    ],
  });
  assert(r.changedResources[0].designationCurrent === "EPDM Premium (nouveau nom)", "match par id");
  assert(r.status === "CHANGES_FOUND", "renommage n’empêche pas la comparaison");
}

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll V1.2 price-check tests passed.");
