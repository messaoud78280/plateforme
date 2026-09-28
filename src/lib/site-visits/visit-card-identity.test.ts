/**
 * Cartes Visites & métrés — titre chantier vs client.
 * Usage: npx tsx src/lib/site-visits/visit-card-identity.test.ts
 */
import assert from "node:assert/strict";
import { buildVisitCardIdentity, scopeDisplayName } from "./visit-card-identity";

function run() {
  assert.equal(scopeDisplayName("Lot 02 — Cuisine"), "Cuisine");
  assert.equal(scopeDisplayName("Lot 03 — Salle de bain"), "Salle de bain");

  const jackson = buildVisitCardIdentity({
    projectTitle: "Rénovation complète d'une cuisine et d'une salle de bain",
    projectCity: "Paris",
    scopeNames: [
      "Lot 01 — Installation, protections et déposes",
      "Lot 02 — Cuisine",
      "Lot 03 — Salle de bain",
      "Lot 04 — Finitions et nettoyage",
    ],
    clientName: "Jackson Mickael",
    siteName: null,
    subject: "Le client souhaite rénover entièrement la cuisine et la salle de bain de son app",
    lots: ["Rénovation", "Autre"],
    visitCity: "Paris",
    siteAddress: "7 rue d'hollywood, 75008, Paris",
  });
  assert.equal(jackson.title, "Rénovation complète d'une cuisine et d'une salle de bain");
  assert.equal(jackson.clientLine, "Jackson Mickael");
  assert.equal(jackson.place, "Paris");
  assert.equal(jackson.linked, true);
  assert.deepEqual(jackson.badges, ["Rénovation", "Cuisine", "Salle de bain"]);
  assert.equal(jackson.extraBadgeCount, 2);
  assert.equal(jackson.badges.includes("Autre"), false);
  assert.equal(jackson.typeLine, null);

  const electric = buildVisitCardIdentity({
    projectTitle:
      "Construction maison individuelle R+1 de 120 m² — Installation électrique complète",
    projectCity: "Montigny-le-Bretonneux",
    scopeNames: [],
    clientName: "Client électricité",
    lots: ["Électricité"],
    visitCity: null,
    siteAddress: "12 avenue des pins",
  });
  assert.equal(
    electric.title,
    "Construction maison individuelle R+1 de 120 m² — Installation électrique complète",
  );
  assert.equal(electric.linked, true);
  assert.deepEqual(electric.badges, ["Électricité"]);
  assert.equal(electric.place, "Montigny-le-Bretonneux");

  const morel = buildVisitCardIdentity({
    projectTitle: null,
    clientName: "Mr MOREL MARC",
    siteName: null,
    subject: "Monsieur MOREL souhaite faire construire une maison individuelle R+1 sans sous-s",
    lots: ["Aménagement extérieur", "Terrassement"],
    visitCity: "Guyancourt",
    siteAddress: "3 rue de la liberté, 78280, Guyancourt",
  });
  assert.equal(morel.title, "Mr MOREL MARC");
  assert.equal(morel.linked, false);
  assert.equal(morel.clientLine, null);
  assert.deepEqual(morel.badges, ["Aménagement extérieur", "Terrassement"]);
  assert.equal(morel.place, "Guyancourt");
  assert.equal(morel.title.includes("Construction d'une maison"), false);

  const vague = buildVisitCardIdentity({
    clientName: "Marc MOREL",
    subject: "Compte rendu de visite",
    lots: [],
    visitCity: "Montigny le Bretonneux",
  });
  assert.equal(vague.title, "Marc MOREL");
  assert.equal(vague.typeLine, "Type de chantier à préciser");
  assert.equal(vague.badges.length, 0);

  console.log("visit-card-identity — OK");
}

run();
