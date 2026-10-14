import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertSiteDocumentMutationAllowed,
  SiteDocumentLifecycleError,
} from "./service";

assert.equal(
  assertSiteDocumentMutationAllowed({
    currentStatus: "DRAFT",
    contentMutation: true,
  }),
  "DRAFT",
);
assert.equal(
  assertSiteDocumentMutationAllowed({
    currentStatus: "DRAFT",
    nextStatus: "FINALIZED",
    contentMutation: true,
  }),
  "FINALIZED",
);
assert.equal(
  assertSiteDocumentMutationAllowed({
    currentStatus: "FINALIZED",
    nextStatus: "ARCHIVED",
    contentMutation: false,
  }),
  "ARCHIVED",
);

for (const input of [
  {
    currentStatus: "FINALIZED",
    contentMutation: true,
  },
  {
    currentStatus: "FINALIZED",
    nextStatus: "DRAFT",
    contentMutation: false,
  },
  {
    currentStatus: "ARCHIVED",
    nextStatus: "DRAFT",
    contentMutation: false,
  },
]) {
  assert.throws(
    () => assertSiteDocumentMutationAllowed(input),
    SiteDocumentLifecycleError,
  );
}

assert.throws(
  () =>
    assertSiteDocumentMutationAllowed({
      currentStatus: "DRAFT",
      nextStatus: "PUBLISHED",
      contentMutation: false,
    }),
  (error: unknown) =>
    error instanceof SiteDocumentLifecycleError && error.statusCode === 400,
);

const service = readFileSync(
  join(process.cwd(), "src/lib/site-documents/service.ts"),
  "utf8",
);
assert.match(service, /status: "DRAFT"/);
assert.match(service, /siteDocument\.deleteMany/);
assert.match(
  service,
  /assertSiteDocumentMutationAllowed\(\{\s*currentStatus: existing\.status,\s*contentMutation: true,/s,
  "L'import ChatGPT doit respecter le verrou documentaire",
);
assert.match(
  service,
  /assertSiteDocumentMutationAllowed\(\{\s*currentStatus: live\.status,\s*contentMutation: true,/s,
  "L'annulation ChatGPT doit respecter le verrou documentaire",
);

for (const relativePath of [
  "src/lib/bework-patch/commit/report-ops.ts",
  "src/lib/bework-patch/commit/notice-ops.ts",
]) {
  const source = readFileSync(join(process.cwd(), relativePath), "utf8");
  assert.match(source, /assertSiteDocumentMutationAllowed/);
}

console.log("site-document-lifecycle.test.ts: OK");
