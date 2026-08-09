/**
 * Tests CHANTIERS-V2B.1 — cohérence livraison / dédup / attention.
 * Run: npx tsx scripts/test-chantiers-v2b1-coherence.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isSameDeliveryAsAgendaEvent,
  resolvePortfolioDelivery,
} from "../src/lib/chantier/portfolio-delivery";

const root = join(__dirname, "..");
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

// —— Delivery phases ——
const requested = resolvePortfolioDelivery({
  id: "po1",
  status: "A_CONFIRMER",
  confirmedDeliveryAt: null,
  requestedDeliveryAt: new Date("2026-08-11T07:30:00+02:00"),
  proposedDeliveryAt: null,
  proposedDeliveryStatus: "NONE",
  supplierName: "POINT.P",
});
assert.ok(requested);
assert.equal(requested!.phase, "requested");
assert.equal(requested!.statusHint, "Demandée");
assert.ok(requested!.at.includes("2026-08-11"));

const proposed = resolvePortfolioDelivery({
  id: "po1",
  status: "A_CONFIRMER",
  confirmedDeliveryAt: null,
  requestedDeliveryAt: new Date("2026-08-11T07:30:00+02:00"),
  proposedDeliveryAt: new Date("2026-08-11T09:30:00+02:00"),
  proposedDeliveryStatus: "PENDING",
  supplierName: "POINT.P",
});
assert.equal(proposed!.phase, "proposed");
assert.equal(proposed!.statusHint, "Proposition");
assert.ok(proposed!.requestedAt);
assert.ok(proposed!.proposedAt);

const confirmed = resolvePortfolioDelivery({
  id: "po1",
  status: "CONFIRMEE",
  confirmedDeliveryAt: new Date("2026-08-11T07:30:00+02:00"),
  requestedDeliveryAt: new Date("2026-08-11T07:30:00+02:00"),
  proposedDeliveryAt: new Date("2026-08-11T09:30:00+02:00"),
  proposedDeliveryStatus: "ACCEPTED",
  supplierName: "POINT.P",
});
assert.equal(confirmed!.phase, "confirmed");
assert.equal(confirmed!.statusHint, "Confirmée");

// —— Dedup agenda / PO ——
assert.equal(
  isSameDeliveryAsAgendaEvent(
    { id: "po1", supplierName: "POINT.P" },
    { type: "LIVRAISON", purchaseOrderId: "po1", title: "Livraison POINT.P" },
  ),
  true,
);
assert.equal(
  isSameDeliveryAsAgendaEvent(
    { id: "po1", supplierName: "POINT.P" },
    { type: "REUNION_CHANTIER", purchaseOrderId: null, title: "Réunion" },
  ),
  false,
);
assert.equal(
  isSameDeliveryAsAgendaEvent(
    { id: "po1", supplierName: "POINT.P" },
    { type: "LIVRAISON", purchaseOrderId: null, title: "Livraison POINT.P (BC-2026-043)" },
  ),
  true,
);

// —— Loader / UI invariants ——
const portfolio = read("src/lib/chantier/portfolio.ts");
assert.ok(portfolio.includes("primaryAttentionReason"));
assert.ok(portfolio.includes("lastActivityAt"));
assert.ok(portfolio.includes("isSameDeliveryAsAgendaEvent"));
assert.ok(portfolio.includes("resolvePortfolioDelivery"));
assert.ok(portfolio.includes("attentionHeadline"));
assert.ok(!portfolio.includes('`${n} urgents`'));
assert.ok(!portfolio.includes('`${n} critiques`'));

const ui = read("src/components/chantier/ChantiersPortfolioList.tsx");
assert.ok(ui.includes("Responsable à définir"));
assert.ok(ui.includes("Demandée"));
assert.ok(ui.includes("Proposée"));
assert.ok(ui.includes("À surveiller"));
assert.ok(ui.includes("border-l-[2px]"));
assert.ok(!ui.includes("Aucune alerte importante"));
assert.ok(!ui.includes("Tout va bien"));
assert.ok(ui.includes("max-w-[1520px]"));
assert.ok(ui.includes("Europe/Paris"));

const coherence = read("src/lib/demo-environment/coherence-victor-hugo.ts");
assert.ok(coherence.includes("2026-08-11T07:30:00+02:00"));
assert.ok(coherence.includes("assignedToId: karim.id"));

const page = read("src/app/dashboard/projets/page.tsx");
assert.ok(page.includes("à surveiller"));
assert.ok(page.includes("Repérez immédiatement"));

console.log("OK — test:chantiers-v2b1-coherence");
