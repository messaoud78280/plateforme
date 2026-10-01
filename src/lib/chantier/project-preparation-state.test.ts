/**
 * Contrat de concordance liste ↔ fiche — même ProjectPreparationState.
 */
import assert from "node:assert/strict";
import { evaluateQuoteCoreState } from "./core-preparation-state";
import { buildPreparationSnapshot } from "./preparation-state";
import {
  computeProjectNextAction,
  computeProjectPreparationState,
} from "./project-preparation-state";

function assertSameState(
  a: ReturnType<typeof computeProjectPreparationState>,
  b: ReturnType<typeof computeProjectPreparationState>,
  label: string,
) {
  assert.equal(a.visit.kind, b.visit.kind, `${label} visit.kind`);
  assert.equal(a.takeoff.kind, b.takeoff.kind, `${label} takeoff.kind`);
  assert.equal(a.quote.kind, b.quote.kind, `${label} quote.kind`);
  assert.equal(a.core.devis.syncState, b.core.devis.syncState);
  assert.equal(a.planning.kind, b.planning.kind, `${label} planning.kind`);
  assert.equal(a.core.planning.syncState, b.core.planning.syncState);
  assert.equal(a.followUp.kind, b.followUp.kind, `${label} followUp.kind`);
  assert.equal(a.report.kind, b.report.kind, `${label} report.kind`);
  assert.equal(a.notice.kind, b.notice.kind, `${label} notice.kind`);
  assert.equal(a.completedCount, b.completedCount, `${label} completedCount`);
  assert.equal(a.totalCount, b.totalCount, `${label} totalCount`);
  assert.equal(a.progressPercent, b.progressPercent, `${label} progressPercent`);
  assert.equal(a.nextAction.code, b.nextAction.code, `${label} nextAction.code`);
  assert.equal(
    Math.round((a.completedCount / a.totalCount) * 100),
    a.progressPercent,
    `${label} X/Y ↔ %`,
  );
}

/** Fixture MOREL (audit production — formes métier, pas d’IDs secrets). */
const morelInput = {
  projectId: "cmu9n5t3h000913zs15n2qzjc",
  title: "Construction maison — MOREL",
  siteAddress: "3 rue de la Liberté",
  siteCity: "Guyancourt",
  chantierStatus: "ETUDE" as const,
  hasResponsible: false,
  visits: [
    {
      id: "v-morel",
      status: "READY_TO_QUOTE",
      projectId: "cmu9n5t3h000913zs15n2qzjc",
      commercialQuoteId: null,
      siteAddress: "3 rue de la Liberté",
      subject: "Visite MOREL",
      clientNeed: null,
    },
  ],
  studies: [
    {
      id: "study-morel",
      scopeId: null,
      dossierStatus: "PRO_A_VALIDER",
      lineCount: 32,
      version: 4,
      sourcesJson: [],
    },
  ],
  scopes: [
    {
      id: "scope-morel",
      referenceStudyId: "study-morel",
      referenceQuoteId: "q-morel",
      referenceSchedulePlanId: "plan-morel",
    },
  ],
  quotes: [
    {
      id: "q-morel",
      status: "VALIDATED",
      isDemonstration: false,
      projectId: "cmu9n5t3h000913zs15n2qzjc",
      sourcePrepStudyId: "study-morel",
      subject: "Devis MOREL",
    },
  ],
  plans: [
    {
      id: "plan-morel",
      studyId: "study-morel",
      scopeId: "scope-morel",
      status: "CURRENT",
      revisionKind: "BASE",
      studyVersionAtGeneration: 1,
      startDateLabel: "12 oct.",
    },
  ],
  followUps: [
    {
      id: "fu-morel",
      status: "INTERVENTION_PREVUE",
      title: "Suivi MOREL",
    },
  ],
  reports: [] as Array<{ id: string; kind: string; status: string }>,
  notices: [] as Array<{ id: string; kind: string; status: string }>,
  quoteSyncByQuoteId: {
    "q-morel": {
      quoteId: "q-morel",
      hasMetreProvenance: true,
      currentStudyVersion: 4,
      transferStudyVersion: 1,
    },
  },
  studyVersionById: { "study-morel": 4 },
};

