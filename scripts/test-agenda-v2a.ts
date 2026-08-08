/**
 * Tests AGENDA-V2A — serialize, conflits, schedule livraison.
 * Exécuter : npx tsx scripts/test-agenda-v2a.ts
 */
import assert from "node:assert/strict";
import {
  findAgendaConflicts,
  formatAgendaConflictWarning,
} from "../src/lib/agenda/conflicts";
import {
  serializePurchaseOrderForAgenda,
  AGENDA_LAYER_FILTERS,
} from "../src/lib/agenda/serialize-event";
import {
  decideAgendaDeliveryReschedule,
  resolveDeliverySchedule,
} from "../src/lib/purchase-orders/sync-delivery";
import type { AgendaEventDTO } from "../src/components/agenda/agenda-types";

function ev(partial: Partial<AgendaEventDTO> & { id: string; title: string }): AgendaEventDTO {
  return {
    description: null,
    location: null,
    type: "INTERVENTION",
    status: "CONFIRME",
    startAt: "2026-08-11T09:00:00.000Z",
    endAt: "2026-08-11T10:00:00.000Z",
    allDay: false,
    projectId: "p1",
    responsibleId: "karim",
    reminderMinutes: null,
    recurrence: null,
    project: null,
    responsible: { id: "karim", name: "Karim Benali", email: "k@x.fr" },
    createdBy: { id: "u1", name: "Sophie", email: "s@x.fr" },
    attendees: [],
    ...partial,
  };
}

function testDeliveryVisualUnconfirmed() {
  const s = resolveDeliverySchedule({
    status: "A_CONFIRMER",
    requestedDeliveryAt: new Date(2026, 7, 11, 7, 30),
    confirmedDeliveryAt: null,
    proposedDeliveryAt: null,
    proposedDeliveryStatus: "NONE",
  });
  assert.equal(s.visualLabel, "A_CONFIRMER");
  assert.equal(s.agendaStatus, "PLANIFIE");
}

function testDeliveryVisualConfirmed() {
  const s = resolveDeliverySchedule({
    status: "CONFIRMEE",
    requestedDeliveryAt: new Date(2026, 7, 11, 7, 30),
    confirmedDeliveryAt: new Date(2026, 7, 11, 9),
    proposedDeliveryAt: null,
    proposedDeliveryStatus: "ACCEPTED",
  });
  assert.equal(s.visualLabel, "CONFIRMEE");
  assert.equal(s.agendaStatus, "CONFIRME");
}

function testSerializePoNoPrices() {
  const po = serializePurchaseOrderForAgenda({
    id: "po1",
    number: "BC-2026-043",
    subject: "EPDM",
    status: "CONFIRMEE",
    requestedDeliveryAt: new Date(2026, 7, 11, 7, 30),
    confirmedDeliveryAt: new Date(2026, 7, 11, 9),
    proposedDeliveryAt: null,
    proposedDeliveryStatus: "ACCEPTED",
    legacyTaskId: "t1",
    externalOrganization: { name: "POINT.P", tradeName: "Point.P" },
    lines: [{ designation: "Membrane EPDM", quantity: 40, unit: "U" }],
  });
  assert.ok(po);
  assert.equal(po!.number, "BC-2026-043");
  assert.equal(po!.supplierName, "Point.P");
  assert.match(po!.linesSummary ?? "", /40/);
  assert.equal(po!.deliveryVisual, "CONFIRMEE");
  assert.equal(po!.canReceive, true);
  // pas de prix dans le résumé
  assert.ok(!JSON.stringify(po).includes("unitPrice"));
}

function testConflictResponsible() {
  const list = [
    ev({
      id: "a",
      title: "Livraison Point.P",
      type: "LIVRAISON",
      startAt: "2026-08-11T09:00:00.000Z",
      endAt: "2026-08-11T10:00:00.000Z",
      responsibleId: "karim",
    }),
    ev({
      id: "b",
      title: "Intervention République",
      startAt: "2026-08-11T09:30:00.000Z",
      endAt: "2026-08-11T11:00:00.000Z",
      responsibleId: "karim",
      projectId: "p2",
    }),
  ];
  const conflicts = findAgendaConflicts(
    {
      id: "b",
      startAt: list[1]!.startAt,
      endAt: list[1]!.endAt,
      responsibleId: "karim",
      projectId: "p2",
    },
    list,
  );
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0]!.reason, "responsable");
  const msg = formatAgendaConflictWarning(conflicts, "Karim Benali");
  assert.ok(msg?.includes("Karim"));
  assert.ok(msg?.includes("Livraison"));
}

