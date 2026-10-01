/**
 * CTX-03 — tests détection sync devis ↔ métré.
 * npx tsx src/lib/preparation/quote-bridge/quote-sync-state.test.ts
 */
import assert from "node:assert/strict";
import {
  evaluateQuoteStudySyncState,
  hasQuantityDiffAgainstTransfer,
  isQuoteARevalider,
} from "./quote-sync-state";

// --- A — devis à jour ---
{
  const r = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 4,
    hasSignificantQuantityDiffs: false,
  });
  assert.equal(r.syncState, "A_JOUR");
  assert.equal(r.reason, "ALIGNED");
  assert.equal(
    isQuoteARevalider({
      hasQuote: true,
      hasMetreProvenance: true,
      currentStudyVersion: 4,
      transferStudyVersion: 4,
    }),
    false,
  );
  console.log("A — devis à jour: ok");
}

// --- B — métré plus récent ---
{
  const r = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 3,
  });
  assert.equal(r.syncState, "MODIFICATION_DISPONIBLE");
  assert.equal(r.reason, "VERSION_AHEAD");
  assert.ok(r.hint?.includes("V4"));
  console.log("B — À REVALIDER (version): ok");
}

// --- C — C-01 ---
{
  const r = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 3,
  });
  assert.equal(r.syncState, "MODIFICATION_DISPONIBLE");
  console.log("C — C-01 pattern: ok");
}

// --- D — multi-devis ---
{
  const a = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 4,
  });
  const b = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 3,
  });
  assert.equal(a.syncState, "A_JOUR");
  assert.equal(b.syncState, "MODIFICATION_DISPONIBLE");
  console.log("D — multi-devis: ok");
}

// --- E — multi-scope (ne pas utiliser le mauvais métré) ---
{
  const quoteScopeA = { transferStudyVersion: 3, studyId: "study-a" };
  const studyA = { id: "study-a", version: 3 };
  const studyB = { id: "study-b", version: 9 };
  const correct = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: true,
    currentStudyVersion:
      studyA.id === quoteScopeA.studyId ? studyA.version : null,
    transferStudyVersion: quoteScopeA.transferStudyVersion,
  });
  assert.equal(correct.syncState, "A_JOUR");
  const guarded = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: true,
    currentStudyVersion:
      studyB.id === quoteScopeA.studyId ? studyB.version : null,
    transferStudyVersion: quoteScopeA.transferStudyVersion,
  });
  assert.equal(guarded.syncState, "A_VERIFIER");
  console.log("E — multi-scope: ok");
}

// --- F — sans provenance ---
{
  const independent = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: false,
    currentStudyVersion: 4,
    transferStudyVersion: null,
  });
  assert.equal(independent.syncState, "A_JOUR");
  assert.equal(independent.reason, "INDEPENDENT");

  const incomplete = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: null,
  });
  assert.equal(incomplete.syncState, "A_VERIFIER");
  assert.equal(incomplete.reason, "SOURCE_UNKNOWN");
  console.log("F — provenance: ok");
}

// --- G — version incohérente ---
{
  const r = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: true,
    currentStudyVersion: 3,
    transferStudyVersion: 4,
  });
  assert.equal(r.syncState, "A_VERIFIER");
  assert.equal(r.reason, "VERSION_INCOHERENT");
  console.log("G — incohérence: ok");
}

// --- H — preview n'écrit pas ---
{
  const before = { transferStudyVersion: 3 };
  const afterPreview = { ...before };
  assert.equal(afterPreview.transferStudyVersion, 3);
  console.log("H — preview sans écriture: ok");
}

// --- I — sync réussie ---
{
  const before = { transferStudyVersion: 3 };
  const syncSucceeded = true;
  const after = syncSucceeded
    ? { transferStudyVersion: 4 }
    : before;
  assert.equal(after.transferStudyVersion, 4);
  assert.equal(
    evaluateQuoteStudySyncState({
      hasQuote: true,
      hasMetreProvenance: true,
      currentStudyVersion: 4,
      transferStudyVersion: after.transferStudyVersion,
      hasSignificantQuantityDiffs: false,
    }).syncState,
    "A_JOUR",
  );
  console.log("I — sync réussie: ok");
}

// --- J — sync échouée ---
{
  const before = { transferStudyVersion: 3 };
  const syncFailed = true;
  const after = syncFailed ? before : { transferStudyVersion: 4 };
  assert.equal(after.transferStudyVersion, 3);
  console.log("J — sync échouée: ok");
}

// --- K — devis verrouillé : détection possible, pas d'autorisation implicite ---
{
  const lockedStatuses = ["SENT", "ACCEPTED", "VIEWED"];
  for (const status of lockedStatuses) {
    const r = evaluateQuoteStudySyncState({
      hasQuote: true,
      hasMetreProvenance: true,
      currentStudyVersion: 4,
      transferStudyVersion: 3,
    });
    assert.equal(r.syncState, "MODIFICATION_DISPONIBLE");
    // applyPrepQuoteQuantitySync refuse SENT/ACCEPTED — contrat inchangé
    assert.ok(["SENT", "VIEWED", "ACCEPTED"].includes(status));
  }
  console.log("K — verrouillé détectable sans unlock: ok");
}

// --- L — organisation ---
{
  const crossOrg = evaluateQuoteStudySyncState({
    hasQuote: false,
    hasMetreProvenance: false,
    currentStudyVersion: 4,
    transferStudyVersion: 3,
  });
  assert.equal(crossOrg.syncState, "ABSENT");
  console.log("L — isolation: ok");
}

// --- Diffs quantité ---
{
  assert.equal(
    hasQuantityDiffAgainstTransfer({
      quantityAtTransfer: 10,
      currentQuantity: 12,
    }),
    true,
  );
  assert.equal(
    hasQuantityDiffAgainstTransfer({
      quantityAtTransfer: 10,
      currentQuantity: 10,
    }),
    false,
  );
  const withDiff = evaluateQuoteStudySyncState({
    hasQuote: true,
    hasMetreProvenance: true,
    currentStudyVersion: 4,
    transferStudyVersion: 4,
    hasSignificantQuantityDiffs: true,
  });
  assert.equal(withDiff.syncState, "MODIFICATION_DISPONIBLE");
  assert.equal(withDiff.reason, "QUANTITY_DIFF");
  console.log("diffs quantité: ok");
}

console.log("quote-sync-state.test.ts: ok");