const portfolio = computeProjectPreparationState(morelInput);
const workspace = computeProjectPreparationState(morelInput);
assertSameState(portfolio, workspace, "MOREL");

assert.equal(portfolio.visit.kind, "READY");
assert.equal(portfolio.visit.countsAsCompleted, true);
assert.equal(portfolio.takeoff.kind, "NEEDS_VALIDATION");
assert.equal(portfolio.takeoff.countsAsCompleted, false);
assert.equal(portfolio.quote.kind, "NEEDS_REVALIDATION");
assert.equal(portfolio.core.devis.syncState, "MODIFICATION_DISPONIBLE");
assert.equal(portfolio.quote.countsAsCompleted, false);
assert.equal(portfolio.planning.kind, "ACTION_REQUIRED");
assert.equal(portfolio.core.planning.syncState, "MODIFICATION_DISPONIBLE");
assert.equal(portfolio.planning.countsAsCompleted, false);
assert.equal(portfolio.followUp.kind, "READY");
assert.equal(portfolio.followUp.countsAsCompleted, true);
assert.equal(portfolio.report.kind, "ABSENT");
assert.equal(portfolio.notice.kind, "ABSENT");
assert.equal(portfolio.completedCount, 2);
assert.equal(portfolio.totalCount, 7);
assert.equal(portfolio.progressPercent, 29);
assert.equal(portfolio.nextAction.code, "ASSIGN_MANAGER");
assert.equal(portfolio.nextAction.label, "Affecter un responsable");
assert.equal(portfolio.nextAction.reason, "PROJECT_MANAGER_MISSING");

const snap = buildPreparationSnapshot(morelInput);
assert.equal(snap.nextActionCode, "ASSIGN_MANAGER");
assert.equal(snap.progressPercent, 29);
assert.equal(snap.completedCount, 2);
assert.equal(snap.modules.find((m) => m.key === "metre")?.stateLabel.includes("À valider"), true);
assert.equal(snap.modules.find((m) => m.key === "devis")?.stateLabel.includes("revalid"), true);
assert.equal(
  snap.modules.find((m) => m.key === "planning")?.stateLabel.includes("Modification"),
  true,
);

/** C-01 : stale devis + planning, sans visite/suivi. */
const c01Input = {
  projectId: "p-c01",
  title: "C-01",
  hasResponsible: true,
  visits: [],
  studies: [
    {
      id: "study-c01",
      scopeId: "sc1",
      dossierStatus: "DEMONSTRATION",
      lineCount: 32,
      version: 4,
      sourcesJson: [
        { chantierFileId: "f1", filename: "plan.pdf", planNumber: "C-01" },
      ],
    },
  ],
  scopes: [
    {
      id: "sc1",
      referenceStudyId: "study-c01",
      referenceQuoteId: "q-c01",
      referenceSchedulePlanId: "plan-c01",
    },
  ],
  quotes: [
    {
      id: "q-c01",
      status: "VALIDATED",
      isDemonstration: true,
      projectId: "p-c01",
      sourcePrepStudyId: "study-c01",
      subject: "Devis C-01",
    },
  ],
  plans: [
    {
      id: "plan-c01",
      studyId: "study-c01",
      scopeId: "sc1",
      status: "CURRENT",
      revisionKind: "BASE",
      studyVersionAtGeneration: 3,
      startDateLabel: "1 oct.",
    },
  ],
  followUps: [],
  reports: [],
  notices: [],
  quoteSyncByQuoteId: {
    "q-c01": {
      quoteId: "q-c01",
      hasMetreProvenance: true,
      currentStudyVersion: 4,
      transferStudyVersion: 3,
    },
  },
  studyVersionById: { "study-c01": 4 },
};

