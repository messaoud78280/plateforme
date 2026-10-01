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
    },
  ],
});
assert.equal(c01.entryMode, "plan");
assert.equal(c01.modules[0]?.stateLabel, "Dossier sur plan");
assert.equal(c01.modules[0]?.applicable, false);
assert.equal(c01.modules[1]?.stateLabel, "Validé · 32 postes");
assert.equal(c01.modules[2]?.stateLabel, "Brouillon");
assert.equal(c01.modules[3]?.stateLabel, "Prêt");
assert.equal(c01.nextAction, "Finaliser le devis");
assert.ok(c01.progressPercent > 50);

const cuisine = buildPreparationSnapshot({
  projectId: "p-cuisine",
  title: "Rénovation cuisine et salle de bain",
  siteAddress: "7 rue d'hollywood",
  siteCity: "Paris",
  visits: [
    {
      id: "v-cuisine",
      status: "TO_PLAN",
      projectId: "p-cuisine",
      commercialQuoteId: "q-cuisine",
      siteAddress: "7 rue d'hollywood",
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
    },
    {
      id: "live",
      studyId: "g1",
      scopeId: null,
      status: "CURRENT",
      revisionKind: "CURRENT",
    },
  ],
});
assert.equal(cuisine.entryMode, "visite");
assert.equal(cuisine.modules[1]?.stateLabel, "En cours · 17 postes");
assert.equal(cuisine.modules[2]?.stateLabel, "Prêt");
assert.equal(cuisine.modules[3]?.stateLabel, "Prêt");
assert.equal(cuisine.nextAction, "Finaliser le métré");

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
