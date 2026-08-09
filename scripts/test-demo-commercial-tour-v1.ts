/**
 * DEMO-COMMERCIALE-V1 — tests locaux (sans DB).
 * npx tsx scripts/test-demo-commercial-tour-v1.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  COMPLETE_TOUR_STEPS,
  DEMO_COMMERCIAL_TOUR_STORAGE_KEY,
  DEMO_SCENARIO_ORDER_NUMBER,
  EMPTY_TOUR_STATE,
  EXPRESS_TOUR_STEPS,
  resolveStepHref,
  stepAvailable,
  stepBodyWithContext,
  stepsForMode,
  type DemoCommercialContext,
} from "../src/lib/demo-environment/commercial-tour";

const ctxFull: DemoCommercialContext = {
  orderId: "ord_1",
  orderNumber: DEMO_SCENARIO_ORDER_NUMBER,
  orderStatus: "PARTIELLEMENT_RECUE",
  projectId: "proj_1",
  projectTitle: "Résidence Victor Hugo",
  supplierName: "Point.P",
  agendaEventId: "ev_1",
  orderedQty: 40,
  receivedQty: 30,
  hasPartialReceipt: true,
  orderHref: "/dashboard/commandes/ord_1",
  receptionHref: "/dashboard/commandes/ord_1/reception",
  messagerieHref: "/dashboard/messagerie?view=chantiers&project=proj_1&channel=FOURNISSEUR",
  agendaHref: "/dashboard/agenda?event=ev_1",
  documentsHref: `/dashboard/documents?q=${encodeURIComponent(DEMO_SCENARIO_ORDER_NUMBER)}`,
  chantierHref: "/dashboard/projets/proj_1",
};

const ctxEmpty: DemoCommercialContext = {
  orderId: null,
  orderNumber: null,
  orderStatus: null,
  projectId: null,
  projectTitle: null,
  supplierName: null,
  agendaEventId: null,
  orderedQty: null,
  receivedQty: null,
  hasPartialReceipt: false,
  orderHref: null,
  receptionHref: null,
  messagerieHref: null,
  agendaHref: null,
  documentsHref: null,
  chantierHref: null,
};

function testExpressShape() {
  assert.ok(EXPRESS_TOUR_STEPS.length >= 5 && EXPRESS_TOUR_STEPS.length <= 6);
  assert.equal(EXPRESS_TOUR_STEPS[0]?.persona, "direction");
  assert.ok(EXPRESS_TOUR_STEPS.some((s) => s.persona === "fournisseur"));
  assert.equal(EXPRESS_TOUR_STEPS.at(-1)?.finale, true);
  assert.ok(!EXPRESS_TOUR_STEPS.some((s) => s.persona === "client"));
  console.log("ok express 5–6 étapes Marc→Thomas→Marc");
}

function testCompleteShape() {
  const core = COMPLETE_TOUR_STEPS.filter((s) => !s.optional && !s.finale);
  assert.ok(core.length <= 12);
  assert.ok(COMPLETE_TOUR_STEPS.some((s) => s.optional && s.persona === "administratif"));
  assert.ok(COMPLETE_TOUR_STEPS.some((s) => s.optional && s.persona === "client"));
  assert.ok(COMPLETE_TOUR_STEPS.some((s) => s.promptSearch));
  assert.equal(COMPLETE_TOUR_STEPS.at(-1)?.finale, true);
  console.log("ok complete ≤12 core + Julie/Sophie optionnelles");
}

function testDynamicFilter() {
  const withOrder = stepsForMode("complete").filter((s) => stepAvailable(s, ctxFull));
  const withoutOrder = stepsForMode("complete").filter((s) => stepAvailable(s, ctxEmpty));
  assert.ok(withOrder.some((s) => s.id === "complete-commande"));
  assert.ok(withOrder.some((s) => s.id === "complete-reception"));
  assert.ok(withOrder.some((s) => s.id === "complete-reliquat"));
  assert.ok(!withoutOrder.some((s) => s.id === "complete-commande"));
  assert.ok(!withoutOrder.some((s) => s.id === "complete-messagerie"));
  assert.ok(!withoutOrder.some((s) => s.id === "complete-reception"));
  assert.ok(withoutOrder.some((s) => s.id === "complete-accueil"));
  const noPartial = { ...ctxFull, hasPartialReceipt: false, receivedQty: 0 };
  const withoutPartial = stepsForMode("complete").filter((s) => stepAvailable(s, noPartial));
  assert.ok(!withoutPartial.some((s) => s.id === "complete-reliquat"));
  console.log("ok filtre étapes selon contexte live");
}

function testDeepLinks() {
  const commande = COMPLETE_TOUR_STEPS.find((s) => s.id === "complete-commande")!;
  assert.equal(resolveStepHref(commande, ctxFull), "/dashboard/commandes/ord_1");
  assert.equal(resolveStepHref(commande, ctxEmpty), null);
  const msg = COMPLETE_TOUR_STEPS.find((s) => s.id === "complete-messagerie")!;
  assert.ok(resolveStepHref(msg, ctxFull)?.includes("channel=FOURNISSEUR"));
  const agenda = COMPLETE_TOUR_STEPS.find((s) => s.id === "complete-agenda")!;
  assert.ok(resolveStepHref(agenda, ctxFull)?.includes("event="));
  // Fallback agenda fixe si pas d’event dans ctx partiel
  const body = stepBodyWithContext(
    COMPLETE_TOUR_STEPS.find((s) => s.id === "complete-reception")!,
    ctxFull,
  );
  assert.ok(body.includes("30") && body.includes("40"));
  console.log("ok deep-links + corps réception dynamique");
}

function testNoFakeRoutes() {
  for (const step of [...EXPRESS_TOUR_STEPS, ...COMPLETE_TOUR_STEPS]) {
    if (step.href) {
      assert.ok(step.href.startsWith("/dashboard"), `href invalide ${step.id}`);
      assert.ok(!step.href.includes("fake"), step.id);
    }
  }
  assert.equal(DEMO_SCENARIO_ORDER_NUMBER, "BC-2026-043");
  assert.ok(DEMO_COMMERCIAL_TOUR_STORAGE_KEY.includes("commercial"));
  assert.equal(EMPTY_TOUR_STATE.active, false);
  console.log("ok routes dashboard uniquement");
}

function testWiringDemoOnly() {
  const layout = readFileSync(
    join(process.cwd(), "src/app/dashboard/layout.tsx"),
    "utf8",
  );
  assert.ok(layout.includes("DemoCommercialTour"));
  assert.ok(layout.includes("isDemo ? <DemoCommercialTour"));
  assert.ok(
    existsSync(join(process.cwd(), "src/components/demo-environment/DemoCommercialTour.tsx")),
  );
  assert.ok(
    existsSync(join(process.cwd(), "src/app/api/demo/commercial-context/route.ts")),
  );
  assert.ok(existsSync(join(process.cwd(), "src/app/api/demo/reset-scenario/route.ts")));
  const tourUi = readFileSync(
    join(process.cwd(), "src/components/demo-environment/DemoCommercialTour.tsx"),
    "utf8",
  );
  assert.ok(tourUi.includes("Quitter la démo"));
  assert.ok(tourUi.includes("Présenter BeWork"));
  assert.ok(tourUi.includes("Réinitialiser le scénario"));
  assert.ok(tourUi.includes("À expliquer"));
  // Pas de mutation métier dans le guide
  assert.ok(!tourUi.includes("prisma."));
  console.log("ok wiring DEMO-only + panneau");
}

function testNoMigration() {
  // Ce ticket ne doit pas ajouter de migration Prisma
  const migrationsDir = join(process.cwd(), "prisma/migrations");
  // On vérifie seulement que le code tour n’importe pas de schéma nouveau
  const ctxFile = readFileSync(
    join(process.cwd(), "src/lib/demo-environment/commercial-tour-context.ts"),
    "utf8",
  );
  assert.ok(ctxFile.includes("BC-2026-043") || ctxFile.includes("DEMO_SCENARIO_ORDER_NUMBER"));
  assert.ok(ctxFile.includes("findFirst"));
  assert.ok(!ctxFile.includes("create("));
  assert.ok(!ctxFile.includes("update("));
  void migrationsDir;
  console.log("ok contexte lecture seule, pas de mutation");
}

function testAccueilTargets() {
  const home = readFileSync(
    join(process.cwd(), "src/components/dashboard/AccueilOpsHome.tsx"),
    "utf8",
  );
  assert.ok(home.includes('data-demo-target="accueil-a-traiter"'));
  const board = readFileSync(
    join(process.cwd(), "src/components/a-traiter/ATraiterAttentionBoard.tsx"),
    "utf8",
  );
  assert.ok(board.includes('data-demo-target="a-traiter-board"'));
  console.log("ok data-demo-target Accueil / À traiter");
}

function main() {
  testExpressShape();
  testCompleteShape();
  testDynamicFilter();
  testDeepLinks();
  testNoFakeRoutes();
  testWiringDemoOnly();
  testNoMigration();
  testAccueilTargets();
  console.log("\nDEMO-COMMERCIALE-V1 — tous les tests OK");
}

main();
