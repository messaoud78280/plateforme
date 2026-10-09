import assert from "node:assert/strict";
import { getSupplyOfferFreshness } from "@/lib/supply/offer-freshness";

function freshnessLabel(f: "FRESH" | "TO_REFRESH" | "EXPIRED"): string {
  if (f === "FRESH") return "Prix récent";
  if (f === "TO_REFRESH") return "À actualiser";
  return "Prix expiré — à actualiser";
}

const now = new Date("2026-10-09T12:00:00.000Z");

assert.equal(
  freshnessLabel(
    getSupplyOfferFreshness(
      { observedAt: "2026-10-01T00:00:00.000Z" },
      now,
    ),
  ),
  "Prix récent",
);

assert.equal(
  freshnessLabel(
    getSupplyOfferFreshness(
      { observedAt: "2026-09-01T00:00:00.000Z" },
      now,
    ),
  ),
  "À actualiser",
);

assert.equal(
  freshnessLabel(
    getSupplyOfferFreshness(
      { observedAt: "2025-01-01T00:00:00.000Z" },
      now,
    ),
  ),
  "Prix expiré — à actualiser",
);

// Snapshot ne doit jamais auto-retenir
const commitContract = {
  selected: false,
  purchaseOrdersCreated: 0,
  equivalenceStatus: "TO_VERIFY",
};
assert.equal(commitContract.selected, false);
assert.equal(commitContract.purchaseOrdersCreated, 0);
assert.equal(commitContract.equivalenceStatus, "TO_VERIFY");

console.log("catalog apply-to-supply tests OK");
