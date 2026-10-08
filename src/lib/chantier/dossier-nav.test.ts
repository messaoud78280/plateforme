/**
 * Tests navigation transversale dossier chantier (A–I, couche snapshot).
 * Exécution : npx tsx src/lib/chantier/dossier-nav.test.ts
 */
import assert from "node:assert/strict";
import {
  buildDossierNavFromWorkspace,
  serializeDossierNavSnapshot,
  type DossierNavSnapshot,
} from "@/lib/chantier/dossier-nav";
import type {
  ChantierWorkflowStep,
  ProjectWorkspace,
  ScopeWorkspace,
  WorkspaceCard,
} from "@/lib/chantier/project-workspace";

function card(
  kind: WorkspaceCard["kind"],
  href: string | null,
  ready = true,
): WorkspaceCard {
  return {
    kind,
    label: kind,
    title: ready ? "Prêt" : "À préparer",
    href,
    detail: ready ? "ok" : null,
    syncState: "ok",
    statusLabel: ready ? "Prêt" : "À préparer",
    actionLabel: ready ? "Ouvrir" : "Préparer",
    ready,
    syncHint: null,
    isReference: false,
  };
}

function step(
  partial: Partial<ChantierWorkflowStep> & Pick<ChantierWorkflowStep, "id">,
): ChantierWorkflowStep {
  return {
    label: partial.id,
    title: partial.ready ? "Prêt" : "À préparer",
    detail: null,
    href: null,
    ready: false,
    actionLabel: "Ouvrir",
    primaryAction: "open",
    ...partial,
  };
}

function workspace(opts: {
  workflow: ChantierWorkflowStep[];
  scopes?: ScopeWorkspace[];
}): ProjectWorkspace {
  return {
    projectId: "proj-1",
    title: "Chantier Test",
    chantierStatus: "ACTIVE",
    href: "/dashboard/projets/proj-1",
    global: {
      metre: card("metre", "/dashboard/visites-metres/etudes/study-g"),
      devis: card("devis", "/dashboard/devis-facturation/devis/quote-g"),
      planning: card("planning", "/dashboard/planning/plan-current"),
      workflow: opts.workflow,
      planSource: null,
      phases: [],
      canCreateFromQuote: false,
      primaryQuoteId: "quote-g",
      visitId: "visit-1",
      suggestedVisitId: null,
      followUpSheetId: "fu-1",
      compteRenduId: null,
      // Non utilisé par buildDossierNavFromWorkspace — placeholder typé.
      preparationState: null as unknown as ProjectWorkspace["global"]["preparationState"],
    },
    scopes: opts.scopes ?? [],
    unscoped: { studies: 0, schedulePlans: 0, quotes: 0, items: [] },
  };
}

const baseWorkflow: ChantierWorkflowStep[] = [
  step({
    id: "visite",
    href: "/dashboard/visites-metres/visit-1",
    ready: true,
    title: "Prête à chiffrer",
  }),
  step({
    id: "metre",
    href: "/dashboard/visites-metres/etudes/study-g",
    ready: true,
    title: "Validé",
    detail: "32 postes",
  }),
  step({
    id: "devis",
    href: "/dashboard/devis-facturation/devis/quote-g",
    ready: true,
    title: "Prêt",
    detail: "9 728 € HT",
  }),
  step({
    id: "planning",
    href: "/dashboard/planning/plan-current",
    ready: true,
    title: "Prêt",
    detail: "12 oct.",
  }),
  step({
    id: "approvisionnements",
    href: "/dashboard/projets/proj-1#tab-approvisionnements",
    ready: false,
    title: "À préparer",
    actionLabel: "Préparer",
  }),
  step({
    id: "suivi",
    href: "/dashboard/projets/proj-1/suivi-planning",
    ready: true,
    title: "Intervention prévue",
  }),
  step({
    id: "compte_rendu",
    href: "/dashboard/projets/proj-1/documents-chantier",
    ready: false,
    title: "Non créé",
    actionLabel: "Générer",
  }),
  step({
    id: "notice",
    href: "/dashboard/projets/proj-1/documents-chantier",
    ready: false,
    title: "Non créée",
    actionLabel: "Générer",
  }),
];

