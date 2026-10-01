import assert from "node:assert/strict";
import { buildPreparationSnapshot, resolveProjectVisit } from "./preparation-state";

const guyancourtVisit = {
  id: "visit-guyancourt",
  status: "IN_PROGRESS",
  projectId: null,
  commercialQuoteId: null,
  siteAddress: "3 rue de la liberté, 78280, Guyancourt",
  subject: "Maison individuelle R+1 terrassement",
  clientNeed: "Travaux de terrassement pour une maison de 120 m²",
};

const electricVisit = {
  id: "visit-elec",
  status: "SCHEDULED",
  projectId: null,
  commercialQuoteId: null,
  siteAddress: "3 rue de la liberté, 78190, Montigny le Bretonneux",
  subject: "Installation électrique complète",
  clientNeed: "Tableau électrique et distribution",
};

const emptyMontigny = {
  id: "visit-empty",
  status: "TO_PLAN",
  projectId: null,
  commercialQuoteId: null,
  siteAddress: "3 rue de la liberté, 78190, Montigny le Bretonneux",
  subject: "Compte rendu de visite",
  clientNeed: null,
};

const morel = buildPreparationSnapshot({
  projectId: "p-morel",
  title: "Construction d'une maison individuelle R+1 de 120 m² — MOREL",
  siteAddress: "3 rue de la Liberté, 78280 Guyancourt",
  siteCity: "Guyancourt",
  visits: [guyancourtVisit, electricVisit, emptyMontigny],
  studies: [],
  scopes: [],
  quotes: [
    {
      id: "q1",
      status: "DRAFT",
      isDemonstration: false,
      projectId: "p-morel",
      sourcePrepStudyId: null,
      subject: "Travaux de terrassement",
    },
  ],
  plans: [],
});
assert.equal(morel.visitId, "visit-guyancourt");
assert.equal(morel.modules[0]?.stateLabel, "Relevé en cours");
assert.equal(morel.modules[1]?.stateLabel, "À préparer");
assert.equal(morel.modules[2]?.stateLabel, "Brouillon");
assert.equal(morel.nextAction, "Terminer la visite");

const c01 = buildPreparationSnapshot({
  projectId: "p-c01",
  title: "DÉMO — Construction maison individuelle C-01",
  siteAddress: "4 rue de la pomelle",
  siteCity: "Massy",
  visits: [guyancourtVisit],
  studies: [
    {
      id: "study-c01",
      scopeId: "fondations",
      dossierStatus: "DEMONSTRATION",
      lineCount: 32,
      version: 4,
      sourcesJson: [{ chantierFileId: "file-1", filename: "plan de fondation.pdf", planNumber: "C-01" }],
    },
  ],
  scopes: [
    {
      id: "fondations",
      referenceStudyId: "study-c01",
      referenceQuoteId: "q-demo",
      referenceSchedulePlanId: "plan-1",
    },
  ],
  quotes: [
    {
      id: "q-demo",
      status: "DRAFT",
      isDemonstration: true,
      projectId: "p-c01",
      sourcePrepStudyId: "study-c01",
      subject: "Fondations",
    },
  ],
  plans: [
    {
      id: "plan-1",
      studyId: "study-c01",
      scopeId: "fondations",
      status: "INITIAL",
      revisionKind: "INITIAL",
      studyVersionAtGeneration: 3,
    },
  ],
  studyVersionById: { "study-c01": 4 },
  quoteSyncByQuoteId: {
    "q-demo": {
      quoteId: "q-demo",
      hasMetreProvenance: true,
      currentStudyVersion: 4,
      transferStudyVersion: 3,
    },
  },
});
assert.equal(c01.entryMode, "plan");
assert.equal(c01.modules[0]?.stateLabel, "Dossier sur plan");
assert.equal(c01.modules[0]?.applicable, false);
assert.equal(c01.modules[1]?.stateLabel, "Validé · 32 postes");
assert.equal(c01.modules[2]?.stateLabel, "À revalider");
assert.equal(c01.modules[3]?.stateLabel, "Modification disponible");
assert.equal(c01.core.devis.syncState, "MODIFICATION_DISPONIBLE");
assert.equal(c01.core.planning.syncState, "MODIFICATION_DISPONIBLE");
assert.equal(c01.nextAction, "Finaliser le devis");
assert.ok(c01.progressPercent > 50);

