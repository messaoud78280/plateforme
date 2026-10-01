/**
 * Tests — source de vérité workflow devis chantier.
 */
import assert from "node:assert/strict";
import {
  getQuotePreparationPhase,
  isQuotePreparationReady,
  quoteEditorHref,
  quotePreparationStateLabel,
  quoteWorkflowActionLabel,
} from "./quote-workflow-status";

assert.equal(isQuotePreparationReady(null), false);
assert.equal(isQuotePreparationReady("DRAFT"), false);
assert.equal(isQuotePreparationReady("TO_VALIDATE"), false);
assert.equal(isQuotePreparationReady("VALIDATED"), true);
assert.equal(isQuotePreparationReady("SENT"), true);
assert.equal(isQuotePreparationReady("ACCEPTED"), true);
assert.equal(isQuotePreparationReady("CANCELLED"), false);

assert.equal(getQuotePreparationPhase("DRAFT"), "draft");
assert.equal(getQuotePreparationPhase("VALIDATED"), "ready");
assert.equal(getQuotePreparationPhase("ACCEPTED"), "accepted");
assert.equal(getQuotePreparationPhase("REFUSED"), "closed");

assert.equal(quotePreparationStateLabel(null), "À préparer");
assert.equal(quotePreparationStateLabel("DRAFT"), "Brouillon");
assert.equal(quotePreparationStateLabel("VALIDATED"), "Prêt");
assert.equal(quotePreparationStateLabel("SENT"), "Émis");
assert.equal(quotePreparationStateLabel("ACCEPTED"), "Accepté");

assert.equal(
  quoteEditorHref("q1", "DRAFT"),
  "/dashboard/devis-facturation/devis/q1?intent=finalize",
);
assert.equal(
  quoteEditorHref("q1", "VALIDATED"),
  "/dashboard/devis-facturation/devis/q1",
);

assert.equal(quoteWorkflowActionLabel("DRAFT"), "Finaliser le devis");
assert.equal(quoteWorkflowActionLabel("VALIDATED"), "Ouvrir");
assert.equal(quoteWorkflowActionLabel(null), "Créer un devis");

console.log("quote-workflow-status.test.ts: ok");
