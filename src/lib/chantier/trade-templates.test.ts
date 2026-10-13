import assert from "node:assert/strict";
import {
  CHANTIER_TRADE_TEMPLATES,
  buildTradeTemplateScopes,
  formatChantierTemplateReuseLines,
  getChantierTradeTemplate,
  parseTradeTemplateId,
  resolveTemplateFromScopeCodes,
  selectReusableRows,
  templateMatchesText,
} from "./trade-templates";

for (const template of CHANTIER_TRADE_TEMPLATES) {
  assert.ok(template.lots.length >= 2, template.id);
  for (const lot of template.lots) {
    assert.ok(lot.phases.length >= 2, `${template.id} ${lot.name}`);
  }
  const drafts = buildTradeTemplateScopes(template.id);
  assert.ok(drafts);
  const codes = new Set(drafts.map((draft) => draft.code));
  assert.equal(codes.size, drafts.length);
  for (const draft of drafts) {
    assert.match(draft.code, new RegExp(`^${template.id}-\\d{2}$`));
    assert.match(draft.description, /Quantités, prix chantier et dates à valider/);
    assert.equal("quantity" in draft, false);
    assert.equal("unitPrice" in draft, false);
    assert.equal("clientId" in draft, false);
    assert.equal("purchaseOrderId" in draft, false);
  }
  assert.equal(resolveTemplateFromScopeCodes(drafts.map((draft) => draft.code))?.id, template.id);
}

assert.equal(getChantierTradeTemplate("pavage")?.label, "Pavage");
assert.equal(parseTradeTemplateId("").ok && parseTradeTemplateId("").id, null);
assert.equal(parseTradeTemplateId("  vrd ").ok && parseTradeTemplateId("  vrd ").id, "VRD");
const unknown = parseTradeTemplateId("CUISINE");
assert.equal(unknown.ok, false);
assert.equal(buildTradeTemplateScopes("CUISINE"), null);
assert.equal(resolveTemplateFromScopeCodes(["LOT-01", "ELEC-02"]), null);

const paving = getChantierTradeTemplate("PAVAGE");
assert.ok(paving);
assert.equal(templateMatchesText(paving, "Pose de pavés béton"), true);
assert.equal(templateMatchesText(paving, "Peinture acrylique murs"), false);

const catalog = [
  { name: "Bordure T2", family: "Voirie", price: 18 },
  { name: "Peinture mate", family: "Peinture", price: 12 },
  { name: "Devis accepté Dupont", family: "Admin", price: 9000 },
];
const kept = selectReusableRows(paving, catalog, (row) => `${row.name} ${row.family}`);
assert.deepEqual(kept.map((row) => row.name), ["Bordure T2"]);

const lines = formatChantierTemplateReuseLines({
  companyName: "SETRIM",
  settingsConfigured: true,
  vatRate: "20",
  currency: "EUR",
  paymentTerms: "30 jours",
  validityDays: 30,
  tradeNames: ["Maçon", "Terrassier"],
  tradeCount: 2,
  matchedTradeNames: ["Terrassier"],
  matchedTradeCount: 1,
  workItemNames: ["Décapage"],
  workItemCount: 1,
  materialNames: [],
  materialCount: 0,
  supplierNames: ["Point.P"],
  supplierCount: 1,
  suppliersMatchedByTrade: false,
});
assert.match(lines[0] ?? "", /SETRIM/);
assert.match(lines[0] ?? "", /TVA 20 %/);
assert.match(lines[1] ?? "", /Terrassier/);
assert.match(lines[2] ?? "", /Prix non recopiés/);
assert.match(lines[3] ?? "", /Rien n’est inventé/);
assert.match(lines[4] ?? "", /Point\.P/);
assert.equal(lines.some((line) => /9000|commande|BC-/.test(line)), false);

const empty = formatChantierTemplateReuseLines({
  companyName: "Atelier",
  settingsConfigured: false,
  vatRate: null,
  currency: null,
  paymentTerms: null,
  validityDays: null,
  tradeNames: [],
  tradeCount: 0,
  matchedTradeNames: [],
  matchedTradeCount: 0,
  workItemNames: [],
  workItemCount: 0,
  materialNames: [],
  materialCount: 0,
  supplierNames: [],
  supplierCount: 0,
  suppliersMatchedByTrade: false,
});
assert.match(empty[0] ?? "", /à compléter/);
assert.match(empty[4] ?? "", /aucun fournisseur actif/);

console.log("trade-templates OK");