const c01a = computeProjectPreparationState(c01Input);
const c01b = computeProjectPreparationState(c01Input);
assertSameState(c01a, c01b, "C-01");
assert.equal(c01a.quote.kind, "NEEDS_REVALIDATION");
assert.equal(c01a.planning.kind, "ACTION_REQUIRED");
assert.equal(c01a.visit.kind, "NOT_APPLICABLE");
assert.equal(c01a.takeoff.kind, "DONE"); // DEMONSTRATION = validé
assert.equal(c01a.completedCount, 1); // takeoff only (visit N/A)
assert.equal(c01a.totalCount, 6); // 7 - visit NA
assert.equal(c01a.nextAction.code, "REVALIDATE_QUOTE");

/** Projet à jour — versions alignées, pas d’alerte artificielle. */
const synced = computeProjectPreparationState({
  projectId: "p-ok",
  title: "Projet à jour",
  hasResponsible: true,
  visits: [
    {
      id: "v-ok",
      status: "READY_TO_QUOTE",
      projectId: "p-ok",
      commercialQuoteId: null,
      siteAddress: null,
      subject: null,
      clientNeed: null,
    },
  ],
  studies: [
    {
      id: "s-ok",
      scopeId: null,
      dossierStatus: "PRO_VALIDE",
      lineCount: 10,
      version: 2,
      sourcesJson: [],
    },
  ],
  scopes: [
    {
      id: "sc-ok",
      referenceStudyId: "s-ok",
      referenceQuoteId: "q-ok",
      referenceSchedulePlanId: "pl-ok",
    },
  ],
  quotes: [
    {
      id: "q-ok",
      status: "VALIDATED",
      isDemonstration: false,
      projectId: "p-ok",
      sourcePrepStudyId: "s-ok",
      subject: "OK",
    },
  ],
  plans: [
    {
      id: "pl-ok",
      studyId: "s-ok",
      scopeId: "sc-ok",
      status: "CURRENT",
      revisionKind: "BASE",
      studyVersionAtGeneration: 2,
      startDateLabel: "5 nov.",
    },
  ],
  followUps: [{ id: "fu", status: "INTERVENTION_PREVUE", title: "Suivi" }],
  reports: [
    { id: "r1", kind: "COMPTE_RENDU", status: "FINALIZED", number: "CR-1", title: "CR" },
  ],
  notices: [
    { id: "n1", kind: "NOTICE", status: "FINALIZED", number: "N-1", title: "Notice" },
  ],
  quoteSyncByQuoteId: {
    "q-ok": {
      quoteId: "q-ok",
      hasMetreProvenance: true,
      currentStudyVersion: 2,
      transferStudyVersion: 2,
    },
  },
  studyVersionById: { "s-ok": 2 },
});

assert.equal(synced.quote.kind, "DONE");
assert.equal(synced.planning.kind, "DONE");
assert.equal(synced.core.devis.syncState, "A_JOUR");
assert.equal(synced.core.planning.syncState, "A_JOUR");
assert.equal(synced.completedCount, 7);
assert.equal(synced.progressPercent, 100);
assert.equal(synced.nextAction.code, "CONTINUE_FOLLOW_UP");

/** Projet vide — ne plante pas. */
const empty = computeProjectPreparationState({
  projectId: "p-empty",
  hasResponsible: true,
  visits: [],
  studies: [],
  scopes: [],
  quotes: [],
  plans: [],
});
assert.equal(empty.visit.kind, "ABSENT");
assert.equal(empty.takeoff.kind, "ABSENT");
assert.equal(empty.completedCount, 0);
assert.equal(empty.progressPercent, 0);
assert.equal(empty.nextAction.code, "PREPARE_TAKEOFF");

/** Priorité responsable > métré. */
const withMgr = computeProjectNextAction({
  state: { ...portfolio, hasResponsible: true },
  projectId: portfolio.projectId,
});
assert.equal(withMgr.code, "VALIDATE_TAKEOFF");

