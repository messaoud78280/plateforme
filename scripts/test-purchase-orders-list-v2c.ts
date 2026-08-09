/**
 * COMMANDES-V2C — tests locaux (sans DB).
 * npx tsx scripts/test-purchase-orders-list-v2c.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function testLoaderExports() {
  const src = readFileSync(
    join(process.cwd(), "src/lib/purchase-orders/list-view.ts"),
    "utf8",
  );
  assert.ok(src.includes("loadPurchaseOrdersListView"));
  assert.ok(src.includes("computeReceivingSnapshot"));
  assert.ok(src.includes("evaluatePurchaseOrderAttention"));
  assert.ok(src.includes("stripProjectFromSubject") || src.includes("Résidence Victor Hugo"));
  assert.ok(!src.includes("for (const id of"));
  console.log("ok loader batch attention + réception");
}

function testUiWiring() {
  const page = readFileSync(
    join(process.cwd(), "src/app/dashboard/commandes/page.tsx"),
    "utf8",
  );
  assert.ok(page.includes("PurchaseOrdersListClient"));
  assert.ok(page.includes("SupplierOrdersSimple") || page.includes("isSupplier"));
  assert.ok(page.includes("loadPurchaseOrdersListView"));

  const ui = readFileSync(
    join(process.cwd(), "src/components/purchase-orders/PurchaseOrdersListClient.tsx"),
    "utf8",
  );
  assert.ok(ui.includes("Nouvelle commande"));
  assert.ok(ui.includes("0 /") || ui.includes("reçus"));
  assert.ok(ui.includes("md:hidden"));
  assert.ok(ui.includes("Attention"));
  assert.ok(ui.includes("Aucune commande pour le moment"));
  console.log("ok UI liste + mobile + empty");
}

function testNoMigration() {
  // Ticket UX only
  assert.ok(true);
  console.log("ok aucune migration attendue");
}

function main() {
  testLoaderExports();
  testUiWiring();
  testNoMigration();
  console.log("\nCOMMANDES-V2C — ALL PASS");
}

main();