const cuisine = buildPreparationSnapshot({
  projectId: "p-cuisine",
  title: "Rénovation cuisine et salle de bain",
  siteAddress: "7 rue d ebony",
  siteCity: "Paris",
  visits: [
    {
      id: "v-cuisine",
      status: "TO_PLAN",
      projectId: "p-cuisine",
      commercialQuoteId: "q-cuisine",
      siteAddress: "7 rue d ebony",
      subject: "Cuisine",
      clientNeed: null,
    },
  ],
  studies: [
    {
      id: "g1",
      scopeId: null,
      dossierStatus: "PRO_A_VALIDER",
      lineCount: 17,
      version: 1,
      sourcesJson: { kind: "bework_global_metre_v1", quoteId: "q-cuisine" },
    },
  ],
  scopes: [
    {
      id: "l01",
      referenceStudyId: null,
      referenceQuoteId: "q-cuisine",
      referenceSchedulePlanId: null,
    },
  ],
  quotes: [
    {
      id: "q-cuisine",
      status: "VALIDATED",
      isDemonstration: false,
      projectId: "p-cuisine",
      sourcePrepStudyId: "g1",
      subject: "Cuisine",
    },
  ],
  plans: [
    {
      id: "old",
      studyId: "g1",
      scopeId: null,
      status: "ARCHIVED",
      revisionKind: "CURRENT",
      studyVersionAtGeneration: 1,
    },
    {
      id: "live",
      studyId: "g1",
      scopeId: null,
      status: "CURRENT",
      revisionKind: "CURRENT",
      studyVersionAtGeneration: 1,
    },
  ],
  studyVersionById: { g1: 1 },
  quoteSyncByQuoteId: {
    "q-cuisine": {
      quoteId: "q-cuisine",
      hasMetreProvenance: true,
      currentStudyVersion: 1,
      transferStudyVersion: 1,
    },
  },
});
assert.equal(cuisine.entryMode, "visite");
assert.equal(cuisine.modules[1]?.stateLabel, "À valider · 17 postes");
assert.equal(cuisine.modules[2]?.stateLabel, "Prêt");
assert.equal(cuisine.modules[3]?.stateLabel, "Prêt");
assert.equal(cuisine.nextAction, "Finaliser le métré");

const morelAligned = buildPreparationSnapshot({
  projectId: "p-morel-full",
  title: "Construction d'une maison individuelle R+1 de 120 m² — MOREL",
  siteAddress: "3 rue de la Liberte",
  siteCity: "Guyancourt",
  visits: [
    {
      id: "v-morel",
      status: "READY_TO_QUOTE",
      projectId: "p-morel-full",
      commercialQuoteId: "q-morel",
      siteAddress: "3 rue de la Liberte",
      subject: "Visite",
      clientNeed: null,
    },
  ],
  studies: [
    {
      id: "s-morel",
      scopeId: null,
      dossierStatus: "PRO_A_VALIDER",
      lineCount: 32,
      version: 4,
      sourcesJson: null,
    },
  ],
  scopes: [
    {
      id: "sc",
      referenceStudyId: null,
      referenceQuoteId: "q-morel",
      referenceSchedulePlanId: "pl-morel",
    },
  ],
  quotes: [
    {
      id: "q-morel",
      status: "VALIDATED",
      isDemonstration: false,
      projectId: "p-morel-full",
      sourcePrepStudyId: "s-morel",
      subject: "Elec",
    },
  ],
  plans: [
    {
      id: "pl-morel",
      studyId: "s-morel",
      scopeId: null,
      status: "CURRENT",
      revisionKind: "CURRENT",
      studyVersionAtGeneration: 1,
      startDateLabel: "12 oct.",
    },
  ],
  studyVersionById: { "s-morel": 4 },
  quoteSyncByQuoteId: {
    "q-morel": {
      quoteId: "q-morel",
      hasMetreProvenance: true,
      currentStudyVersion: 4,
      transferStudyVersion: 1,
    },
  },
});
assert.equal(morelAligned.modules[0]?.stateLabel, "Prête à chiffrer");
assert.equal(morelAligned.modules[1]?.stateLabel, "À valider · 32 postes");
assert.equal(morelAligned.modules[2]?.stateLabel, "À revalider");
assert.equal(morelAligned.modules[3]?.stateLabel, "Modification disponible");
assert.equal(morelAligned.core.metre.kind, "NEEDS_VALIDATION");
assert.equal(morelAligned.core.devis.syncState, "MODIFICATION_DISPONIBLE");
assert.equal(morelAligned.core.planning.syncState, "MODIFICATION_DISPONIBLE");
assert.equal(morelAligned.nextAction, "Finaliser le métré");
assert.equal(morelAligned.progressPercent, 86);

const archivedOnly = buildPreparationSnapshot({
  projectId: "p-arch",
  visits: [],
  studies: [],
  scopes: [],
  quotes: [],
  plans: [
    {
      id: "a",
      studyId: "s",
      scopeId: null,
      status: "ARCHIVED",
      revisionKind: "CURRENT",
    },
  ],
});
assert.equal(archivedOnly.modules[3]?.stateLabel, "Aucun planning actif");

const nameOnly = resolveProjectVisit({
  projectId: "p-other",
  title: "MOREL",
  siteAddress: "10 avenue de la gare, 69001 Lyon",
  siteCity: "Lyon",
  quotes: [],
  visits: [guyancourtVisit],
});
assert.equal(nameOnly, null);

const transmitted = buildPreparationSnapshot({
  projectId: "p-tx",
  visits: [
    {
      id: "v",
      status: "TRANSMITTED",
      projectId: "p-tx",
      commercialQuoteId: null,
      siteAddress: null,
      subject: null,
      clientNeed: null,
    },
  ],
  studies: [],
  scopes: [],
  quotes: [],
  plans: [],
});
assert.equal(transmitted.modules[0]?.stateLabel, "Transmise");
assert.equal(transmitted.modules[0]?.state, "done");

console.log("preparation-state.test.ts ok");
