import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCommercialBillingScope } from "./snapshot";

assert.deepEqual(buildCommercialBillingScope("org-1"), {
  organizationId: "org-1",
});
assert.deepEqual(buildCommercialBillingScope("org-1", "project-1"), {
  organizationId: "org-1",
  projectId: "project-1",
});
assert.deepEqual(buildCommercialBillingScope("org-1", null), {
  organizationId: "org-1",
});

const source = readFileSync(
  join(process.cwd(), "src/lib/facturation/snapshot.ts"),
  "utf8",
);
assert.match(source, /prisma\.commercialInvoice\.count/);
assert.match(source, /prisma\.commercialProgressStatement\.count/);
assert.doesNotMatch(source, /prisma\.invoice\.count/);
assert.doesNotMatch(source, /prisma\.workSituation\.count/);
assert.match(source, /\{ organizationId: opts\.organizationId \}/);

console.log("snapshot-scope.test.ts: OK");
