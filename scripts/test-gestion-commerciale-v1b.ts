/**
 * GESTION-COMMERCIALE-V1B — tests purs (KPI, deal, meta lock, next action).
 * Run: npx tsx scripts/test-gestion-commerciale-v1b.ts
 *
 * V1C documenté (pas fait ici) :
 * - FK CommercialInvoice.amendmentId
 * - GED PDF immuable à l’acceptation
 * - expiration automatique EXPIRED
 * - WorkSituation → facture PROGRESS
 * - consolidation client ExternalOrganization / snapshots
 * - RBAC commercial fin
 */
import {
  aggregateQuoteStatusCounts,
  quoteNextActionLabel,
  COMMERCIAL_KPI_STATUS_GROUPS,
} from "../src/lib/commercial/dashboard-kpis";
import { calculateDealFinancialSummary } from "../src/lib/commercial/money";
import { assertQuoteMetaUpdateAllowed } from "../src/lib/commercial/quotes";
import type { CommercialQuoteStatus } from "@prisma/client";

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK:", msg);
  }
}

{
  const rows = [
    { status: "DRAFT" as CommercialQuoteStatus, _count: 2, _sum: { totalSellHt: 1000 } },
    { status: "TO_VALIDATE" as CommercialQuoteStatus, _count: 1, _sum: { totalSellHt: 500 } },
    { status: "VALIDATED" as CommercialQuoteStatus, _count: 3, _sum: { totalSellHt: 2000 } },
    { status: "SENT" as CommercialQuoteStatus, _count: 1, _sum: { totalSellHt: 800 } },
    { status: "ACCEPTED" as CommercialQuoteStatus, _count: 2, _sum: { totalSellHt: 48500 } },
  ];
  const k = aggregateQuoteStatusCounts(rows);
  assert(k.enPreparation === 6, "En préparation = DRAFT+TO_VALIDATE+VALIDATED = 6");
  assert(k.envoyes === 1, "Envoyés = SENT+VIEWED");
  assert(k.acceptes === 2, "Acceptés");
  assert(k.pipelineDevisHt === 4300, "Pipeline HT = prep + envoyés (pas acceptés)");
  assert(k.devisAcceptesHt === 48500, "Devis acceptés HT base");
  assert(COMMERCIAL_KPI_STATUS_GROUPS.PREP.length === 3, "PREP group size");
}

{
  const s = calculateDealFinancialSummary({
    initialMarketHt: 48500,
    acceptedAmendmentsHt: 3200,
    invoicedHt: 0,
    paidTtc: 0,
    invoicedTtc: 0,
  });
  assert(s.updatedMarketHt === 51700, "Contrat accepté = 48500 + 3200 = 51700");
  assert(s.updatedMarketHt !== 53150, "Avenant en attente 1450 ne compte pas");
}

{
  const s = calculateDealFinancialSummary({
    initialMarketHt: 48500,
    acceptedAmendmentsHt: 3200,
    invoicedHt: 20000,
    paidTtc: 10000,
    invoicedTtc: 20000,
  });
  assert(s.remainingToInvoiceHt === 31700, "Reste à facturer HT");
  assert(s.remainingToCollectTtc === 10000, "Reste à encaisser TTC");
  assert(s.paidTtc === 10000, "Encaissé");
}

{
  assert(
    quoteNextActionLabel({ status: "DRAFT" }) === "Continuer le devis",
    "next DRAFT",
  );
  assert(
    quoteNextActionLabel({ status: "ACCEPTED", projectId: null }) ===
      "Créer / rattacher chantier",
    "next ACCEPTED no project",
  );
  assert(
    quoteNextActionLabel({ status: "ACCEPTED", projectId: "p1" }) ===
      "Ouvrir le chantier",
    "next ACCEPTED with project",
  );
}

{
  const block = assertQuoteMetaUpdateAllowed("ACCEPTED", { subject: "Nouveau" });
  assert(!block.ok, "ACCEPTED bloque subject");
  const allowNote = assertQuoteMetaUpdateAllowed("ACCEPTED", {
    internalNotes: "note interne",
  });
  assert(allowNote.ok, "ACCEPTED autorise notes internes");
  const blockSent = assertQuoteMetaUpdateAllowed("SENT", {
    clientExternalOrgId: "x",
  });
  assert(!blockSent.ok, "SENT bloque client");
  const draftOk = assertQuoteMetaUpdateAllowed("DRAFT", { subject: "ok" });
  assert(draftOk.ok, "DRAFT autorise subject");
}

console.log(failed === 0 ? "\nALL PASSED" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
