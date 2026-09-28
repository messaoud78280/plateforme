import assert from "node:assert/strict";
import { assessVisitQuoteReadiness } from "./quote-readiness";

const morel = assessVisitQuoteReadiness({
  clientName: "Mr MOREL MARC",
  clientNeed: "Construction maison",
  siteAddress: "3 rue de la liberté, Guyancourt",
  fieldNotes: "Terrain en pente, accès étroit",
  comments: "Pas de réseau visible",
  measurementCount: 0,
});
assert.equal(morel.ready, true);
assert.equal(morel.done, 5);
assert.equal(morel.missing.length, 0);

const noPhotoStillReady = assessVisitQuoteReadiness({
  clientName: "Client",
  subject: "Terrassement",
  siteAddress: "1 rue Test",
  measurementCount: 2,
  comments: "Accès ok",
});
assert.equal(noPhotoStillReady.ready, true);

const partial = assessVisitQuoteReadiness({
  clientName: "Client",
  subject: "Compte rendu de visite",
  siteAddress: "",
  fieldNotes: "",
  measurementCount: 0,
  comments: "",
});
assert.equal(partial.ready, false);
assert.deepEqual(partial.missing, [
  "besoin client manquant",
  "adresse chantier manquante",
  "relevés ou notes terrain manquants",
  "observations ou contraintes manquantes",
]);

const empty = assessVisitQuoteReadiness({});
assert.equal(empty.ready, false);
assert.equal(empty.done, 0);

console.log("quote-readiness.test.ts ok");
