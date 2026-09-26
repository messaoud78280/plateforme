/**
 * Smoke — libellés métier préparation chantier (sans BDD).
 */
import assert from "node:assert/strict";
import {
  codeFromScopeName,
  formatUnscopedHumanMessage,
  statusLabelFromSync,
  suggestScopeNameFromText,
} from "../src/lib/chantier/project-workspace";

assert.equal(suggestScopeNameFromText("Installation électrique complète"), "Installation électrique");
assert.equal(suggestScopeNameFromText("Plan fondations C-01"), "Fondations");
assert.equal(suggestScopeNameFromText("Divers"), null);

assert.equal(codeFromScopeName("Fondations"), "FONDATIONS");
assert.ok(codeFromScopeName("Installation électrique").length >= 2);

assert.equal(statusLabelFromSync("A_JOUR", "metre"), "À jour");
assert.equal(statusLabelFromSync("ABSENT", "suivi"), "Non démarré");
assert.equal(statusLabelFromSync("ABSENT", "plan"), "À préparer");
assert.equal(statusLabelFromSync("A_VERIFIER", "plan"), "À vérifier");

assert.equal(
  formatUnscopedHumanMessage({ studies: 0, schedulePlans: 0, quotes: 1 }),
  "1 devis de ce chantier n’est pas encore rattaché à un lot de travaux.",
);
assert.equal(
  formatUnscopedHumanMessage({ studies: 0, schedulePlans: 0, quotes: 2 }),
  "2 devis de ce chantier ne sont pas encore rattachés à un lot de travaux.",
);
assert.equal(
  formatUnscopedHumanMessage({ studies: 0, schedulePlans: 0, quotes: 0 }),
  null,
);

console.log("OK chantier-preparation-ux");
