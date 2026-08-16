/**
 * COMMERCIAL-QUOTE-UI-3 — smoke checks (pas d’appel DB).
 * npx tsx scripts/test-commercial-quote-ui-3.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const form = read("src/components/commercial/CreateQuoteForm.tsx");
const page = read("src/app/dashboard/devis-facturation/devis/nouveau/page.tsx");
const nav = read("src/lib/commercial/workspace-nav.ts");
const clientsApi = read("src/app/api/commercial/clients/route.ts");

assert.match(form, /max-w-\[1240px\]/);
assert.match(form, /Créer et passer au chiffrage/);
assert.match(form, /Résumé du devis/);
assert.match(form, /Chiffrage à compléter/);
assert.match(form, /Nouveau client/);
assert.match(form, /siteAddressSnapshot/);
assert.match(form, /Aucun chantier pour le moment/);
assert.match(form, /Validité :/);
assert.doesNotMatch(form, /Total 0/);

assert.match(page, /primaryContact/);
assert.match(page, /defaultPaymentTerms/);
assert.doesNotMatch(page, /PageHeader/);

assert.match(nav, /devis\/nouveau/);
assert.match(nav, /ne doit pas être actif/);

assert.match(clientsApi, /zipCode/);
assert.match(clientsApi, /externalOrgContact/);

console.log("✓ Layout large + résumé + CTA chiffrage");
console.log("✓ Client riche / chantier optionnel / siteAddressSnapshot");
console.log("✓ Sidebar : /devis ≠ /devis/nouveau");
console.log("✓ API clients étendue sans migration");
console.log("OK — test:commercial-quote-ui-3");
