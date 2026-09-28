/**
 * Tests unitaires pure — résolution workspace (sans DB, sans mutation).
 * Usage: npx tsx src/lib/chantier/resolve-workspace-entities.test.ts
 */
import assert from "node:assert/strict";
import {
  extractVisitSearchBits,
  pickSuggestedVisitId,
  resolvePrepSchedulePlanForWorkspace,
  resolvePrepStudyForWorkspace,
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
        },
        {
          id: "cur",
          studyId: "s1",
          scopeId: null,
          status: "CURRENT",
          revisionKind: "CURRENT",
        },
      ],
    });
    assert.equal(plan?.id, "cur");
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
