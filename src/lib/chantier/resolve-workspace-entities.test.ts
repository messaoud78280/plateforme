/**
 * Tests unitaires pure — résolution CURRENT planning (Phases 1–2).
 * Usage: npx tsx src/lib/chantier/resolve-workspace-entities.test.ts
 *        npm run test:current-plan-resolution
 */
import assert from "node:assert/strict";
import {
  extractVisitSearchBits,
  pickSuggestedVisitId,
  resolveCurrentPrepStudy,
  resolveCurrentSchedulePlan,
  resolveCurrentSchedulePlanForStudy,
  resolvePrepSchedulePlanForWorkspace,
  resolvePrepStudyForWorkspace,
  resolveSchedulePlanForScope,
  workspaceOpenOrGenerateLabel,
} from "./resolve-workspace-entities";
import {
  selectPlanForVersionSnapshot,
} from "@/lib/bework-patch/commit/fingerprint";
import type { ImpactPlan } from "@/lib/bework-patch/impact/types";

type P = {
  id: string;
  studyId: string;
  scopeId: string | null;
  status: string;
  revisionKind: string;
  revisionNumber?: number;
  createdAt?: string;
};

function run() {
  // CAS A — study global scopeId null
  {
    const study = resolvePrepStudyForWorkspace({
      studies: [
        { id: "g1", scopeId: null, sourcesJson: { kind: "bework_global_metre_v1" } },
        { id: "s1", scopeId: "scope-a", sourcesJson: null },
      ],
      scopes: [{ id: "scope-a", referenceStudyId: "s1", referenceQuoteId: null, referenceSchedulePlanId: null }],
    });
    assert.equal(study?.id, "g1");
  }

  // TEST 1 — CURRENT rev2 + INITIAL rev1 → CURRENT
  {
    const best = resolveCurrentSchedulePlan([
      {
        id: "init",
        studyId: "s1",
        scopeId: "sc1",
        status: "INITIAL",
        revisionKind: "INITIAL",
        revisionNumber: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "cur",
        studyId: "s1",
        scopeId: "sc1",
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 2,
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    ] satisfies P[]);
    assert.equal(best?.id, "cur", "TEST 1");
  }

  // TEST 2 — CURRENT rev2 + ARCHIVED rev3 créé plus tard → CURRENT rev2
  {
    const best = resolveCurrentSchedulePlan([
      {
        id: "cur",
        studyId: "s1",
        scopeId: "sc1",
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 2,
        createdAt: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "arch",
        studyId: "s1",
        scopeId: "sc1",
        status: "ARCHIVED",
        revisionKind: "CURRENT",
        revisionNumber: 3,
        createdAt: "2026-01-03T00:00:00.000Z",
      },
    ] satisfies P[]);
    assert.equal(best?.id, "cur", "TEST 2");
  }

  // TEST 3 — ref scope ARCHIVED + CURRENT actif → CURRENT gagne
  {
    const scope = {
      id: "sc1",
      referenceStudyId: "s1",
      referenceQuoteId: null as string | null,
      referenceSchedulePlanId: "old-arch",
    };
    const plans: P[] = [
      {
        id: "old-arch",
        studyId: "s1",
        scopeId: "sc1",
        status: "ARCHIVED",
        revisionKind: "INITIAL",
        revisionNumber: 1,
      },
      {
        id: "cur-scoped",
        studyId: "s1",
        scopeId: "sc1",
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 2,
      },
    ];
    const forScope = resolveSchedulePlanForScope({
      plans,
      scope,
      studyId: "s1",
    });
    assert.equal(forScope?.id, "cur-scoped", "TEST 3");
  }

  // TEST 4 — scope Fondations CURRENT + global CURRENT → scope gagne
  {
    const scope = {
      id: "fondations",
      referenceStudyId: "s1",
      referenceQuoteId: null as string | null,
      referenceSchedulePlanId: null as string | null,
    };
    const plans: P[] = [
      {
        id: "global-cur",
        studyId: "s1",
        scopeId: null,
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 5,
        createdAt: "2026-02-01T00:00:00.000Z",
      },
      {
        id: "fond-cur",
        studyId: "s1",
        scopeId: "fondations",
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 2,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    const forScope = resolveSchedulePlanForScope({
      plans,
      scope,
      studyId: "s1",
    });
    assert.equal(forScope?.id, "fond-cur", "TEST 4 — pas de fallback global silencieux");
  }

  // TEST 5 — scope A / scope B — aucune contamination
  {
    const scopeA = {
      id: "sc-a",
      referenceStudyId: "s-a",
      referenceQuoteId: null as string | null,
      referenceSchedulePlanId: null as string | null,
    };
    const plans: P[] = [
      {
        id: "plan-a",
        studyId: "s-a",
        scopeId: "sc-a",
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 1,
      },
      {
        id: "plan-b",
        studyId: "s-b",
        scopeId: "sc-b",
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 9,
      },
    ];
    const a = resolveSchedulePlanForScope({
      plans,
      scope: scopeA,
      studyId: "s-a",
    });
    assert.equal(a?.id, "plan-a", "TEST 5a");
    const b = resolveSchedulePlanForScope({
      plans,
      scope: {
        id: "sc-b",
        referenceStudyId: "s-b",
        referenceQuoteId: null,
        referenceSchedulePlanId: null,
      },
      studyId: "s-b",
    });
    assert.equal(b?.id, "plan-b", "TEST 5b");
    assert.notEqual(a?.id, b?.id);
  }

  // TEST 6 — deux CURRENT historiques → plus haute revisionNumber ; createdAt tie-break
  {
    const byRev = resolveCurrentSchedulePlan([
      {
        id: "r1",
        studyId: "s1",
        scopeId: null,
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 1,
        createdAt: "2026-03-01T00:00:00.000Z",
      },
      {
        id: "r2",
        studyId: "s1",
        scopeId: null,
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 2,
        createdAt: "2026-02-01T00:00:00.000Z",
      },
    ] satisfies P[]);
    assert.equal(byRev?.id, "r2", "TEST 6 rev");

    const byDate = resolveCurrentSchedulePlan([
      {
        id: "older",
        studyId: "s1",
        scopeId: null,
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 2,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "newer",
        studyId: "s1",
        scopeId: null,
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 2,
        createdAt: "2026-02-01T00:00:00.000Z",
      },
    ] satisfies P[]);
    assert.equal(byDate?.id, "newer", "TEST 6 tie-break createdAt");
  }

  // TEST 7 — ordre lexical status n’influence pas (INITIAL > CURRENT alphabétiquement)
  {
    // Simule l’ancien bug orderBy status desc : "INITIAL" > "CURRENT"
    const lexicalWouldPickInitial =
      "INITIAL".localeCompare("CURRENT") > 0 ? "initial" : "current";
    assert.equal(lexicalWouldPickInitial, "initial", "précondition lexical");

    const best = resolveCurrentSchedulePlan([
      {
        id: "initial",
        studyId: "s1",
        scopeId: null,
        status: "INITIAL",
        revisionKind: "INITIAL",
        revisionNumber: 1,
        createdAt: "2026-06-01T00:00:00.000Z",
      },
      {
        id: "current",
        studyId: "s1",
        scopeId: null,
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ] satisfies P[]);
    assert.equal(best?.id, "current", "TEST 7 — ranking métier, pas lexical");
  }

  // TEST 8 / 9 — fingerprint / selectPlan cible origin.entity_id (pas plans[0] createdAt)
  {
    const plans: ImpactPlan[] = [
      {
        id: "newest-created",
        title: "A",
        startDate: null,
        endDateBase: null,
        baseDurationWorkingDays: null,
        revisionNumber: 1,
        studyVersionAtGeneration: 1,
        tasks: [],
        takeoffLinks: [],
      },
      {
        id: "targeted",
        title: "B",
        startDate: null,
        endDateBase: null,
        baseDurationWorkingDays: null,
        revisionNumber: 2,
        studyVersionAtGeneration: 4,
        tasks: [],
        takeoffLinks: [],
      },
    ];
    const hit = selectPlanForVersionSnapshot(plans, "targeted");
    assert.equal(hit?.id, "targeted", "TEST 8/9 preferredPlanId");
    const byRev = selectPlanForVersionSnapshot(plans, null);
    assert.equal(byRev?.id, "targeted", "TEST 9 fallback max revision");
  }

  // TEST 10 — ARCHIVED deep-link consultable ; jamais navigation default
  {
    const plans: P[] = [
      {
        id: "arch",
        studyId: "s1",
        scopeId: "sc1",
        status: "ARCHIVED",
        revisionKind: "INITIAL",
        revisionNumber: 1,
      },
      {
        id: "cur",
        studyId: "s1",
        scopeId: "sc1",
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 2,
      },
    ];
    assert.equal(resolveCurrentSchedulePlan(plans)?.id, "cur", "TEST 10 default");
    // Deep-link : l’id ARCHIVED reste adressable (pas de rewrite ici).
    assert.ok(plans.some((p) => p.id === "arch" && p.status === "ARCHIVED"));
  }

  // Scope sans plan scopé + ref stale + global existant → null (pas de fallback silencieux)
  {
    const forScope = resolveSchedulePlanForScope({
      studyId: "s1",
      scope: {
        id: "sc1",
        referenceStudyId: "s1",
        referenceQuoteId: null,
        referenceSchedulePlanId: "old",
      },
      plans: [
        {
          id: "old",
          studyId: "s1",
          scopeId: "sc1",
          status: "ARCHIVED",
          revisionKind: "INITIAL",
          revisionNumber: 1,
        },
        {
          id: "global-cur",
          studyId: "s1",
          scopeId: null,
          status: "CURRENT",
          revisionKind: "CURRENT",
          revisionNumber: 2,
        },
      ],
    });
    assert.equal(forScope, null, "pas de global silencieux");

    const withFallback = resolveSchedulePlanForScope({
      studyId: "s1",
      allowGlobalFallback: true,
      scope: {
        id: "sc1",
        referenceStudyId: "s1",
        referenceQuoteId: null,
        referenceSchedulePlanId: "old",
      },
      plans: [
        {
          id: "old",
          studyId: "s1",
          scopeId: "sc1",
          status: "ARCHIVED",
          revisionKind: "INITIAL",
          revisionNumber: 1,
        },
        {
          id: "global-cur",
          studyId: "s1",
          scopeId: null,
          status: "CURRENT",
          revisionKind: "CURRENT",
          revisionNumber: 2,
        },
      ],
    });
    assert.equal(withFallback?.id, "global-cur", "fallback global explicite");
  }

  // Workspace global préfère scopeId null
  {
    const plan = resolvePrepSchedulePlanForWorkspace({
      study: { id: "s1", scopeId: null },
      scopes: [],
      plans: [
        {
          id: "old",
          studyId: "s1",
          scopeId: null,
          status: "ARCHIVED",
          revisionKind: "CURRENT",
          revisionNumber: 1,
        },
        {
          id: "cur",
          studyId: "s1",
          scopeId: null,
          status: "CURRENT",
          revisionKind: "CURRENT",
          revisionNumber: 2,
        },
      ],
    });
    assert.equal(plan?.id, "cur");
  }

  // resolveCurrentSchedulePlanForStudy
  {
    const hit = resolveCurrentSchedulePlanForStudy({
      studyId: "s1",
      plans: [
        {
          id: "other",
          studyId: "s2",
          scopeId: null,
          status: "CURRENT",
          revisionKind: "CURRENT",
          revisionNumber: 99,
        },
        {
          id: "mine",
          studyId: "s1",
          scopeId: null,
          status: "CURRENT",
          revisionKind: "CURRENT",
          revisionNumber: 1,
        },
      ],
    });
    assert.equal(hit?.id, "mine");
  }

  // reference active encore utilisable s’il n’y a pas de meilleur CURRENT scopé
  {
    const plan = resolveSchedulePlanForScope({
      studyId: "s1",
      scope: {
        id: "sc1",
        referenceStudyId: "s1",
        referenceQuoteId: null,
        referenceSchedulePlanId: "p-ref",
      },
      plans: [
        {
          id: "p-ref",
          studyId: "s1",
          scopeId: "sc1",
          status: "INITIAL",
          revisionKind: "INITIAL",
          revisionNumber: 1,
        },
      ],
    });
    // INITIAL scopé = seul actif → gagné via step 1 (resolveCurrent sur scoped)
    assert.equal(plan?.id, "p-ref");
  }

  // Visite helpers inchangés
  {
    const bits = extractVisitSearchBits({
      title: "DÉMO — Construction maison individuelle C-01",
      siteAddress: "4 rue de la pomelle",
      siteCity: "Massy",
    });
    assert.ok(!bits.includes("cuisine"));
    const suggested = pickSuggestedVisitId({
      searchBits: bits,
      candidates: [
        {
          id: "cuisine-visit",
          subject: "rénovation cuisine salle de bain",
          clientNeed: "cuisine",
        },
      ],
    });
    assert.equal(suggested, null);
  }

  assert.equal(workspaceOpenOrGenerateLabel(true, "Générer"), "Ouvrir");
  assert.equal(
    resolvePrepStudyForWorkspace({ studies: [], scopes: [] }),
    null,
  );

  // --- resolveCurrentPrepStudy — CURRENT vs ARCHIVED / scope stale ---
  {
    // A — aucun métré
    assert.equal(
      resolveCurrentPrepStudy({ studies: [], scopes: [] }),
      null,
      "A aucun métré",
    );

    // B — 1 métré CURRENT v1
    const b = resolveCurrentPrepStudy({
      studies: [
        {
          id: "s1",
          scopeId: null,
          version: 1,
          archivedAt: null,
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      scopes: [],
    });
    assert.equal(b?.study.id, "s1");
    assert.equal(b?.status, "CURRENT");
    assert.equal(b?.isCurrent, true);

    // C — CURRENT v3 + ancien v2 ARCHIVED → v3
    const c = resolveCurrentPrepStudy({
      studies: [
        {
          id: "s-old",
          scopeId: null,
          version: 2,
          archivedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "s-cur",
          scopeId: null,
          version: 3,
          archivedAt: null,
          updatedAt: "2026-02-01T00:00:00.000Z",
        },
      ],
      scopes: [],
    });
    assert.equal(c?.study.id, "s-cur");
    assert.equal(c?.study.version, 3);
    assert.equal(c?.status, "CURRENT");

    // D — ProjectScope référence ancien métré → CURRENT gagne
    const d = resolveCurrentPrepStudy({
      studies: [
        {
          id: "s-stale-ref",
          scopeId: "sc1",
          version: 1,
          archivedAt: null,
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "s-global",
          scopeId: null,
          version: 5,
          archivedAt: null,
          updatedAt: "2026-03-01T00:00:00.000Z",
          sourcesJson: { kind: "bework_global_metre_v1" },
        },
      ],
      scopes: [
        {
          id: "sc1",
          referenceStudyId: "s-stale-ref",
          referenceQuoteId: null,
          referenceSchedulePlanId: null,
        },
      ],
    });
    assert.equal(d?.study.id, "s-global", "D global CURRENT bat référence scope");
    assert.equal(d?.study.version, 5);

    // G — deep-link ARCHIVED
    const g = resolveCurrentPrepStudy({
      studies: [
        {
          id: "s-arch",
          scopeId: null,
          version: 2,
          archivedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "s-cur2",
          scopeId: null,
          version: 4,
          archivedAt: null,
          updatedAt: "2026-04-01T00:00:00.000Z",
        },
      ],
      scopes: [],
      explicitStudyId: "s-arch",
    });
    assert.equal(g?.study.id, "s-arch");
    assert.equal(g?.status, "ARCHIVED");
    assert.equal(g?.isCurrent, false);
  }

  console.log("OK resolve-workspace-entities.test.ts (TESTS 1–10 + scope/global + CURRENT takeoff)");
}

run();
