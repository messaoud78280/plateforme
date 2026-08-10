/**
 * ATTENTION-POLICY-AUDIT-V1 — cohérence multi-surfaces (sans DB).
 * npx tsx scripts/test-attention-policy-coherence.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { evaluateFollowUpAttention } from "../src/lib/follow-up/attention/evaluate";
import {
  isBillingOverdueLevel,
  isBillingWatchLevel,
  billingUrgencyLabel,
} from "../src/lib/facturation/types";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function atDaysAgo(days: number, now: Date) {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(10, 0, 0, 0);
  return d;
}

function billingLevelAt(days: number, now: Date) {
  const r = evaluateFollowUpAttention(
    {
      id: `sheet-j${days}`,
      status: "A_FACTURER",
      nextActionDone: true,
      statusEnteredAt: atDaysAgo(days, now),
    },
    { now },
  );
  return r.attentionItems.find((i) => i.code === "BILLING_PENDING") ?? null;
}

function testBillingPolicyUnchanged() {
  const evalSrc = read("src/lib/follow-up/attention/evaluate.ts");
  assert.match(evalSrc, /BILLING_LEVEL_FLOOR/);
  assert.match(evalSrc, /alertOrangeHours: 120/);
  assert.match(evalSrc, /alertRedHours: 168/);
  assert.match(evalSrc, /escalateHours: 336/);
  console.log("✓ Facturation BILLING_LEVEL_FLOOR inchangé (J5/J7/J14)");
}

function testSameLevelAcrossDays() {
  const now = new Date("2026-08-10T12:00:00Z");

  const cases: { days: number; expect: string | null }[] = [
    { days: 0, expect: null },
    { days: 4, expect: "A_SURVEILLER" },
    { days: 5, expect: "IMPORTANT" },
    { days: 8, expect: "URGENT" },
    { days: 15, expect: "CRITIQUE" },
  ];

  for (const c of cases) {
    const item = billingLevelAt(c.days, now);
    if (c.expect == null) {
      assert.equal(item, null, `J${c.days} doit être sans BILLING_PENDING`);
      continue;
    }
    assert.ok(item, `J${c.days} attend ${c.expect}`);
    assert.equal(item!.level, c.expect, `J${c.days}`);
    // Projection Facturation = même niveau moteur
    assert.equal(
      isBillingOverdueLevel(item!.level),
      c.expect === "URGENT" || c.expect === "CRITIQUE",
    );
    assert.equal(
      isBillingWatchLevel(item!.level),
      c.expect === "A_SURVEILLER" || c.expect === "IMPORTANT",
    );
    assert.ok(billingUrgencyLabel(item!.level));
  }
  console.log("✓ mêmes niveaux J0/J4/J5/J8/J15 (moteur = projection Facturation)");
}

function testCallersOrganizationId() {
  const batch = read("src/lib/follow-up/attention/batch.ts");
  assert.match(batch, /fallback policy used/);
  assert.match(batch, /organizationId=missing/);
  assert.match(batch, /orgBySheetId/);

  const sync = read("src/lib/follow-up/attention/sync-notifications.ts");
  assert.match(sync, /byOrg/);
  assert.doesNotMatch(
    sync,
    /organizationId:\s*sheets\[0\]\?\.organizationId/,
  );

  const escal = read("src/lib/follow-up/attention/process-escalations.ts");
  assert.match(escal, /for \(const \[orgId, orgSheets\] of byOrg\)/);

  const cockpit = read("src/lib/chantier/cockpit-ops.ts");
  assert.match(cockpit, /organizationId/);
  assert.match(cockpit, /loadAttentionForSheets\(\{[\s\S]*organizationId/);

  const portfolio = read("src/lib/chantier/portfolio.ts");
  assert.match(portfolio, /loadAttentionForSheets/);
  assert.match(portfolio, /résout l’org par fiche|org par fiche/i);

  const facturation = read("src/lib/facturation/snapshot.ts");
  assert.match(facturation, /organizationId/);

  const aTraiter = read("src/lib/a-traiter/collect.ts");
  assert.match(aTraiter, /organizationId: orgId/);

  const scheduler = read("src/lib/follow-up/attention/scheduler.ts");
  assert.match(scheduler, /for \(const organizationId of orgIds\)/);

  const poBatch = read("src/lib/purchase-orders/attention/batch.ts");
  assert.match(poBatch, /organizationId: string/);
  assert.match(poBatch, /organizationId: opts\.organizationId/);

  console.log("✓ callers : orgId / multi-tenant / warning fallback");
}

function testNoLocalUrgencyRecalc() {
  const page = read("src/app/dashboard/facturation/page.tsx");
  assert.doesNotMatch(page, /effectiveUrgency\s*=\s*[\"']CRITIQUE/);
  const banner = read("src/components/dashboard/FacturationHomeBanner.tsx");
  assert.doesNotMatch(banner, /CRITIQUE/);
  console.log("✓ pas de recalcul local d’urgence Accueil/Facturation UI");
}

testBillingPolicyUnchanged();
testSameLevelAcrossDays();
testCallersOrganizationId();
testNoLocalUrgencyRecalc();
console.log("\nATTENTION-POLICY-AUDIT-V1 — ALL PASS");
