/**
 * Smoke navigation hiérarchique Chantier → Périmètre → Modules (C-01).
 * Vérifie destinations métier explicites (pas router.back).
 */
import assert from "node:assert/strict";
import {
  chantierProjectHref,
  chantierProjectsHref,
  chantierScopeHref,
  moduleChantierNav,
} from "../src/components/chantier/ChantierHierarchyNav";

const projectId = "proj-c01";
const scopeId = "scope-fondations";
const projectTitle = "DÉMO — Construction maison individuelle C-01";
const scopeName = "Fondations";

const withScope = moduleChantierNav({
  projectId,
  projectTitle,
  scope: { id: scopeId, name: scopeName },
  currentLabel: "Planning",
});

assert.equal(withScope.backHref, chantierScopeHref(projectId, scopeId));
assert.equal(withScope.backLabel, "Retour à Fondations");
assert.equal(withScope.crumbs[0]?.href, chantierProjectsHref());
assert.equal(withScope.crumbs[1]?.href, chantierProjectHref(projectId));
assert.equal(withScope.crumbs[2]?.href, chantierScopeHref(projectId, scopeId));
assert.equal(withScope.crumbs[3]?.label, "Planning");
assert.equal(withScope.crumbs[3]?.href, undefined);

const noScope = moduleChantierNav({
  projectId,
  projectTitle,
  scope: null,
  currentLabel: "Devis",
});
assert.equal(noScope.backHref, chantierProjectHref(projectId));
assert.equal(noScope.backLabel, "Retour au dossier chantier");
assert.equal(noScope.crumbs.length, 3);

console.log("OK hierarchy nav C-01 (unit)");