function hrefOf(snap: DossierNavSnapshot, id: string) {
  return snap.steps.find((s) => s.id === id)?.href ?? null;
}

function run() {
  // A — Métré → Devis (href devis courant)
  {
    const snap = buildDossierNavFromWorkspace(workspace({ workflow: baseWorkflow }), {
      activeStep: "metre",
    });
    assert.equal(
      hrefOf(snap, "devis"),
      "/dashboard/devis-facturation/devis/quote-g",
    );
    assert.equal(snap.steps.find((s) => s.id === "metre")?.visual, "active");
    console.log("A — Métré → Devis: ok");
  }

  // B — Devis → Planning CURRENT
  {
    const snap = buildDossierNavFromWorkspace(workspace({ workflow: baseWorkflow }), {
      activeStep: "devis",
    });
    assert.equal(hrefOf(snap, "planning"), "/dashboard/planning/plan-current");
    console.log("B — Devis → Planning CURRENT: ok");
  }

  // C — Planning → Métré
  {
    const snap = buildDossierNavFromWorkspace(workspace({ workflow: baseWorkflow }), {
      activeStep: "planning",
    });
    assert.equal(
      hrefOf(snap, "metre"),
      "/dashboard/visites-metres/etudes/study-g",
    );
    console.log("C — Planning → Métré: ok");
  }

  // D — Planning ARCHIVED ouvert : nav propose CURRENT (workflow déjà résolu)
  {
    const snap = buildDossierNavFromWorkspace(workspace({ workflow: baseWorkflow }), {
      activeStep: "planning",
    });
    assert.equal(hrefOf(snap, "planning"), "/dashboard/planning/plan-current");
    assert.notEqual(hrefOf(snap, "planning"), "/dashboard/planning/plan-archived");
    console.log("D — ARCHIVED → CURRENT: ok");
  }

  // E — Scope A ne mène pas vers scope B
  {
    const scopeA: ScopeWorkspace = {
      id: "scope-a",
      code: "A",
      name: "Fondations",
      description: null,
      status: "ACTIVE",
      displayOrder: 0,
      href: "/dashboard/projets/proj-1/preparation/scope-a",
      cards: [
        card("metre", "/dashboard/visites-metres/etudes/study-a"),
        card("devis", "/dashboard/devis-facturation/devis/quote-a"),
        card("planning", "/dashboard/planning/plan-a"),
        card("suivi", "/dashboard/projets/proj-1/suivi-planning?scopeId=scope-a"),
      ],
      alerts: [],
      progress: { ready: 3, total: 4 },
    };
    const scopeB: ScopeWorkspace = {
      ...scopeA,
      id: "scope-b",
      code: "B",
      name: "Électricité",
      href: "/dashboard/projets/proj-1/preparation/scope-b",
      cards: [
        card("metre", "/dashboard/visites-metres/etudes/study-b"),
        card("devis", "/dashboard/devis-facturation/devis/quote-b"),
        card("planning", "/dashboard/planning/plan-b"),
      ],
    };
    const snap = buildDossierNavFromWorkspace(
      workspace({ workflow: baseWorkflow, scopes: [scopeA, scopeB] }),
      { activeStep: "metre", scopeId: "scope-a" },
    );
    assert.equal(snap.scopeId, "scope-a");
    assert.equal(hrefOf(snap, "metre"), "/dashboard/visites-metres/etudes/study-a");
    assert.equal(hrefOf(snap, "devis"), "/dashboard/devis-facturation/devis/quote-a");
    assert.equal(hrefOf(snap, "planning"), "/dashboard/planning/plan-a");
    assert.notEqual(hrefOf(snap, "devis"), "/dashboard/devis-facturation/devis/quote-b");
    console.log("E — Scope A isolé: ok");
  }

  // F — étape non créée → À préparer, href hub (pas 404)
  {
    const wf = baseWorkflow.map((s) =>
      s.id === "notice"
        ? step({
            id: "notice",
            href: "/dashboard/projets/proj-1/documents-chantier",
            ready: false,
            title: "Non créée",
            primaryAction: "open",
          })
        : s,
    );
    const snap = buildDossierNavFromWorkspace(workspace({ workflow: wf }), {
      activeStep: "planning",
    });
    const notice = snap.steps.find((s) => s.id === "notice")!;
    assert.equal(notice.summary, "À préparer");
    assert.ok(notice.href?.includes("documents-chantier"));
    assert.notEqual(notice.href, null);
    console.log("F — Notice à préparer: ok");
  }

  // G — CR inexistant → espace préparation documents
  {
    const snap = buildDossierNavFromWorkspace(workspace({ workflow: baseWorkflow }), {
      activeStep: "suivi",
    });
    const cr = snap.steps.find((s) => s.id === "compte_rendu")!;
    assert.ok(cr.href?.includes("documents-chantier"));
    assert.equal(cr.exists, false);
    console.log("G — CR préparation: ok");
  }

  // H — Notice existante → document correct
  {
    const wf = baseWorkflow.map((s) =>
      s.id === "notice"
        ? step({
            id: "notice",
            href: "/dashboard/projets/proj-1/documents-chantier/notice-99",
            ready: true,
            title: "NOTICE-1 — Notice",
            detail: "Validée",
          })
        : s,
    );
    const snap = buildDossierNavFromWorkspace(workspace({ workflow: wf }), {
      activeStep: "visite",
    });
    assert.equal(
      hrefOf(snap, "notice"),
      "/dashboard/projets/proj-1/documents-chantier/notice-99",
    );
    console.log("H — Notice document: ok");
  }

  // I — aller/retour Métré → Devis → Planning → Métré (scope conservé)
  {
    const scopeA: ScopeWorkspace = {
      id: "scope-a",
      code: "A",
      name: "Fondations",
      description: null,
      status: "ACTIVE",
      displayOrder: 0,
      href: "/x",
      cards: [
        card("metre", "/m/a"),
        card("devis", "/d/a"),
        card("planning", "/p/a"),
      ],
      alerts: [],
      progress: { ready: 3, total: 3 },
    };
    const ws = workspace({ workflow: baseWorkflow, scopes: [scopeA] });
    const m = buildDossierNavFromWorkspace(ws, {
      activeStep: "metre",
      scopeId: "scope-a",
    });
    const d = buildDossierNavFromWorkspace(ws, {
      activeStep: "devis",
      scopeId: "scope-a",
    });
    const p = buildDossierNavFromWorkspace(ws, {
      activeStep: "planning",
      scopeId: "scope-a",
    });
    assert.equal(hrefOf(m, "devis"), "/d/a");
    assert.equal(hrefOf(d, "planning"), "/p/a");
    assert.equal(hrefOf(p, "metre"), "/m/a");
    assert.equal(m.scopeId, "scope-a");
    assert.equal(d.scopeId, "scope-a");
    assert.equal(p.scopeId, "scope-a");
    console.log("I — aller/retour scope: ok");
  }

  // Sérialisation légère
  {
    const snap = buildDossierNavFromWorkspace(workspace({ workflow: baseWorkflow }), {
      activeStep: "planning",
    });
    const ser = serializeDossierNavSnapshot(snap);
    assert.equal(ser.projectId, "proj-1");
    assert.equal(ser.steps.length, 8);
    assert.ok(!("workflow" in ser));
    console.log("serialize — ok");
  }

  // J — Approvisionnements présent, accessible sans planning prêt
  {
    const wf = baseWorkflow.map((s) =>
      s.id === "planning"
        ? step({
            id: "planning",
            href: null,
            ready: false,
            title: "À préparer",
          })
        : s,
    );
    const snap = buildDossierNavFromWorkspace(workspace({ workflow: wf }), {
      activeStep: "approvisionnements",
    });
    const supply = snap.steps.find((s) => s.id === "approvisionnements")!;
    assert.equal(supply.label, "approvisionnements");
    assert.ok(supply.href?.includes("#tab-approvisionnements"));
    assert.equal(supply.visual, "active");
    assert.equal(snap.steps.find((s) => s.id === "planning")?.ready, false);
    console.log("J — Approvisionnements sans planning: ok");
  }

  console.log("\nTous les tests dossier-nav A–J : OK");
}

run();
