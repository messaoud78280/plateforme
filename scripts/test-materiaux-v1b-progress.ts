/**
 * MATERIAUX-V1B — calculs couverture (pur).
 * Run: npx tsx scripts/test-materiaux-v1b-progress.ts
 */
import {
  calculateMaterialRequirementProgress,
  unitsCompatible,
} from "../src/lib/materiaux/progress";

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK:", msg);
  }
}

// TEST 1 — besoin seul
{
  const p = calculateMaterialRequirementProgress({
    status: "VALIDATED",
    quantityRequired: 20,
    unit: "rouleaux",
    allocations: [],
  });
  assert(p.need === 20 && p.ordered === 0 && p.received === 0, "T1 need/ordered/received");
  assert(p.remainingToOrder === 20 && p.remainingToReceive === 0, "T1 reste commander");
  assert(p.coverageState === "A_COMMANDER", "T1 état");
  assert(p.resteLabel.includes("à commander"), "T1 label");
}

// TEST 2 — une PO partielle
{
  const p = calculateMaterialRequirementProgress({
    status: "VALIDATED",
    quantityRequired: 20,
    unit: "rouleaux",
    allocations: [
      {
        quantityAllocated: 12,
        lineUnit: "rouleaux",
        orderStatus: "CONFIRMEE",
        receivedConforming: 0,
      },
    ],
  });
  assert(p.ordered === 12 && p.remainingToOrder === 8, "T2 commandé partiel");
  assert(p.remainingToReceive === 12, "T2 à recevoir");
  assert(p.coverageState === "PARTIELLEMENT_COMMANDE", "T2 état");
}

// TEST 3 — multi-fournisseurs
{
  const p = calculateMaterialRequirementProgress({
    status: "VALIDATED",
    quantityRequired: 20,
    unit: "rouleaux",
    allocations: [
      {
        quantityAllocated: 12,
        lineUnit: "rouleaux",
        orderStatus: "CONFIRMEE",
        receivedConforming: 0,
      },
      {
        quantityAllocated: 8,
        lineUnit: "rouleaux",
        orderStatus: "A_CONFIRMER",
        receivedConforming: 0,
      },
    ],
  });
  assert(p.ordered === 20 && p.remainingToOrder === 0, "T3 multi FO commandé");
  assert(p.remainingToReceive === 20, "T3 reste recevoir");
  assert(p.coverageState === "COMMANDE", "T3 état");
}

// TEST 4 — réception partielle
{
  const p = calculateMaterialRequirementProgress({
    status: "VALIDATED",
    quantityRequired: 20,
    unit: "rouleaux",
    allocations: [
      {
        quantityAllocated: 12,
        lineUnit: "rouleaux",
        orderStatus: "CONFIRMEE",
        receivedConforming: 10,
      },
      {
        quantityAllocated: 8,
        lineUnit: "rouleaux",
        orderStatus: "CONFIRMEE",
        receivedConforming: 0,
      },
    ],
  });
  assert(p.received === 10 && p.remainingToReceive === 10, "T4 reçu 10");
  assert(p.coverageState === "PARTIELLEMENT_RECU", "T4 état");
}

// TEST 5 — tout reçu
{
  const p = calculateMaterialRequirementProgress({
    status: "VALIDATED",
    quantityRequired: 20,
    unit: "rouleaux",
    allocations: [
      {
        quantityAllocated: 12,
        lineUnit: "rouleaux",
        orderStatus: "RECUE",
        receivedConforming: 12,
      },
      {
        quantityAllocated: 8,
        lineUnit: "rouleaux",
        orderStatus: "RECUE",
        receivedConforming: 8,
      },
    ],
  });
  assert(p.received === 20 && p.remainingToReceive === 0, "T5 reçu complet");
  assert(p.coverageState === "RECU", "T5 état REÇU");
}

// TEST 6 — PO annulée
{
  const p = calculateMaterialRequirementProgress({
    status: "VALIDATED",
    quantityRequired: 20,
    unit: "rouleaux",
    allocations: [
      {
        quantityAllocated: 12,
        lineUnit: "rouleaux",
        orderStatus: "CONFIRMEE",
        receivedConforming: 0,
      },
      {
        quantityAllocated: 8,
        lineUnit: "rouleaux",
        orderStatus: "ANNULEE",
        receivedConforming: 0,
      },
    ],
  });
  assert(p.ordered === 12 && p.remainingToOrder === 8, "T6 annulation PO");
}

// TEST 7 — receipt annulée = receivedConforming déjà filtré côté loader → 0
{
  const p = calculateMaterialRequirementProgress({
    status: "VALIDATED",
    quantityRequired: 20,
    unit: "rouleaux",
    allocations: [
      {
        quantityAllocated: 20,
        lineUnit: "rouleaux",
        orderStatus: "CONFIRMEE",
        receivedConforming: 0, // après annulation réception
      },
    ],
  });
  assert(p.received === 0 && p.remainingToReceive === 20, "T7 receipt annulée");
}

// TEST 8 — mismatch unités
{
  assert(!unitsCompatible("m²", "rouleaux"), "T8 units incompatibles");
  const p = calculateMaterialRequirementProgress({
    status: "VALIDATED",
    quantityRequired: 400,
    unit: "m²",
    allocations: [
      {
        quantityAllocated: 20,
        lineUnit: "rouleaux",
        orderStatus: "CONFIRMEE",
        receivedConforming: 0,
      },
    ],
  });
  assert(p.unitMismatch === true, "T8 mismatch flag");
  assert(p.ordered === 0, "T8 pas d'allocation auto");
  assert(p.resteLabel.includes("Unité différente") || p.remainingToOrder === 400, "T8 message");
}

// Sur-commande tolérée
{
  const p = calculateMaterialRequirementProgress({
    status: "VALIDATED",
    quantityRequired: 20,
    unit: "u",
    allocations: [
      {
        quantityAllocated: 22,
        lineUnit: "unité",
        orderStatus: "CONFIRMEE",
        receivedConforming: 0,
      },
    ],
  });
  assert(p.ordered === 22 && p.remainingToOrder === 0, "sur-commande OK");
  assert(unitsCompatible("u", "unités"), "unités triviales");
}

// CANCELLED
{
  const p = calculateMaterialRequirementProgress({
    status: "CANCELLED",
    quantityRequired: 20,
    unit: "rouleaux",
    allocations: [
      {
        quantityAllocated: 10,
        lineUnit: "rouleaux",
        orderStatus: "CONFIRMEE",
        receivedConforming: 5,
      },
    ],
  });
  assert(p.coverageState === "ANNULE" && p.ordered === 0, "besoin annulé exclu");
}

if (failed > 0) {
  console.error(`\n${failed} échec(s)`);
  process.exit(1);
}
console.log("\nMATERIAUX-V1B progress: OK");
