/**
 * Auto-test import devis (sans vitest) — npx tsx src/lib/commercial/import/import-parse.selftest.ts
 */
import assert from "node:assert/strict";
import { parseFrenchNumber, moneyClose } from "@/lib/commercial/import/french-number";
import { validateImportedLineMath } from "@/lib/commercial/import/validate-math";
import type { ImportedLine } from "@/lib/commercial/import/types";
import {
  buildDraftFromExtractedText,
  detectScannedPdf,
} from "@/lib/commercial/import/parse-quote-text";

assert.equal(parseFrenchNumber("1 230,00 €"), 1230);
assert.equal(parseFrenchNumber("9\u00a0814,50"), 9814.5);
assert.equal(parseFrenchNumber("10 %"), 10);
assert.equal(parseFrenchNumber(""), null);
assert.equal(moneyClose(100, 100.01), true);

const line: ImportedLine = {
  id: "1",
  kind: "WORK",
  designation: "Test",
  description: null,
  quantity: 1,
  unit: "U",
  unitSellHt: 320,
  discountPercent: null,
  vatRate: 10,
  lineSellHt: 288,
  confidence: "ok",
  warnings: [],
};
const out = validateImportedLineMath(line);
assert.equal(out.discountPercent, 10);
assert.equal(out.confidence, "warn");

assert.equal(detectScannedPdf("abc"), true);

const text = `
ALIA BTP
Devis I-25-01-8
24 janvier 2025
Monsieur Antoine DESPUJOLS
26 avenue Douglas Haig
78000 VERSAILLES
Tél : 06 12 34 56 78
email : antoine@example.com

TERRASSEMENT ET INSTALLATION DES CUVES
Excavation cuve 3500 L 1 U 320,00 288,00
Excavation cuve 10000 L 1 Forfait 1500,00 1500,00
Pose cuve 10000 L 1 U 800,00 800,00

Échéancier : 30 % 40 % 30 %
Total HT : 9 814,50 €
TVA 10 % : 981,45 €
Total TTC : 10 795,95 €
Bon pour accord
`;
const draft = buildDraftFromExtractedText({
  text,
  fileName: "I-25-01-8.pdf",
  mimeType: "application/pdf",
  fileSize: 1000,
  format: "pdf",
});
assert.match(draft.reference ?? "", /I-25-01-8/i);
assert.equal(draft.issueDate, "2025-01-24");
assert.ok(draft.customer.name?.toLowerCase().includes("despujols"));
assert.equal(draft.totals.totalHt, 9814.5);
assert.equal(draft.totals.totalTtc, 10795.95);
assert.deepEqual(draft.paymentSchedule?.percents, [30, 40, 30]);
assert.equal(draft.flags.bonPourAccordMention, true);
assert.ok(draft.sections.some((s) => s.lines.length > 0));

console.log("import-parse.selftest OK");
