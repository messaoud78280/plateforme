/**
 * Validation d’intégrité multi-devis / périmètre (sans BDD).
 */
import assert from "node:assert/strict";
import { assertQuoteScopeConsistency } from "../src/lib/chantier/project-workspace";

const scope = {
  id: "scope-elec",
  projectId: "proj-1",
  organizationId: "org-1",
  referenceQuoteId: "q-ref" as string | null,
};

assert.equal(
  assertQuoteScopeConsistency({
    scope,
    quote: {
      id: "q-ref",
      projectId: "proj-1",
      organizationId: "org-1",
      scopeId: "scope-elec",
    },
  }).ok,
  true,
);

assert.equal(
  assertQuoteScopeConsistency({
    scope,
    quote: {
      id: "q-other",
      projectId: "proj-2",
      organizationId: "org-1",
      scopeId: "scope-elec",
    },
  }).ok,
  false,
);

assert.equal(
  assertQuoteScopeConsistency({
    scope,
    quote: {
      id: "q-ref",
      projectId: "proj-1",
      organizationId: "org-1",
      scopeId: "autre-scope",
    },
  }).ok,
  false,
);

// Référence sans membership → invalide
assert.equal(
  assertQuoteScopeConsistency({
    scope: { ...scope, referenceQuoteId: "q-orphan" },
    quote: {
      id: "q-orphan",
      projectId: "proj-1",
      organizationId: "org-1",
      scopeId: null,
    },
  }).ok,
  false,
);

// Autre devis du même lot (pas référence) → OK
assert.equal(
  assertQuoteScopeConsistency({
    scope,
    quote: {
      id: "q-2",
      projectId: "proj-1",
      organizationId: "org-1",
      scopeId: "scope-elec",
    },
  }).ok,
  true,
);

console.log("OK multi-quote-scope-integrity");
