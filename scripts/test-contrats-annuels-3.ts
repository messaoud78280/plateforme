/**
 * CONTRATS-ANNUELS-3 — parcours & deep-link (déterministe).
 * npx tsx scripts/test-contrats-annuels-3.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { annualAgendaHref, annualContractHref, annualInvoiceHref } from "../src/lib/annual-contracts/nav";
import { resolveAnnualPrimaryAction } from "../src/lib/annual-contracts/primary-action";
import type { SerializedAnnualContract } from "../src/lib/annual-contracts/load-board";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function baseContract(
  partial: Partial<SerializedAnnualContract> & {
    openIntervention?: SerializedAnnualContract["openIntervention"];
    history?: SerializedAnnualContract["history"];
  },
): SerializedAnnualContract {
  const history = partial.history ?? [];
  const open = partial.openIntervention ?? null;
  return {
    id: "c1",
    clientName: "AVCIMMO — FONCIA",
    siteName: null,
    siteAddress: "Adresse",
    contractType: "CE",
    frequencyLabel: "Annuelle",
    amountHt: 1310,
    amountHtLabel: "1 310 €",
    plannedCrewCount: 2,
    plannedDuration: "1 j",
    comment: "ATTENTE OS",
    status: "ACTIVE",
    statusLabel: "Actif",
    nextPlannedDate: "2026-01-22",
    projectId: null,
    lastCompletedDate: null,
    lastCompletedYear: null,
    openIntervention: open,
    history,
    allInterventions: [...(open ? [open] : []), ...history],
    ...partial,
  };
}

function enrichIntervention(
  i: NonNullable<SerializedAnnualContract["openIntervention"]>,
): NonNullable<SerializedAnnualContract["openIntervention"]> {
  return {
    invoiceTotalHt: null,
    invoiceTotalHtLabel: null,
    invoiceAmountPaid: null,
    invoiceAmountDue: null,
    daysOverdue: null,
    ...i,
  };
}

function testAgendaDeepLink() {
  const href = annualAgendaHref({
    agendaEventId: "evt-avcimmo",
    plannedDate: "2026-01-22",
    contractId: "c1",
    clientName: "AVCIMMO — FONCIA",
  });
  assert.match(href, /date=2026-01-22/);
  assert.match(href, /event=evt-avcimmo/);
  assert.match(href, /returnTo=/);
  assert.match(href, /contrats-annuels/);
  console.log("✓ Agenda deep-link date + event + returnTo");
}

function testPrimaryActions() {
  const toPrepare = resolveAnnualPrimaryAction(
    baseContract({
      openIntervention: enrichIntervention({
        id: "i1",
        contractId: "c1",
        plannedDate: "2026-01-22",
        plannedYear: 2026,
        completedAt: null,
        plannedCrewCount: 2,
        actualCrewCount: null,
        plannedDuration: "1 j",
        status: "TO_PREPARE",
        statusLabel: "À préparer",
        comment: null,
        agendaEventId: null,
        followUpSheetId: null,
        billingNeeded: false,
        billingState: "none",
        billingStateLabel: "",
        commercialInvoiceId: null,
        commercialInvoiceNumber: null,
        commercialInvoiceHref: null,
        attentionLevel: null,
        attentionReason: null,
      }),
    }),
    { includeFinancials: true },
  );
  assert.equal(toPrepare.kind, "schedule");

  const draft = resolveAnnualPrimaryAction(
    baseContract({
      history: [
        enrichIntervention({
          id: "i2",
          contractId: "c1",
          plannedDate: "2026-01-15",
          plannedYear: 2026,
          completedAt: "2026-01-15T12:00:00.000Z",
          plannedCrewCount: 2,
          actualCrewCount: 2,
          plannedDuration: "1 j",
          status: "COMPLETED",
          statusLabel: "Réalisée",
          comment: null,
          agendaEventId: null,
          followUpSheetId: null,
          billingNeeded: true,
          billingState: "preparing",
          billingStateLabel: "Facture en préparation",
          commercialInvoiceId: "inv1",
          commercialInvoiceNumber: "FAC-2026-0005",
          commercialInvoiceHref: "/dashboard/devis-facturation/factures/inv1",
          attentionLevel: null,
          attentionReason: null,
        }),
      ],
    }),
    { includeFinancials: true },
  );
  assert.equal(draft.kind, "continue_invoice");
  assert.match(draft.label, /Continuer/);
  console.log("✓ CTA primaire schedule / DRAFT");
}

function testSources() {
  const agenda = read("src/components/agenda/AgendaApp.tsx");
  assert.match(agenda, /dateParam/);
  assert.match(agenda, /returnNav/);
  assert.match(agenda, /applyDate/);
  const drawer = read("src/components/annual-contracts/AnnualContractDrawer.tsx");
  assert.match(drawer, /resolveAnnualPrimaryAction/);
  assert.match(drawer, /annualAgendaHref/);
  assert.doesNotMatch(drawer, /Voir dans l’Agenda[\s\S]{0,40}Programmer/);
  const ws = read("src/components/annual-contracts/AnnualContractsWorkspace.tsx");
  assert.match(ws, /AnnualContractDrawer/);
  assert.match(ws, /openContract/);
  console.log("✓ sources Agenda + drawer");
}

function testInvoiceReturn() {
  const href = annualInvoiceHref({ invoiceId: "inv1", contractId: "c1" });
  assert.match(href, /factures\/inv1/);
  assert.match(href, /returnTo=/);
  assert.equal(
    annualContractHref({ contractId: "c1" }),
    "/dashboard/contrats-annuels?view=piloter&contract=c1",
  );
  console.log("✓ facture → contrat");
}

testAgendaDeepLink();
testPrimaryActions();
testSources();
testInvoiceReturn();
console.log("✅ test-contrats-annuels-3 OK");
