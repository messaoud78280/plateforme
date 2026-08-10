/**
 * FACTURATION-V1A-LITE — smoke tests (sans DB).
 * npx tsx scripts/test-facturation-v1a-lite.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  resolveBillingPrimaryAction,
  resolveBillingBucket,
  isBillingPipelineStatus,
} from "../src/lib/facturation/types";
import { canAccessFacturation } from "../src/lib/facturation/access";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function testPureHelpers() {
  assert.equal(resolveBillingPrimaryAction("A_FACTURER"), "Préparer la facture");
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
  console.log("✓ helpers facturation");
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
  assert.doesNotMatch(page, /€/);
  assert.doesNotMatch(page, /Portefeuille/);
  const snap = read("src/lib/facturation/snapshot.ts");
  assert.match(snap, /BILLING_PENDING/);
  assert.match(snap, /loadAttentionForSheets/);
  assert.doesNotMatch(snap, /amountHt|amountPaid|balance/);
  const seed = read("src/lib/demo-environment/billing-anti-oubli-demo.ts");
  assert.match(seed, /A_FACTURER/);
  assert.match(seed, /TRAVAUX_TERMINES/);
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
  // Garde-fou : pas de nouveau modèle Prisma dans cette passe
  const schema = read("prisma/schema.prisma");
  assert.match(schema, /model Invoice/);
  assert.doesNotMatch(schema, /model InvoicePayment/);
  console.log("✓ aucune migration InvoicePayment (V1A)");
}

testPureHelpers();
testAcl();
testSurfaces();
testNoMigration();
console.log("\nFACTURATION-V1A-LITE — ALL PASS");
