import assert from "node:assert/strict";
import { parseBeworkPatch } from "@/lib/bework-patch/parse";
import { supportedOperationsForSection } from "@/lib/bework-patch/operations-catalog";
import {
  isQuoteCommitSupportedOp,
  QUOTE_COMMIT_SUPPORTED_OPS,
  QUOTE_COMMIT_UNSUPPORTED_OPS,
  QUOTE_UPDATE_ITEM_COMMITTED_FIELDS,
} from "@/lib/bework-patch/commit/quote-capability";
import {
  FOLLOW_UP_COMMIT_SUPPORTED_OPS,
  FOLLOW_UP_UPDATE_ALLOWED_FIELDS,
} from "@/lib/bework-patch/commit/follow-up-ops";
import {
  NOTICE_COMMIT_SUPPORTED_OPS,
  NOTICE_UPDATE_ALLOWED_FIELDS,
} from "@/lib/bework-patch/commit/notice-ops";
import {
  REPORT_COMMIT_SUPPORTED_OPS,
  REPORT_UPDATE_ALLOWED_FIELDS,
} from "@/lib/bework-patch/commit/report-ops";
import {
  VISIT_COMMIT_SUPPORTED_OPS,
  VISIT_MEASUREMENT_FIELDS,
  VISIT_UPDATE_ALLOWED_FIELDS,
} from "@/lib/bework-patch/commit/visit-ops";
import {
  isBeworkCrossOrgStaff,
  isBeworkOperationalStaff,
} from "@/lib/authz";

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

function origin(section: string) {
  return {
    section,
    project_id: "proj_1",
    entity_id: "ent_1",
    base_version: 1,
  };
}

const refusedQuote = parseBeworkPatch({
  type: "bework_patch_v1",
  schema_version: 1,
  patch_id: "patch_quote_fields",
  origin: origin("QUOTE"),
  change_intent: "COMMERCIAL_ADJUSTMENT",
  reason: "TVA et unité non éditables ici",
  operations: [
    {
      op: "update_quote_item",
      target: { entity_type: "QUOTE_ITEM", quote_id: "q1", item_id: "i1" },
      changes: { quantity: 2, unit: "m2", vat_rate: 20, description: "texte" },
    },
  ],
});
assert.equal(refusedQuote.ok, false);

const acceptedQuote = parseBeworkPatch({
  type: "bework_patch_v1",
  schema_version: 1,
  patch_id: "patch_quote_ok",
  origin: origin("QUOTE"),
  change_intent: "COMMERCIAL_ADJUSTMENT",
  reason: "Quantité confirmée",
  operations: [
    {
      op: "update_quote_item",
      target: { entity_type: "QUOTE_ITEM", quote_id: "q1", item_id: "i1" },
      changes: { quantity: 2, designation: "Pose carrelage" },
    },
  ],
});
assert.equal(acceptedQuote.ok, true);
if (acceptedQuote.ok && acceptedQuote.patch.operations[0]?.op === "update_quote_item") {
  assert.deepEqual(
    Object.keys(acceptedQuote.patch.operations[0].changes).sort(),
    ["designation", "quantity"],
  );
}

function assertCatalog(
  section: "VISIT" | "FOLLOW_UP" | "REPORT" | "NOTICE",
  ops: readonly string[],
  fields: Record<string, readonly string[]>,
) {
  const exposed = supportedOperationsForSection(section);
  assert.deepEqual(
    exposed.map((o) => o.op),
    [...ops],
  );
  for (const spec of exposed) {
    const allowed = fields[spec.op];
    if (!allowed) continue;
    assert.deepEqual(
      [...spec.allowed_change_fields].sort(),
      [...allowed].sort(),
    );
  }
}

assertCatalog("VISIT", VISIT_COMMIT_SUPPORTED_OPS, {
  update_visit: VISIT_UPDATE_ALLOWED_FIELDS,
  update_measurement: VISIT_MEASUREMENT_FIELDS,
});
assertCatalog("FOLLOW_UP", FOLLOW_UP_COMMIT_SUPPORTED_OPS, {
  update_follow_up: FOLLOW_UP_UPDATE_ALLOWED_FIELDS,
});
assertCatalog("REPORT", REPORT_COMMIT_SUPPORTED_OPS, {
  update_report: REPORT_UPDATE_ALLOWED_FIELDS,
});
assertCatalog("NOTICE", NOTICE_COMMIT_SUPPORTED_OPS, {
  update_notice: NOTICE_UPDATE_ALLOWED_FIELDS,
});

assert.equal(
  isBeworkCrossOrgStaff({ role: "MANAGER", personType: null, permissionProfile: null }),
  true,
);
assert.equal(
  isBeworkCrossOrgStaff({ role: "AGENCE", personType: "INTERNAL", permissionProfile: "DIRECTION" }),
  true,
);
assert.equal(isBeworkCrossOrgStaff({ role: "AGENT", personType: "INTERNAL" }), false);
assert.equal(isBeworkCrossOrgStaff({ role: "CLIENT" }), false);
assert.equal(
  isBeworkCrossOrgStaff({ role: "MANAGER", personType: "CLIENT_EXT" }),
  false,
);
assert.equal(
  isBeworkCrossOrgStaff({ role: "AGENCE", permissionProfile: "FOURNISSEUR" }),
  false,
);
assert.equal(
  isBeworkOperationalStaff({ role: "AGENT", personType: "INTERNAL" }),
  true,
);
assert.equal(
  isBeworkOperationalStaff({ role: "AGENT", personType: "SUPPLIER" }),
  false,
);

console.log("quote-capability contract tests OK");
