import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  findUnpricedQuoteLines,
  quoteLinePricingState,
  withQuoteLineFreeConfirmation,
} from "./quote-line-pricing";

assert.equal(
  quoteLinePricingState({ kind: "WORK", unitSellHt: 125 }),
  "PRICED",
);
assert.equal(
  quoteLinePricingState({ kind: "WORK", unitSellHt: 0 }),
  "UNPRICED",
);
assert.equal(
  quoteLinePricingState({
    kind: "WORK",
    unitSellHt: 0,
    compositionSnapshotJson: {
      beworkPricing: { status: "FREE_CONFIRMED" },
    },
  }),
  "FREE_CONFIRMED",
);
assert.equal(
  quoteLinePricingState({ kind: "COMMENT", unitSellHt: 0 }),
  "NOT_APPLICABLE",
);

const freeSnapshot = withQuoteLineFreeConfirmation(
  { technical: { thicknessNote: "12 cm" } },
  true,
);
assert.deepEqual(freeSnapshot, {
  technical: { thicknessNote: "12 cm" },
  beworkPricing: { status: "FREE_CONFIRMED" },
});
assert.deepEqual(withQuoteLineFreeConfirmation(freeSnapshot, false), {
  technical: { thicknessNote: "12 cm" },
});

const unpriced = findUnpricedQuoteLines([
  { kind: "WORK", designation: "Prix manquant", unitSellHt: 0 },
  {
    kind: "WORK",
    designation: "Gratuit",
    unitSellHt: 0,
    compositionSnapshotJson: {
      beworkPricing: { status: "FREE_CONFIRMED" },
    },
  },
  { kind: "OPTION", designation: "Option sans prix", unitSellHt: 0 },
  { kind: "SUBTOTAL", designation: "Sous-total", unitSellHt: 0 },
]);
assert.deepEqual(
  unpriced.map((line) => line.designation),
  ["Prix manquant", "Option sans prix"],
);

const quoteService = readFileSync(
  join(process.cwd(), "src/lib/commercial/quotes.ts"),
  "utf8",
);
for (const status of ["VALIDATED", "SENT", "ACCEPTED"]) {
  assert.match(
    quoteService,
    new RegExp(`toStatus === "${status}"`),
    `Le statut ${status} doit être protégé`,
  );
}
assert.match(quoteService, /findUnpricedQuoteLines/);

console.log("quote-line-pricing.test.ts: OK");
