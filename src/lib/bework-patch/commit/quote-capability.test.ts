import assert from "node:assert/strict";
import { supportedOperationsForSection } from "@/lib/bework-patch/operations-catalog";
import {
  isQuoteCommitSupportedOp,
  QUOTE_COMMIT_SUPPORTED_OPS,
  QUOTE_COMMIT_UNSUPPORTED_OPS,
  QUOTE_UPDATE_ITEM_COMMITTED_FIELDS,
} from "@/lib/bework-patch/commit/quote-capability";

const ops = supportedOperationsForSection("QUOTE").map((o) => o.op);
assert.deepEqual(ops, [...QUOTE_COMMIT_SUPPORTED_OPS]);
assert.ok(isQuoteCommitSupportedOp("update_quote_item"));

for (const op of QUOTE_COMMIT_UNSUPPORTED_OPS) {
  assert.equal(
    ops.includes(op),
    false,
    `${op} ne doit pas être exposé en supported_operations QUOTE`,
  );
}

const itemSpec = supportedOperationsForSection("QUOTE").find(
  (o) => o.op === "update_quote_item",
);
assert.ok(itemSpec);
assert.deepEqual(
  [...(itemSpec!.allowed_change_fields ?? [])].sort(),
  [...QUOTE_UPDATE_ITEM_COMMITTED_FIELDS].sort(),
);

// Champs non commitables absents du contrat exposé
for (const forbidden of ["description", "unit", "vat_rate"]) {
  assert.equal(
    itemSpec!.allowed_change_fields.includes(forbidden),
    false,
    `${forbidden} ne doit pas être promis`,
  );
}

console.log("quote-capability contract tests OK");
