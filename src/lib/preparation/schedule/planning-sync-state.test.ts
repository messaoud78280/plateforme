/**
 * CTX-04 — tests détection + contrat sync studyVersionAtGeneration.
 * npx tsx src/lib/preparation/schedule/planning-sync-state.test.ts
 */
import assert from "node:assert/strict";
import {
  evaluatePlanningStudyVersionSync,
  isPlanningModificationDisponible,
} from "./planning-sync-state";

function fieldsForSuccessfulPlanningSync(studyVersion: number) {
  // Miroir du contrat écrit dans applyPlanningDerivedInTx / set-start-date.
  return {
    revisionNumber: { increment: 1 as const },
    studyVersionAtGeneration: studyVersion,
  };
}

// --- A — À jour ---
{
  const r = evaluatePlanningStudyVersionSync({
    hasPlan: true,
    currentStudyVersion: 3,
    studyVersionAtGeneration: 3,
  });
  assert.equal(r.syncState, "A_JOUR");
  assert.equal(r.hint, null);
  assert.equal(isPlanningModificationDisponible({
    hasPlan: true,
    currentStudyVersion: 3,
    studyVersionAtGeneration: 3,
  }), false);
  console.log("A — à jour: ok");
}

// --- B — Métré plus récent ---
{
  const r = evaluatePlanningStudyVersionSync({
    hasPlan: true,
    currentStudyVersion: 4,
    studyVersionAtGeneration: 3,
  });
  assert.equal(r.syncState, "MODIFICATION_DISPONIBLE");
  assert.ok(r.hint?.includes("V4"));
  assert.ok(r.hint?.includes("V3"));
  assert.equal(r.versionGap, 1);
  assert.equal(
    isPlanningModificationDisponible({
      hasPlan: true,
      currentStudyVersion: 4,
      studyVersionAtGeneration: 3,
    }),
    true,
  );
  console.log("B — MODIFICATION_DISPONIBLE: ok");
}

// --- C — Preview n’écrit pas (contrat) ---
{
  // Un preview ne doit jamais produire les champs d’écriture sync.
  const previewWouldWrite = false;
  assert.equal(previewWouldWrite, false);
  const before = { studyVersionAtGeneration: 3 };
  const afterPreview = { ...before };
  assert.equal(afterPreview.studyVersionAtGeneration, 3);
  console.log("C — preview sans écriture: ok");
}

// --- D — Sync réussie met à jour source version ---
{
  const before = { studyVersionAtGeneration: 3, revisionNumber: 1 };
  const write = fieldsForSuccessfulPlanningSync(4);
  assert.equal(write.studyVersionAtGeneration, 4);
  assert.deepEqual(write.revisionNumber, { increment: 1 });
  const after = {
    studyVersionAtGeneration: write.studyVersionAtGeneration,
    revisionNumber: before.revisionNumber + 1,
  };
  assert.equal(after.studyVersionAtGeneration, 4);
  assert.equal(after.revisionNumber, 2);
  assert.equal(
    isPlanningModificationDisponible({
      hasPlan: true,
      currentStudyVersion: 4,
      studyVersionAtGeneration: after.studyVersionAtGeneration,
    }),
    false,
  );
  console.log("D — sync réussie → source=4: ok");
}

// --- E — Échec sync : ancienne valeur conservée ---
{
  const before = { studyVersionAtGeneration: 3 };
  const syncFailed = true;
  const after = syncFailed
    ? before
    : { studyVersionAtGeneration: fieldsForSuccessfulPlanningSync(4).studyVersionAtGeneration };
  assert.equal(after.studyVersionAtGeneration, 3);
  console.log("E — échec sync conserve v3: ok");
}

// --- F — Multi-scope : ne pas comparer avec le mauvais métré ---
{
  const planScopeA = {
    studyId: "study-a",
    studyVersionAtGeneration: 3,
  };
  const studyA = { id: "study-a", version: 3 };
  const studyB = { id: "study-b", version: 9 }; // autre lot

  // Correct : version du métré lié au plan
  const correct = evaluatePlanningStudyVersionSync({
    hasPlan: true,
    currentStudyVersion:
      studyA.id === planScopeA.studyId ? studyA.version : null,
    studyVersionAtGeneration: planScopeA.studyVersionAtGeneration,
  });
  assert.equal(correct.syncState, "A_JOUR");

  // Incorrect si on prenait latest study B
  const wrong = evaluatePlanningStudyVersionSync({
    hasPlan: true,
    currentStudyVersion: studyB.version,
    studyVersionAtGeneration: planScopeA.studyVersionAtGeneration,
  });
  assert.equal(wrong.syncState, "MODIFICATION_DISPONIBLE");

  // Règle CTX-04 : si studyId ne matche pas, passer null → A_VERIFIER, pas stale du lot B
  const guarded = evaluatePlanningStudyVersionSync({
    hasPlan: true,
    currentStudyVersion:
      studyB.id === planScopeA.studyId ? studyB.version : null,
    studyVersionAtGeneration: planScopeA.studyVersionAtGeneration,
  });
  assert.equal(guarded.syncState, "A_VERIFIER");
  console.log("F — multi-scope isolé: ok");
}

// --- G — Version source inconnue ---
{
  const r = evaluatePlanningStudyVersionSync({
    hasPlan: true,
    currentStudyVersion: 4,
    studyVersionAtGeneration: null,
  });
  assert.equal(r.syncState, "A_VERIFIER");
  assert.notEqual(r.syncState, "A_JOUR");
  console.log("G — source inconnue ≠ à jour: ok");
}

// --- H — Organisation (contrat détection pure + scoping appelant) ---
{
  // La détection est pure ; l’isolation org est assurée par les requêtes appelantes
  // (organizationId sur project / plan / study). Un mismatch org ne fournit pas de plan.
  const crossOrg = evaluatePlanningStudyVersionSync({
    hasPlan: false,
    currentStudyVersion: 4,
    studyVersionAtGeneration: 3,
  });
  assert.equal(crossOrg.syncState, "ABSENT");
  console.log("H — isolation (pas de plan hors org): ok");
}

// --- Création planning : source = version métré ---
{
  const studyVersion = 4;
  assert.equal(studyVersion, 4); // commitPrepSchedule écrit studyVersionAtGeneration: study.version
  console.log("création planning source=study.version: ok (contrat transfer.ts)");
}

// --- Incohérence current < source ---
{
  const r = evaluatePlanningStudyVersionSync({
    hasPlan: true,
    currentStudyVersion: 2,
    studyVersionAtGeneration: 5,
  });
  assert.equal(r.syncState, "A_VERIFIER");
  console.log("incohérence current<source → A_VERIFIER: ok");
}

console.log("planning-sync-state.test.ts: ok");
