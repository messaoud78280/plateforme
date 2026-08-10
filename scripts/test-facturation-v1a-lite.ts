/**
 * FACTURATION-V1A-LITE / V1A.2 — smoke tests (sans DB).
 * npx tsx scripts/test-facturation-v1a-lite.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  resolveBillingPrimaryAction,
  resolveBillingBucket,
  isBillingPipelineStatus,
  isBillingOverdueLevel,
  isBillingWatchLevel,
  billingUrgencyLabel,
} from "../src/lib/facturation/types";
import { canAccessFacturation } from "../src/lib/facturation/access";
import { evaluateFollowUpAttention } from "../src/lib/follow-up/attention/evaluate";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function atDaysAgo(days: number, now = new Date()) {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(10, 0, 0, 0);
  return d;
}

function testPureHelpers() {
  assert.equal(resolveBillingPrimaryAction("A_FACTURER"), "Préparer la facturation");
  assert.equal(resolveBillingPrimaryAction("TRAVAUX_TERMINES"), "Préparer la facturation");
  assert.ok(isBillingPipelineStatus("A_FACTURER"));
  assert.equal(
    resolveBillingBucket({ status: "A_FACTURER", isOverdueAttention: true }),
    "en_retard",
  );
  assert.equal(
    resolveBillingBucket({ status: "FACTURE", isOverdueAttention: false }),
    "soldes",
  );
  assert.equal(isBillingOverdueLevel("CRITIQUE"), true);
  assert.equal(isBillingOverdueLevel("IMPORTANT"), false);
  assert.equal(isBillingWatchLevel("A_SURVEILLER"), true);
  assert.equal(billingUrgencyLabel("URGENT"), "En retard");
  console.log("✓ helpers facturation");
}

function testBillingLevelPolicy() {
  const now = new Date("2026-08-10T12:00:00");

  const j0 = evaluateFollowUpAttention(
    {
      id: "j0",
      status: "TRAVAUX_TERMINES",
      nextActionDone: true,
      statusEnteredAt: atDaysAgo(0, now),
    },
    { now },
  );
  assert.equal(
    j0.attentionItems.some((i) => i.code === "BILLING_PENDING"),
    false,
    "J0 : pas encore BILLING_PENDING",
  );

  const j4 = evaluateFollowUpAttention(
    {
      id: "j4",
      status: "TRAVAUX_TERMINES",
      nextActionDone: true,
      statusEnteredAt: atDaysAgo(4, now),
    },
    { now },
  );
  const b4 = j4.attentionItems.find((i) => i.code === "BILLING_PENDING");
  assert.ok(b4, "J4 : BILLING_PENDING présent");
  assert.equal(b4!.level, "A_SURVEILLER", "J4 ≠ CRITIQUE");
  assert.equal(isBillingOverdueLevel(b4!.level), false);

  const j5 = evaluateFollowUpAttention(
    {
      id: "j5",
      status: "A_FACTURER",
      nextActionDone: true,
      statusEnteredAt: atDaysAgo(5, now),
    },
    { now },
  );
  const b5 = j5.attentionItems.find((i) => i.code === "BILLING_PENDING");
  assert.ok(b5);
  assert.ok(
    b5!.level === "A_SURVEILLER" || b5!.level === "IMPORTANT",
    `J5 doit être watch, reçu ${b5!.level}`,
  );
  assert.equal(isBillingOverdueLevel(b5!.level), false);

  const j8 = evaluateFollowUpAttention(
    {
      id: "j8",
      status: "A_FACTURER",
      nextActionDone: true,
      statusEnteredAt: atDaysAgo(8, now),
    },
    { now },
  );
  const b8 = j8.attentionItems.find((i) => i.code === "BILLING_PENDING");
  assert.ok(b8);
  assert.equal(b8!.level, "URGENT", "J8 = En retard (URGENT)");

  const j15 = evaluateFollowUpAttention(
    {
      id: "j15",
      status: "A_FACTURER",
      nextActionDone: true,
      statusEnteredAt: atDaysAgo(15, now),
    },
    { now },
  );
  const b15 = j15.attentionItems.find((i) => i.code === "BILLING_PENDING");
  assert.ok(b15);
  assert.equal(b15!.level, "CRITIQUE", "J15 = CRITIQUE rare");

  console.log("✓ policy niveaux J0 / J4 / J5 / J8 / J15");
}

function testAcl() {
  assert.equal(canAccessFacturation({ personType: "CLIENT_EXT" }), false);
  assert.equal(canAccessFacturation({ personType: "SUPPLIER" }), false);
  assert.equal(
    canAccessFacturation({ role: "MANAGER", personType: "INTERNAL" }),
    true,
  );
  assert.equal(
    canAccessFacturation({ role: "AGENT", personType: "INTERNAL" }),
    true,
  );
  console.log("✓ ACL externes vs internes");
}

function testSurfaces() {
  assert.ok(existsSync(join(root, "src/app/dashboard/facturation/page.tsx")));
  assert.ok(existsSync(join(root, "src/app/api/facturation/summary/route.ts")));
  const sidebar = read("src/components/dashboard/AppSidebar.tsx");
  assert.match(sidebar, /\/dashboard\/facturation/);
  assert.match(sidebar, /Facturation/);
  const page = read("src/app/dashboard/facturation/page.tsx");
  assert.match(page, /À traiter/);
  assert.match(page, /Tout est à jour/);
  assert.match(page, /Voir tout dans À traiter/);
  assert.match(page, /Chantier \/ client/);
  assert.doesNotMatch(page, /Board complet/);
  assert.doesNotMatch(page, /€/);
  assert.doesNotMatch(page, /Portefeuille/);
  assert.doesNotMatch(page, /Impayé|Encaissement|Solde restant/);
  assert.doesNotMatch(page, />\s*Ouvrir\s*</);
  const snap = read("src/lib/facturation/snapshot.ts");
  assert.match(snap, /BILLING_PENDING/);
  assert.match(snap, /loadAttentionForSheets/);
  assert.match(snap, /organizationId/);
  assert.match(snap, /isBillingOverdueLevel/);
  assert.doesNotMatch(snap, /amountHt|amountPaid|balance/);
  const evalSrc = read("src/lib/follow-up/attention/evaluate.ts");
  assert.match(evalSrc, /BILLING_LEVEL_FLOOR/);
  assert.match(evalSrc, /escalateHours: 336/);
  const seed = read("src/lib/demo-environment/billing-anti-oubli-demo.ts");
  assert.match(seed, /A_FACTURER/);
  assert.match(seed, /TRAVAUX_TERMINES/);
  assert.match(seed, /amountHt: null/);
  assert.doesNotMatch(seed, /facture de solde/);
  assert.doesNotMatch(seed, /prisma\.invoice/);
  assert.doesNotMatch(seed, /ABC Promotion/);
  const accueil = read("src/components/dashboard/AccueilOpsHome.tsx");
  assert.match(accueil, /FacturationHomeBanner/);
  const cockpit = read("src/components/chantier/ChantierOpsOverview.tsx");
  assert.match(cockpit, /billingHint/);
  const board = read("src/components/a-traiter/ATraiterAttentionBoard.tsx");
  assert.match(board, /Facturation/);
  const nav = read("src/lib/navigation/safe-return-to.ts");
  assert.match(nav, /Retour à la facturation/);
  console.log("✓ surfaces page / sidebar / Accueil / cockpit / À traiter");
}

function testNoMigration() {
  const schema = read("prisma/schema.prisma");
  assert.match(schema, /model Invoice/);
  assert.doesNotMatch(schema, /model InvoicePayment/);
  console.log("✓ aucune migration InvoicePayment (V1A)");
}

testPureHelpers();
testBillingLevelPolicy();
testAcl();
testSurfaces();
testNoMigration();
console.log("\nFACTURATION-V1A.2 — ALL PASS");