// --- FOLLOW_UP matrix ---
{
  const base = {
    projectId: "p-fu",
    hasResponsible: true,
    visits: [] as never[],
    studies: [] as never[],
    scopes: [] as never[],
    quotes: [] as never[],
    plans: [] as never[],
  };
  const absent = computeProjectPreparationState(base);
  assert.equal(absent.followUp.kind, "ABSENT");
  assert.equal(absent.followUp.countsAsCompleted, false);

  const intervention = computeProjectPreparationState({
    ...base,
    followUps: [{ id: "1", status: "INTERVENTION_PREVUE", title: "S" }],
  });
  assert.equal(intervention.followUp.kind, "READY");
  assert.equal(intervention.followUp.countsAsCompleted, true);
  assert.equal(intervention.followUp.displayLabel, "Intervention prévue");

  const nouveau = computeProjectPreparationState({
    ...base,
    followUps: [{ id: "2", status: "NOUVEAU", title: "S" }],
  });
  assert.equal(nouveau.followUp.countsAsCompleted, true);

  const archive = computeProjectPreparationState({
    ...base,
    followUps: [{ id: "3", status: "ARCHIVE", title: "S" }],
  });
  assert.equal(archive.followUp.kind, "NOT_APPLICABLE");
  assert.equal(archive.followUp.countsAsCompleted, false);
  assert.equal(archive.followUp.applicable, false);
}

// --- REPORT / NOTICE matrix ---
{
  const base = {
    projectId: "p-docs",
    hasResponsible: true,
    visits: [] as never[],
    studies: [] as never[],
    scopes: [] as never[],
    quotes: [] as never[],
    plans: [] as never[],
  };
  const empty = computeProjectPreparationState(base);
  assert.equal(empty.report.kind, "ABSENT");
  assert.equal(empty.notice.kind, "ABSENT");
  assert.equal(empty.report.countsAsCompleted, false);
  assert.equal(empty.notice.countsAsCompleted, false);

  const draft = computeProjectPreparationState({
    ...base,
    reports: [{ id: "r", kind: "COMPTE_RENDU", status: "DRAFT" }],
    notices: [{ id: "n", kind: "NOTICE", status: "DRAFT" }],
  });
  assert.equal(draft.report.kind, "IN_PROGRESS");
  assert.equal(draft.report.countsAsCompleted, false);
  assert.equal(draft.notice.kind, "IN_PROGRESS");
  assert.equal(draft.notice.countsAsCompleted, false);

  const final = computeProjectPreparationState({
    ...base,
    reports: [{ id: "r", kind: "COMPTE_RENDU", status: "FINALIZED" }],
    notices: [{ id: "n", kind: "NOTICE", status: "FINALIZED" }],
  });
  assert.equal(final.report.kind, "DONE");
  assert.equal(final.report.countsAsCompleted, true);
  assert.equal(final.notice.kind, "DONE");
  assert.equal(final.notice.countsAsCompleted, true);
}

// --- Devis DRAFT + stale : statut commercial conservé, blocking = revalidation ---
{
  const draftStale = evaluateQuoteCoreState({
    quote: { status: "DRAFT" },
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 1,
  });
  assert.equal(draftStale.commercialStatus, "DRAFT");
  assert.equal(draftStale.syncState, "MODIFICATION_DISPONIBLE");
  assert.equal(draftStale.displayLabel, "Brouillon · à revalider");
  assert.equal(draftStale.needsRevalidation, true);
}

console.log("project-preparation-state concordance OK");
console.log(
  JSON.stringify(
    {
      morel: {
        completedCount: portfolio.completedCount,
        totalCount: portfolio.totalCount,
        progressPercent: portfolio.progressPercent,
        nextAction: portfolio.nextAction,
        steps: portfolio.steps.map((s) => ({
          id: s.id,
          kind: s.kind,
          completed: s.countsAsCompleted,
          label: s.displayLabel,
        })),
      },
      c01: {
        completedCount: c01a.completedCount,
        totalCount: c01a.totalCount,
        progressPercent: c01a.progressPercent,
        nextAction: c01a.nextAction,
      },
    },
    null,
    2,
  ),
);
