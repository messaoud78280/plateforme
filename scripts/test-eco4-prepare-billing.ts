/**
 * ECO-4 — À facturer → chaîne commerciale.
 * npx tsx scripts/test-eco4-prepare-billing.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPrepareBillingHref,
  canPrepareBillingFromOps,
  decidePrepareBilling,
  isPrepareBillingStatus,
} from "../src/lib/facturation/prepare-billing";
import { resolveBillingPrimaryAction } from "../src/lib/facturation/types";

function testActionAvailable() {
  assert.equal(isPrepareBillingStatus("A_FACTURER"), true);
  assert.equal(resolveBillingPrimaryAction("A_FACTURER"), "Préparer la facturation");
  assert.equal(
    decidePrepareBilling({ hasProject: true, quoteCount: 1 }),
    "PREPARE_PROGRESS",
  );
  console.log("OK: A_FACTURER + marché → action disponible");
}

function testContextProjectClient() {
  const href = buildPrepareBillingHref({
    projectId: "prj-vh",
    sheetId: "sheet-1",
  });
  assert.match(href, /projectId=prj-vh/);
  assert.match(href, /sheetId=sheet-1/);
  assert.match(href, /\/dashboard\/devis-facturation\/factures\/preparer/);
  console.log("OK: contexte chantier + fiche repris dans l’URL");
}

function testSituationPath() {
  assert.equal(
    decidePrepareBilling({
      hasProject: true,
      quoteCount: 1,
      draftStatementId: "st-1",
    }),
    "CONTINUE_PROGRESS",
  );
  assert.equal(
    decidePrepareBilling({ hasProject: true, quoteCount: 1 }),
    "PREPARE_PROGRESS",
  );
  console.log("OK: parcours situation (continuer / préparer)");
}

function testDirectInvoiceSupported() {
  const form = readFileSync(
    join(process.cwd(), "src/components/commercial/PrepareInvoiceForm.tsx"),
    "utf8",
  );
  const ops = readFileSync(
    join(process.cwd(), "src/components/facturation/PrepareBillingFromOps.tsx"),
    "utf8",
  );
  assert.match(form, /Créer le brouillon de facture/);
  assert.match(ops, /facture directe/);
  console.log("OK: facture directe supportée en option, pas en dur");
}

function testNoMarket() {
  assert.equal(
    decidePrepareBilling({ hasProject: true, quoteCount: 0 }),
    "BLOCK_NO_MARKET",
  );
  assert.equal(
    decidePrepareBilling({ hasProject: false, quoteCount: 0 }),
    "BLOCK_NO_PROJECT",
  );
  console.log("OK: sans marché / sans chantier → pas de faux objet");
}

function testMultipleMarkets() {
  assert.equal(
    decidePrepareBilling({ hasProject: true, quoteCount: 2 }),
    "NEED_QUOTE_CHOICE",
  );
  console.log("OK: plusieurs marchés → choix utilisateur");
}

function testDoubleClick() {
  const src = readFileSync(
    join(process.cwd(), "src/lib/commercial/progress-statements.ts"),
    "utf8",
  );
  assert.match(src, /Une situation brouillon existe déjà/);
  assert.equal(
    decidePrepareBilling({
      hasProject: true,
      quoteCount: 1,
      draftStatementId: "already",
    }),
    "CONTINUE_PROGRESS",
  );
  console.log("OK: double clic → situation existante, pas de doublon");
}

function testAfNotCa() {
  const profitability = readFileSync(
    join(process.cwd(), "src/lib/chantier/project-profitability.ts"),
    "utf8",
  );
  assert.doesNotMatch(profitability, /A_FACTURER/);
  assert.match(profitability, /isCollectibleInvoiceType/);
  const prepare = readFileSync(
    join(process.cwd(), "src/lib/facturation/prepare-billing.ts"),
    "utf8",
  );
  assert.match(prepare, /Ne crée pas de facture/);
  console.log("OK: A_FACTURER n’impacte pas le CA");
}

function testPermissions() {
  assert.equal(
    canPrepareBillingFromOps({ personType: "CLIENT_EXT", permissionProfile: "CLIENT" }),
    false,
  );
  assert.equal(
    canPrepareBillingFromOps({ personType: "SUPPLIER", permissionProfile: "FOURNISSEUR" }),
    false,
  );
  assert.equal(
    canPrepareBillingFromOps({ personType: "INTERNAL", permissionProfile: "CONDUCTEUR" }),
    true,
  );
  assert.equal(
    canPrepareBillingFromOps({ personType: "INTERNAL", permissionProfile: "DIRECTION" }),
    true,
  );
  console.log("OK: Client / Fournisseur interdits — Conducteur / Direction OK");
}

function testNoCreateInvoiceOnClick() {
  const ops = readFileSync(
    join(process.cwd(), "src/components/facturation/PrepareBillingFromOps.tsx"),
    "utf8",
  );
  assert.match(ops, /progress-statements/);
  assert.doesNotMatch(ops, /\/api\/commercial\/invoices/);
  console.log("OK: 1er clic prépare une situation, pas une facture");
}

testActionAvailable();
testContextProjectClient();
testSituationPath();
testDirectInvoiceSupported();
testNoMarket();
testMultipleMarkets();
testDoubleClick();
testAfNotCa();
testPermissions();
testNoCreateInvoiceOnClick();
console.log("\nECO-4 unitaires OK");
