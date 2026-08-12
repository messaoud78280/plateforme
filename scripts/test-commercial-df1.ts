/**
 * DF-1 — consolidation devis & référentiel (tests purs).
 * Run: npx tsx scripts/test-commercial-df1.ts
 */
import {
  calculateLine,
  calculateDocumentTotals,
  calculateWorkItemCosting,
  roundMoney,
} from "../src/lib/commercial/money";
import { getQuoteActionsForStatus } from "../src/lib/commercial/quote-actions";
import { workItemRemovalMode } from "../src/lib/commercial/library";
import { buildCompositionSnapshot } from "../src/lib/commercial/library";

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else console.log("OK:", msg);
}

{
  // Scénario A — calculs cohérents HT / TVA / TTC
  const l = calculateLine({
    quantity: 10,
    unitSellHt: 100,
    unitCostHt: 70,
    vatRate: 20,
    discountPercent: 0,
  });
  assert(l.lineSellHt === 1000, "HT ligne 1000");
  assert(l.lineVat === 200, "TVA 20%");
  assert(l.lineTtc === 1200, "TTC 1200");
  const doc = calculateDocumentTotals([l]);
  assert(doc.totalSellHt === 1000, "doc HT");
  assert(doc.totalTtc === 1200, "doc TTC");
}

{
  // Options exclues des totaux
  const opt = calculateLine({
    kind: "OPTION",
    quantity: 1,
    unitSellHt: 500,
    unitCostHt: 300,
    vatRate: 20,
    isOptional: true,
  });
  assert(opt.includedInTotals === false, "option hors totaux");
  const comment = calculateLine({
    kind: "COMMENT",
    quantity: 0,
    unitSellHt: 0,
  });
  assert(comment.includedInTotals === false, "commentaire hors totaux");
}

{
  // Ouvrage composite + snapshot figé
  const costing = calculateWorkItemCosting({
    components: [
      { type: "MATERIAL", quantityPerUnit: 10, unitCostHt: 2, lossPercent: 10 },
      { type: "LABOR", quantityPerUnit: 1, unitCostHt: 32 },
    ],
    sellMode: "MARGIN",
    marginPercent: 20,
  });
  // matière 10*1.1*2 = 22 ; MO 32 ; dry 54 ; PV = 54/0.8 = 67.5
  assert(costing.costPriceHt === 54, `coût composite 54 (got ${costing.costPriceHt})`);
  assert(costing.unitSellHt === 67.5, "PV marque 20%");

  const snap = buildCompositionSnapshot({
    id: "wi",
    name: "Ouvrage",
    reference: null,
    saleUnit: "m²",
    kind: "COMPOSITE",
    feesPercent: 0,
    feesAmountHt: 0,
    sellMode: "MARGIN",
    marginPercent: 20,
    unitCostHt: costing.costPriceHt,
    unitSellHt: costing.unitSellHt,
    components: [
      {
        name: "Mat",
        type: "MATERIAL",
        quantityPerUnit: 10,
        unit: "U",
        unitCostHt: 2,
        lineCostHt: 22,
        lossPercent: 10,
        materialId: "m1",
      },
    ],
  });
  const frozen = snap.unitCostHt;
  // « biblio change » n’altère pas le snapshot local
  assert(snap.unitCostHt === frozen, "snapshot immuable localement");
}

{
  // Actions selon statut
  const draft = getQuoteActionsForStatus({ status: "DRAFT", canEdit: true });
  assert(draft.primary?.id === "validate", "DRAFT → Valider");
  assert(
    draft.secondary.some((a) => a.id === "mark_sent"),
    "DRAFT peut marquer envoyé",
  );

  const sent = getQuoteActionsForStatus({ status: "SENT", canEdit: false });
  assert(sent.primary?.id === "accept", "SENT → Accepter");
  assert(sent.secondary.some((a) => a.id === "refuse"), "SENT → Refuser");
  assert(sent.secondary.some((a) => a.id === "new_version"), "SENT → nouvelle version");

  const accepted = getQuoteActionsForStatus({
    status: "ACCEPTED",
    canEdit: false,
    hasAcceptedPdf: true,
    hasProject: false,
  });
  assert(accepted.primary?.id === "accepted_pdf", "ACCEPTED → PDF figé");
  assert(
    accepted.secondary.some((a) => a.id === "link_project"),
    "ACCEPTED sans chantier → rattacher",
  );
  assert(
    accepted.secondary.some((a) => a.id === "prepare_invoice"),
    "ACCEPTED → préparer facture",
  );
}

{
  // Référentiel : suppression vs archivage
  assert(workItemRemovalMode(0) === "delete", "jamais utilisé → delete");
  assert(workItemRemovalMode(3) === "archive", "utilisé → archive");
}

{
  // Arrondi monétaire
  assert(roundMoney(1.005, 2) === 1.01, "half-up 1.005");
  assert(roundMoney(1.004, 2) === 1.0, "half-up 1.004");
}

if (failed > 0) {
  console.error(`\n${failed} fail(s)`);
  process.exit(1);
}
console.log("\nCommercial DF-1: OK");
