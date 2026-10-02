/**
 * Tests displayTitle Project Signature — fixtures locales, aucune BDD.
 */
import assert from "node:assert/strict";
import {
  buildProjectPresentation,
  resolveProjectDisplayTitle,
} from "./party-labels";

assert.equal(
  resolveProjectDisplayTitle("Maison individuelle — MOREL", "MOREL"),
  "Maison individuelle",
);

assert.equal(
  resolveProjectDisplayTitle("Maison individuelle", "MOREL"),
  "Maison individuelle",
);

assert.equal(
  resolveProjectDisplayTitle("Rénovation MOREL & DUPONT", "MOREL"),
  "Rénovation MOREL & DUPONT",
);

assert.equal(
  resolveProjectDisplayTitle("Maison 120 m² — MOREL", "MOREL"),
  "Maison 120 m²",
);

assert.equal(
  resolveProjectDisplayTitle(
    "Construction d'une maison individuelle R+1 de 120 m² — MOREL",
    "MOREL",
  ),
  "Construction d'une maison individuelle R+1 de 120 m²",
);

assert.equal(
  resolveProjectDisplayTitle("Maison individuelle — MOREL", null),
  "Maison individuelle — MOREL",
);

assert.equal(
  resolveProjectDisplayTitle("Maison individuelle – morel", "MOREL"),
  "Maison individuelle",
);

// Ne pas couper si le suffixe n’est pas exactement le client
assert.equal(
  resolveProjectDisplayTitle("Maison — MOREL & FILS", "MOREL"),
  "Maison — MOREL & FILS",
);

const presented = buildProjectPresentation({
  title: "Maison 120 m² — MOREL",
  client: {
    name: "Contact",
    company: "MOREL",
    personType: "CLIENT_EXT",
    role: "CLIENT",
    accessStatus: "ACTIVE",
  },
  assignedTo: null,
  clientExtLabels: ["MOREL"],
});
assert.equal(presented.title, "Maison 120 m² — MOREL");
assert.equal(presented.displayTitle, "Maison 120 m²");
assert.equal(presented.clientLabel, "MOREL");

console.log("party-labels displayTitle tests OK");
