/**
 * Tests unitaires pure — résolution workspace (sans DB, sans mutation).
 * Usage: npx tsx src/lib/chantier/resolve-workspace-entities.test.ts
 */
import assert from "node:assert/strict";
import {
  extractVisitSearchBits,
  pickSuggestedVisitId,
  resolveCurrentSchedulePlan,
  resolvePrepSchedulePlanForWorkspace,
  resolvePrepStudyForWorkspace,
  resolveSchedulePlanForScope,
  workspaceOpenOrGenerateLabel,
} from "./resolve-workspace-entities";

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

  // CAS B — study scopé seulement → visible via referenceStudyId
  {
    const study = resolvePrepStudyForWorkspace({
      studies: [{ id: "s1", scopeId: "scope-a", sourcesJson: null }],
      scopes: [
        {
          id: "scope-a",
          referenceStudyId: "s1",
          referenceQuoteId: null,
          referenceSchedulePlanId: null,
        },
      ],
    });
    assert.equal(study?.id, "s1");
  }

  // CAS B bis — study scopé unique sans référence explicite
  {
    const study = resolvePrepStudyForWorkspace({
      studies: [{ id: "only", scopeId: "scope-x", sourcesJson: null }],
      scopes: [
        {
          id: "scope-x",
          referenceStudyId: null,
          referenceQuoteId: null,
          referenceSchedulePlanId: null,
        },
      ],
    });
    assert.equal(study?.id, "only");
  }

  // Planning lié au study scopé
  {
    const study = { id: "s1", scopeId: "sc1", sourcesJson: null };
    const plan = resolvePrepSchedulePlanForWorkspace({
      study,
      scopes: [
        {
          id: "sc1",
          referenceStudyId: "s1",
          referenceQuoteId: null,
          referenceSchedulePlanId: "p1",
        },
      ],
      plans: [
        {
          id: "p1",
          studyId: "s1",
          scopeId: "sc1",
          status: "INITIAL",
          revisionKind: "INITIAL",
        },
      ],
    });
    assert.equal(plan?.id, "p1");
  }

  // Planning global CURRENT préféré
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

  // C-01 — referenceSchedulePlanId stale ARCHIVED ne gagne pas face au CURRENT
  {
    const OLD = "cmui103dx0002scx8q99joufl";
    const CUR = "cmus2gpmm003ivfsmad3hafw2";
    const scope = {
      id: "cmui2yaj20001dli4kof4j59b",
      referenceStudyId: "cmuh6cy4c000y1423lqo85g5v",
      referenceQuoteId: null as string | null,
      referenceSchedulePlanId: OLD,
    };
    const plans = [
      {
        id: OLD,
        studyId: "cmuh6cy4c000y1423lqo85g5v",
        scopeId: scope.id,
        status: "ARCHIVED",
        revisionKind: "INITIAL",
        revisionNumber: 1,
        createdAt: "2026-09-26T06:45:55.365Z",
      },
      {
        id: CUR,
        studyId: "cmuh6cy4c000y1423lqo85g5v",
        scopeId: null,
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 2,
        createdAt: "2026-10-03T07:24:32.063Z",
      },
      {
        id: "cmus2eon7002nvfsm6m44h2y2",
        studyId: "cmuh6cy4c000y1423lqo85g5v",
        scopeId: null,
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 2,
        createdAt: "2026-10-03T07:22:57.475Z",
      },
    ];
    const forScope = resolveSchedulePlanForScope({
      plans,
      scope,
      studyId: "cmuh6cy4c000y1423lqo85g5v",
    });
    assert.equal(forScope?.id, CUR, "carte lot → CURRENT le plus récent");

    const forWorkspace = resolvePrepSchedulePlanForWorkspace({
      study: { id: "cmuh6cy4c000y1423lqo85g5v", scopeId: null },
      scopes: [scope],
      plans,
    });
    assert.equal(forWorkspace?.id, CUR, "chaîne chantier → CURRENT");

    // Tie-break createdAt parmi plusieurs CURRENT rev 2
    const best = resolveCurrentSchedulePlan(plans);
    assert.equal(best?.id, CUR);
  }

  // referenceSchedulePlanId active encore utilisable s’il n’y a pas de meilleur CURRENT
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
    assert.equal(plan?.id, "p-ref");
  }

  // Plusieurs scopes — referenceStudyId gagne
  {
    const study = resolvePrepStudyForWorkspace({
      studies: [
        { id: "s-fond", scopeId: "sc1" },
        { id: "s-elec", scopeId: "sc2" },
      ],
      scopes: [
        {
          id: "sc1",
          referenceStudyId: "s-fond",
          referenceQuoteId: null,
          referenceSchedulePlanId: null,
        },
        {
          id: "sc2",
          referenceStudyId: "s-elec",
          referenceQuoteId: null,
          referenceSchedulePlanId: null,
        },
      ],
    });
    assert.equal(study?.id, "s-fond");
  }

  // Visite : pas de hardcode cuisine / C-01
  {
    const bits = extractVisitSearchBits({
      title: "DÉMO — Construction maison individuelle C-01",
      siteAddress: "4 rue de la pomelle",
      siteCity: "Massy",
    });
    assert.ok(!bits.includes("cuisine"));
    assert.ok(bits.includes("pomelle") || bits.includes("massy") || bits.includes("c-01") || bits.some((b) => b.includes("01")));
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

  // Visite : match fort sur adresse
  {
    const suggested = pickSuggestedVisitId({
      searchBits: ["pomelle", "massy"],
      candidates: [
        {
          id: "v1",
          subject: "Visite fondations",
          siteAddress: "4 rue de la pomelle Massy",
        },
      ],
    });
    assert.equal(suggested, "v1");
  }

  // Ouvrir vs Générer
  assert.equal(workspaceOpenOrGenerateLabel(true, "Générer le métré"), "Ouvrir");
  assert.equal(
    workspaceOpenOrGenerateLabel(false, "Générer le métré"),
    "Générer le métré",
  );

  // Aucune création implicite : pas de study → null
  {
    const study = resolvePrepStudyForWorkspace({ studies: [], scopes: [] });
    assert.equal(study, null);
  }

  console.log("OK resolve-workspace-entities.test.ts");
}

run();
