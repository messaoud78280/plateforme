/**
 * COHERENCE-PLATFORM-V1 — date livraison unique (Europe/Paris) + next action métier.
 * Run: npx tsx scripts/test-coherence-platform-v1.ts
 */
import assert from "node:assert/strict";
import {
  formatPurchaseOrderDeliveryTime,
  getEffectivePurchaseOrderDeliveryAt,
  PURCHASE_ORDER_DISPLAY_TZ,
} from "../src/lib/purchase-orders/delivery-display";
import { purchaseOrderAttentionActionLabel } from "../src/lib/purchase-orders/attention/evaluate";
import { resolvePurchaseOrderDeliveryReference } from "../src/lib/purchase-orders/next-action";
import { formatTime } from "../src/lib/agenda/dates";

let failed = 0;
function check(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK:", msg);
  }
}

// Instant UTC « 07:45Z » = 09:45 Europe/Paris (été)
const utcWall = new Date("2026-08-11T07:45:00.000Z");
check(
  formatPurchaseOrderDeliveryTime(utcWall) === "09:45",
  "UTC 07:45Z → affichage Paris 09:45",
);
check(formatTime(utcWall) === "09:45", "Agenda formatTime = Paris 09:45");

// Instant Paris explicite 07:30
const parisOffset = new Date("2026-08-11T07:30:00+02:00");
check(
  formatPurchaseOrderDeliveryTime(parisOffset) === "07:30",
  "Seed +02:00 07:30 → affichage 07:30",
);
check(formatTime(parisOffset) === "07:30", "Agenda formatTime seed 07:30");

const confirmed = new Date("2026-08-11T09:45:00+02:00");
const requested = new Date("2026-08-11T07:30:00+02:00");
check(
  getEffectivePurchaseOrderDeliveryAt({
    confirmedDeliveryAt: confirmed,
    requestedDeliveryAt: requested,
  })?.getTime() === confirmed.getTime(),
  "effective = confirmed si présent",
);
check(
  getEffectivePurchaseOrderDeliveryAt({
    confirmedDeliveryAt: null,
    requestedDeliveryAt: requested,
  })?.getTime() === requested.getTime(),
  "effective = requested sinon",
);
check(
  resolvePurchaseOrderDeliveryReference({
    confirmedDeliveryAt: confirmed,
    requestedDeliveryAt: requested,
  })?.getTime() === confirmed.getTime(),
  "resolvePurchaseOrderDeliveryReference aligné",
);

const label = purchaseOrderAttentionActionLabel("DELIVERY_UNCONFIRMED", "Point.P");
check(!/^voir\b/i.test(label), "action DELIVERY_UNCONFIRMED n’est pas « Voir… »");
check(/confirmation|relancer/i.test(label), `action métier: ${label}`);

check(PURCHASE_ORDER_DISPLAY_TZ === "Europe/Paris", "TZ canonique Europe/Paris");

if (failed) process.exit(1);
console.log("\nCOHERENCE-PLATFORM-V1 delivery/next-action OK");
