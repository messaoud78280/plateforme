/**
 * COMMANDES-V2D — next action + worksite risk (déterministe).
 * Run: npx tsx scripts/test-purchase-order-next-action.ts
 */
import {
  evaluatePurchaseOrderNextAction,
  formatPurchaseOrderAttentionWhy,
} from "../src/lib/purchase-orders/next-action";
import { evaluatePurchaseOrderWorksiteRisk } from "../src/lib/purchase-orders/worksite-risk";

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK:", msg);
  }
}

const now = new Date("2026-08-11T10:00:00.000Z");

// A — envoyée, pas de confirmation
const a = evaluatePurchaseOrderNextAction(
  {
    status: "A_CONFIRMER",
    sharedWithSupplier: true,
    proposedDeliveryStatus: "NONE",
    requestedDeliveryAt: "2026-08-11T07:45:00.000Z",
    confirmedDeliveryAt: null,
    supplierName: "Point.P",
    orderedQty: 40,
    receivedQty: 0,
    fullyReceived: false,
  },
  { now },
);
assert(a.code === "OBTENIR_CONFIRMATION", "A: Obtenir confirmation");
assert(a.needsUserAction === true, "A: à traiter");

// B — confirmée aujourd'hui
const b = evaluatePurchaseOrderNextAction(
  {
    status: "CONFIRMEE",
    sharedWithSupplier: true,
    proposedDeliveryStatus: "ACCEPTED",
    requestedDeliveryAt: "2026-08-11T07:45:00.000Z",
    confirmedDeliveryAt: "2026-08-11T07:45:00.000Z",
    supplierName: "Point.P",
    orderedQty: 40,
    receivedQty: 0,
    fullyReceived: false,
  },
  { now },
);
assert(b.code === "RECEPTIONNER", "B: Réceptionner aujourd'hui");

// C — proposition pending
const c = evaluatePurchaseOrderNextAction(
  {
    status: "A_CONFIRMER",
    sharedWithSupplier: true,
    proposedDeliveryStatus: "PENDING",
    requestedDeliveryAt: "2026-08-11T07:45:00.000Z",
    confirmedDeliveryAt: null,
    proposedDeliveryAt: "2026-08-12T08:00:00.000Z",
    orderedQty: 40,
    receivedQty: 0,
    fullyReceived: false,
  },
  { now },
);
assert(c.code === "VALIDER_PROPOSITION_FOURNISSEUR", "C: Valider proposition");

// D — partielle
const d = evaluatePurchaseOrderNextAction(
  {
    status: "PARTIELLEMENT_RECUE",
    sharedWithSupplier: true,
    proposedDeliveryStatus: "ACCEPTED",
    requestedDeliveryAt: "2026-08-11T07:45:00.000Z",
    confirmedDeliveryAt: "2026-08-11T07:45:00.000Z",
    orderedQty: 40,
    receivedQty: 32,
    fullyReceived: false,
  },
  { now },
);
assert(d.code === "TRAITER_RECEPTION_PARTIELLE" || d.code === "RELANCER_LIVRAISON_EN_RETARD", "D: solde / retard");
assert(d.label.includes("8") || d.label.includes("solde") || d.label.includes("Relancer"), "D: 8 restent ou relance");

// E — future confirmée
const e = evaluatePurchaseOrderNextAction(
  {
    status: "CONFIRMEE",
    sharedWithSupplier: true,
    proposedDeliveryStatus: "NONE",
    requestedDeliveryAt: "2026-08-20T08:00:00.000Z",
    confirmedDeliveryAt: "2026-08-20T08:00:00.000Z",
    orderedQty: 10,
    receivedQty: 0,
    fullyReceived: false,
  },
  { now },
);
assert(e.code === "ATTENDRE_LIVRAISON", "E: Attendre livraison");
assert(e.needsUserAction === false, "E: pas À traiter");

// F — risque chantier avec intervention
const risk = evaluatePurchaseOrderWorksiteRisk({
  deliveryAt: "2026-08-13T10:00:00.000Z",
  interventionStartAt: "2026-08-12T08:00:00.000Z",
  remainingQty: 40,
  fullyReceived: false,
  projectId: "p1",
});
assert(risk.level === "risque", "F: livraison après intervention = risque");

// G — sans intervention : pas de « bloque »
const noRisk = evaluatePurchaseOrderWorksiteRisk({
  deliveryAt: "2026-08-20T10:00:00.000Z",
  remainingQty: 40,
  fullyReceived: false,
  projectId: "p1",
});
assert(noRisk.level === "none", "G: sans date intervention → pas de risque inventé");

const why = formatPurchaseOrderAttentionWhy(
  {
    attentionReason: null,
    deliveryAt: "2026-08-11T07:45:00.000Z",
    deliveryKind: "confirmed",
    orderedQty: 40,
    receivedQty: 0,
    fullyReceived: false,
    nextActionCode: "RECEPTIONNER",
  },
  { now },
);
assert(Boolean(why && why.includes("aujourd")), "Why: livraison aujourd'hui explicite");

if (failed) process.exit(1);
console.log("\nPurchase order next-action OK (V2D)");
