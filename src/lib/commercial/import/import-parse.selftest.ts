/**
 * Auto-test import devis — npx tsx src/lib/commercial/import/import-parse.selftest.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrenchNumber, moneyClose } from "@/lib/commercial/import/french-number";
import { validateImportedLineMath } from "@/lib/commercial/import/validate-math";
import type { ImportedLine } from "@/lib/commercial/import/types";
import {
  buildDraftFromExtractedText,
  detectScannedPdf,
  extractQuoteFileText,
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
DEVIS N° I-25-01-8
Le vendredi 24 janvier 2025
Monsieur Antoine DESPUJOLS
26 avenue Douglas Haig
78000 VERSAILLES
Port. : +33 7 82 40 52 20
Email : antoine@example.com

Référence	Désignation	Quantité	PU Vente	TVA	Montant HT	Image
Réalisation de travaux de terrassement et d’installation de cuves.
Excavation
Excavation pour la mise en place de la cuve de 3 500 L. Forfait
1,00	320,00 €	10,00	288,00 €
Excavation cuve 10000 L
1,00	1 230,00 €	10,00	1 107,00 €

Conditions de paiement :
• 30,00 % soit 100 € : Acompte,
• 40,00 % soit 100 € : Acompte,
• 30,00 % soit 100 € : Paiement solde.
Total HT
TVA ( 10 % )
Total TTC
9 814,50 €
981,45 €
10 795,95 €
Bon pour Accord
Versailles , le 5/6/2025
`;
const draft = buildDraftFromExtractedText({
  text,
  fileName: "I-25-01-8.pdf",
  mimeType: "application/pdf",
  fileSize: 1000,
  format: "pdf",
});
assert.equal(draft.reference, "I-25-01-8");
assert.equal(draft.issueDate, "2025-01-24");
assert.ok(draft.customer.name?.toLowerCase().includes("despujols"));
assert.equal(draft.customer.city, "VERSAILLES");
assert.ok(!/port/i.test(draft.customer.city ?? ""));
assert.equal(draft.totals.totalHt, 9814.5);
assert.equal(draft.totals.totalVat, 981.45);
assert.equal(draft.totals.totalTtc, 10795.95);
assert.deepEqual(draft.paymentSchedule?.percents, [30, 40, 30]);
assert.equal(draft.flags.bonPourAccordMention, true);
assert.ok(draft.sections.some((s) => s.lines.length > 0));
assert.ok(
  !draft.sections.some((s) =>
    s.lines.some((l) => /CLAUSE|R[EÉ]SERVE\s+DE\s+PROPRI/i.test(l.designation)),
  ),
);

async function runPdfFixture() {
  const here = dirname(fileURLToPath(import.meta.url));
  const pdfPath = join(here, "fixtures", "DEVIS-I-25-01-8-DESPUJOLS-AliaBTP.pdf");
  const buf = readFileSync(pdfPath);
  const extracted = await extractQuoteFileText(
    buf,
    "DEVIS-I-25-01-8-DESPUJOLS-AliaBTP.pdf",
    "application/pdf",
  );
  assert.ok(extracted.text.length > 500);
  const real = buildDraftFromExtractedText({
    text: extracted.text,
    fileName: "DEVIS-I-25-01-8-DESPUJOLS-AliaBTP.pdf",
    mimeType: "application/pdf",
    fileSize: buf.length,
    buffer: buf,
    format: "pdf",
  });

  assert.equal(real.reference, "I-25-01-8");
  assert.equal(real.issueDate, "2025-01-24");
  assert.equal(real.customer.name, "Antoine DESPUJOLS");
  assert.equal(real.customer.postalCode, "78000");
  assert.equal(real.customer.city, "VERSAILLES");
  assert.ok(real.customer.phone?.includes("7 82 40 52 20"));
  assert.equal(real.customer.email, "antoine.despujols@free.fr");

  const work = real.sections.flatMap((s) => s.lines.filter((l) => l.kind === "WORK"));
  assert.equal(work.length, 12);
  assert.equal(real.totals.totalHt, 9814.5);
  assert.equal(real.totals.totalVat, 981.45);
  assert.equal(real.totals.totalTtc, 10795.95);
  assert.deepEqual(real.paymentSchedule?.percents, [30, 40, 30]);
  assert.equal(real.flags.mathOk, true);

  const sumHt = work.reduce((a, l) => a + (l.lineSellHt ?? 0), 0);
  assert.ok(moneyClose(sumHt, 9814.5));
  assert.ok(real.sections.some((s) => /^Excavation$/i.test(s.title)));
  assert.ok(real.sections.some((s) => /Evacuation/i.test(s.title)));
  assert.ok(
    !work.some((l) => /CLAUSE|R[EÉ]SERVE\s+DE\s+PROPRI|Pénalité de retard/i.test(l.designation)),
  );
  assert.ok(work.every((l) => (l.discountPercent ?? 0) === 10 || l.confidence === "warn"));
}

void runPdfFixture()
  .then(() => {
    console.log("import-parse.selftest OK (texte + fixture PDF I-25-01-8)");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