function testLayersCoverTypes() {
  const ids = AGENDA_LAYER_FILTERS.flatMap((l) => [...l.types]);
  assert.ok(ids.includes("LIVRAISON"));
  assert.ok(ids.includes("INTERVENTION"));
  assert.ok(ids.includes("REUNION_CHANTIER"));
  assert.ok(ids.includes("ECHEANCE"));
}

function testProposalNotConfirmedVisual() {
  const s = resolveDeliverySchedule({
    status: "A_CONFIRMER",
    requestedDeliveryAt: new Date(2026, 7, 11, 7, 30),
    confirmedDeliveryAt: null,
    proposedDeliveryAt: new Date(2026, 7, 11, 9),
    proposedDeliveryStatus: "PENDING",
  });
  assert.equal(s.visualLabel, "PROPOSITION");
  // créneau agenda = demandé, pas la proposition
  assert.equal(s.startAt?.getHours(), 7);
}

function testRescheduleUnconfirmedAllowed() {
  const d = decideAgendaDeliveryReschedule({
    status: "A_CONFIRMER",
    confirmedDeliveryAt: null,
    sharedWithSupplier: true,
    supplierName: "Point.P",
  });
  assert.equal(d.action, "update_requested");
}

function testRescheduleSupplierConfirmedBlocked() {
  const confirmed = new Date(2026, 7, 11, 9, 0);
  const d = decideAgendaDeliveryReschedule({
    status: "CONFIRMEE",
    confirmedDeliveryAt: confirmed,
    sharedWithSupplier: true,
    supplierName: "Point.P",
  });
  assert.equal(d.action, "block_supplier_confirmed");
  if (d.action === "block_supplier_confirmed") {
    assert.equal(d.code, "SUPPLIER_CONFIRMED_LOCKED");
    assert.match(d.message, /Point\.P/);
    assert.match(d.message, /confirmée/);
  }
}

function testRescheduleInternalConfirmedAllowed() {
  const d = decideAgendaDeliveryReschedule({
    status: "CONFIRMEE",
    confirmedDeliveryAt: new Date(2026, 7, 11, 9, 0),
    sharedWithSupplier: false,
    supplierName: "Stock interne",
  });
  assert.equal(d.action, "update_confirmed_internal");
}

function testRescheduleClosedBlocked() {
  const d = decideAgendaDeliveryReschedule({
    status: "RECUE",
    confirmedDeliveryAt: new Date(2026, 7, 11, 9, 0),
    sharedWithSupplier: true,
    supplierName: "Point.P",
  });
  assert.equal(d.action, "block_closed");
}

function testSerializeLockedFlag() {
  const po = serializePurchaseOrderForAgenda({
    id: "po1",
    number: "BC-2026-043",
    subject: "EPDM",
    status: "CONFIRMEE",
    sharedWithSupplier: true,
    requestedDeliveryAt: new Date(2026, 7, 11, 7, 30),
    confirmedDeliveryAt: new Date(2026, 7, 11, 9),
    proposedDeliveryAt: null,
    proposedDeliveryStatus: "ACCEPTED",
    legacyTaskId: null,
    externalOrganization: { name: "POINT.P", tradeName: "Point.P" },
    lines: [],
  });
  assert.equal(po!.agendaRescheduleLocked, true);
  assert.equal(po!.sharedWithSupplier, true);
}

const tests: [string, () => void][] = [
  ["livraison à confirmer", testDeliveryVisualUnconfirmed],
  ["livraison confirmée", testDeliveryVisualConfirmed],
  ["serialize PO sans prix", testSerializePoNoPrices],
  ["conflit responsable", testConflictResponsible],
  ["couches types", testLayersCoverTypes],
  ["proposition ≠ confirmée", testProposalNotConfirmedVisual],
  ["V2A.1 non confirmée → requested", testRescheduleUnconfirmedAllowed],
  ["V2A.1 confirmée fournisseur → bloqué", testRescheduleSupplierConfirmedBlocked],
  ["V2A.1 confirmée interne → ok", testRescheduleInternalConfirmedAllowed],
  ["V2A.1 reçue → bloqué", testRescheduleClosedBlocked],
  ["V2A.1 flag agendaRescheduleLocked", testSerializeLockedFlag],
];

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failed += 1;
    console.error(`✗ ${name}`);
    console.error(e);
  }
}
if (failed) process.exit(1);
console.log(`\nOK — test:agenda-v2a (${tests.length})`);
