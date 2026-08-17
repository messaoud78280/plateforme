/**
 * Tests purs — périodes, tendances, seuils fiscaux.
 * npx tsx scripts/test-commercial-dashboard-v2.ts
 */
import assert from "node:assert/strict";
import {
  resolveDashboardPeriod,
  trendChange,
  enumerateBuckets,
} from "../src/lib/commercial/dashboard-periods";
import { getApplicableFiscalAlerts } from "../src/lib/commercial/fiscal-thresholds";
import { getElectronicConnectionState } from "../src/lib/commercial/electronic-invoicing";

const now = new Date(2026, 7, 17);

{
  const p = resolveDashboardPeriod({ preset: "this_month", now });
  assert.equal(p.from.getMonth(), 7);
  assert.equal(p.from.getDate(), 1);
  assert.equal(p.toExclusive.getMonth(), 8);
  assert.equal(p.previousFrom.getMonth(), 6);
  assert.equal(p.granularity, "day");
}

{
  const t = trendChange(0, 0);
  assert.equal(t.kind, "na");
  const n = trendChange(100, 0);
  assert.equal(n.kind, "new");
  const up = trendChange(112, 100);
  assert.equal(up.kind, "up");
  assert.equal(up.label.includes("12"), true);
}

{
  const keys = enumerateBuckets(
    new Date(2026, 7, 1),
    new Date(2026, 8, 1),
    "week",
  );
  assert.ok(keys.length >= 4 && keys.length <= 6);
}

{
  assert.equal(getApplicableFiscalAlerts({ profile: null, revenueHt: 200000 }).length, 0);
  assert.equal(
    getApplicableFiscalAlerts({
      profile: { regime: "STANDARD_VAT" },
      revenueHt: 200000,
    }).length,
    0,
  );
  const micro = getApplicableFiscalAlerts({
    profile: { regime: "MICRO_BIC", activityCategory: "SERVICES" },
    revenueHt: 70000,
    at: now,
  });
  assert.equal(micro.length, 1);
}

{
  const e = getElectronicConnectionState("org");
  assert.equal(e.configured, false);
  assert.equal(e.internalStatus, "NOT_CONNECTED");
}

console.log("OK — test:commercial-dashboard-v2");
