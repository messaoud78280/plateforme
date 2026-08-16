/**
 * COMMERCIAL-INVOICE-FIX — smoke (pas d’appel DB).
 * npx tsx scripts/test-commercial-invoice-fix.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const page = read("src/app/dashboard/devis-facturation/factures/preparer/page.tsx");
const hub = read("src/components/commercial/PrepareInvoiceHub.tsx");
const nav = read("src/lib/commercial/workspace-nav.ts");
const sources = read("src/lib/commercial/prepare-invoice-hub.ts");

assert.match(page, /PrepareInvoiceHub/);
assert.doesNotMatch(page, /if \(!projectId && !sheetId\) notFound\(\)/);
assert.match(hub, /Créer le brouillon/);
assert.match(hub, /Que souhaitez-vous facturer/);
assert.match(hub, /createStandardInvoice|\/api\/commercial\/invoices/);
assert.match(sources, /VALIDATED/);
assert.match(sources, /COMPLETED/);
assert.match(sources, /A_FACTURER/);
assert.match(nav, /factures\/preparer/);

console.log("✓ Hub sans notFound à vide");
console.log("✓ Contextes situation / annuel / ECO-4");
console.log("✓ Facture directe DRAFT via API existante");
console.log("✓ Sidebar Factures ≠ Préparer");
console.log("OK — test:commercial-invoice-fix");
