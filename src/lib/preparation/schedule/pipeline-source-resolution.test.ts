/**
 * Tests génériques pipeline Quote → Takeoff → Planning.
 * Fixtures multi-métiers — aucun hardcode MOREL / électricité produit.
 * Exécution : node --import tsx src/lib/preparation/schedule/pipeline-source-resolution.test.ts
 */
import assert from "node:assert/strict";
import {
  resolveCanonicalTakeoffQuantity,
  resolvePlanningTaskSource,
  makeTakeoffQuantityResolver,
} from "./resolve-planning-source";
import { resolveCanonicalPhase, isDesignationLikeLot } from "./phase";
import { analyzeScheduleConsistency } from "./consistency";
import { analyzeSourceIntegrity } from "./source-integrity";
import { mergeTaskOnRegeneration } from "./merge-tasks";
import { computeSchedule } from "./compute";
import type {
  PrepResourcesDTO,
  PrepScheduleDTO,
  PrepWorkflowStepDTO,
} from "./types";

// --- P1–P5 Quantités ---
{
  const line = {
    code: "Q04-02",
    unit: "U",
    validatedQuantity: 6,
    computedQuantity: 99,
    declaredQuantity: 5,
  };
  const r = resolveCanonicalTakeoffQuantity(line, 88);
  assert.equal(r.quantity, 6);
  assert.equal(r.provenance, "VALIDATED");
}
{
  const r = resolveCanonicalTakeoffQuantity(
    { code: "A", unit: "U", computedQuantity: 12, declaredQuantity: 3 },
    null,
  );
  assert.equal(r.quantity, 12);
  assert.equal(r.provenance, "COMPUTED");
}
{
  const r = resolveCanonicalTakeoffQuantity(
    { code: "A", unit: "U", declaredQuantity: 3 },
    null,
  );
  assert.equal(r.quantity, 3);
  assert.equal(r.provenance, "DECLARED");
}
{
  const r = resolveCanonicalTakeoffQuantity({ code: "A", unit: "U" }, null);
  assert.equal(r.quantity, null);
}
{
  const r = resolveCanonicalTakeoffQuantity(
    { code: "F1", unit: "Forfait", declaredQuantity: 1 },
    null,
  );
  assert.equal(r.quantity, 1);
  assert.equal(r.isForfait, true);
}

// --- Engine prioritaire sur declared si pas de validated ---
{
  const r = resolveCanonicalTakeoffQuantity(
    { code: "A", unit: "U", declaredQuantity: 3 },
    15,
  );
  assert.equal(r.quantity, 15);
  assert.equal(r.provenance, "ENGINE");
}

// --- P6 Lot == designation ---
assert.equal(
  isDesignationLikeLot("Pose de prises cuisine", "Pose de prises cuisine"),
  true,
);
{
  const src = resolvePlanningTaskSource({
    stepId: "S1",
    stepName: "Pose de prises cuisine",
    stepLot: "Pose de prises cuisine",
    commercialSectionTitle: "LOT 04 — PRISES DE COURANT ET APPAREILLAGES",
    line: {
      code: "Q04-02",
      unit: "U",
      validatedQuantity: 6,
      lot: "Pose de prises cuisine",
      designation: "Pose de prises cuisine",
    },
  });
  assert.equal(src.quantity, 6);
  assert.notEqual(src.phase.label, "Pose de prises cuisine");
  assert.match(src.phase.label, /PRISE|APPAREILLAGE|Appareillage|À classer/i);
  assert.ok(src.phaseSource === "commercial_section" || src.phase.source !== "unclassified");
}

// --- Terminal CONTROL / HANDOVER même avec mauvaise phase source ---
{
  const ctrl = resolveCanonicalPhase({
    lot: "PHASE 1 — Installation & déposes",
    name: "Contrôles, essais de fonctionnement et vérifications finales",
  });
  assert.equal(ctrl.role, "controls");
  const hand = resolveCanonicalPhase({
    lot: "PHASE 1 — Installation & déposes",
    name: "Nettoyage de fin de chantier et remise au client",
  });
  assert.equal(hand.role, "handover");
}

// --- Pas de hardcode « prise » → installation si section absente ---
{
  const p = resolveCanonicalPhase({
    lot: null,
    name: "Fourniture et pose de prises 16A",
  });
  // Sans section structurée : ne doit PAS inventer « Appareillage » via produit
  assert.ok(
    p.role === "unclassified" || p.role === "generic" || p.source === "unclassified",
    `unexpected role for prise sans section: ${p.role}`,
  );
}

// --- Merge safe conserve crew ---
{
  const merged = mergeTaskOnRegeneration(
    {
      stepCode: "Q04-02",
      driverTakeoffCode: "Q04-02",
      quantitySnapshot: 6,
      quantityUnit: "U",
      lot: "Appareillage",
      name: "Prises",
      kind: "work",
      description: null,
      takeoffCodesJson: ["Q04-02"],
      dependsOnJson: [],
      preconditionsJson: [],
      controlsJson: [],
      constraintsJson: [],
      safetyJson: [],
      equipmentJson: [],
      suppliesJson: [],
      rateId: null,
      rateValue: 12,
      rateUnit: "U/j",
      ratePer: "equipe",
      parallelUnits: 1,
      durationMode: "fixed",
      durationDays: 0.5,
      crewJson: { crew_id: "ELEC-A", crew_size: 2 },
    },
    {
      stepCode: "Q04-02",
      driverTakeoffCode: "Q04-02",
      crewJson: { crew_id: "ELEC-A", crew_size: 2, members: [] },
      equipmentJson: [{ equipment_id: "m1", count: 1 }],
      suppliesJson: [],
      preconditionsJson: ["Zone libre"],
      controlsJson: [],
      constraintsJson: [],
      safetyJson: ["EPI"],
      description: "Mode opératoire manuel",
      rateId: "r1",
      rateValue: 12,
      rateUnit: "U/j",
      ratePer: "equipe",
      parallelUnits: 1,
      durationMode: "fixed",
      durationDays: 0.5,
      durationLockedByUser: false,
      computedDurationDays: 0.5,
    },
  );
  assert.ok(merged.preserved.includes("crewJson"));
  assert.equal(merged.quantitySnapshot, 6);
  assert.ok(merged.refreshed.includes("quantitySnapshot"));
}

// --- Missing quantity despite validated ---
{
  const c = analyzeScheduleConsistency([
    {
      stepCode: "Q04-02",
      name: "Prises",
      lot: "Appareillage",
      kind: "work",
      startDate: "2026-10-12",
      endDate: "2026-10-12",
      startHalf: 0,
      endHalf: 1,
      durationDays: 1,
      durationMode: "fixed",
      quantitySnapshot: null,
      validatedTakeoffQuantity: 6,
      driverTakeoffCode: "Q04-02",
      dependsOn: [],
    },
  ]);
  assert.ok(
    c.warnings.some((w) => w.code === "MISSING_QUANTITY_DESPITE_VALIDATED"),
  );
}

// --- Cross-project BLOCKER ---
{
  const s = analyzeSourceIntegrity({
    organizationId: "org1",
    project: { id: "p1", organizationId: "org1", title: "Maison R+1 120 m²" },
    study: { id: "s1", projectId: "p1", organizationId: "org1", version: 5 },
    quote: {
      id: "q1",
      projectId: "pOTHER",
      organizationId: "org1",
      subject: "Appartement T3 65 m² rénovation électrique",
    },
  });
  assert.equal(s.ok, false);
  assert.ok(s.blockers.some((b) => b.code === "QUOTE_PROJECT_MISMATCH"));
}

// --- Semantic WARNING only ---
{
  const s = analyzeSourceIntegrity({
    organizationId: "org1",
    project: {
      id: "p1",
      organizationId: "org1",
      title: "Construction d'une maison individuelle R+1 de 120 m² — MOREL",
    },
    study: { id: "s1", projectId: "p1", organizationId: "org1", version: 5 },
    quote: {
      id: "q1",
      projectId: "p1",
      organizationId: "org1",
      subject: "Rénovation électrique appartement T3 65 m²",
    },
  });
  assert.equal(s.ok, true);
  assert.ok(s.warnings.some((w) => w.code === "SEMANTIC_SOURCE_MISMATCH"));
}

// ========== Fixtures multi-métiers ==========

function emptyResources(): PrepResourcesDTO {
  return { labor: [], equipment: [], supplies: [], rates: [] };
}

function runTradeFixture(args: {
  label: string;
  steps: Array<{
    id: string;
    name: string;
    lot: string;
    section: string;
    qty: number;
    unit: string;
    kind?: string;
  }>;
  expectRoles: Record<string, string>;
}) {
  const lineMap = new Map(
    args.steps.map((s) => [
      s.id,
      {
        code: s.id,
        unit: s.unit,
        validatedQuantity: s.qty,
        declaredQuantity: s.qty,
        lot: s.lot,
        designation: s.name,
      },
    ]),
  );
  const qtyOf = makeTakeoffQuantityResolver(lineMap);

  const workflow: PrepWorkflowStepDTO[] = args.steps.map((s, i) => {
    const src = resolvePlanningTaskSource({
      stepId: s.id,
      stepName: s.name,
      stepLot: s.lot,
      commercialSectionTitle: s.section,
      takeoffIds: [s.id],
      line: lineMap.get(s.id)!,
    });
    return {
      id: s.id,
      name: s.name,
      kind: (s.kind as "work" | "control" | "wait") ?? "work",
      order: (i + 1) * 10,
      lot: src.phase.label,
      description: null,
      takeoff_ids: [s.id],
      duration: { mode: "fixed" as const, days: 1, calendar: "working" as const },
      crew: [],
      equipment: [],
      supplies: [],
      preconditions: [],
      controls_before_next: [],
      constraints: [],
      safety: [],
      hold_point: false,
      parallelizable: false,
    };
  });

  const schedule: PrepScheduleDTO = {
    start_date: "2026-10-12",
    calendar: { working_days: [1, 2, 3, 4, 5], holidays: [] },
    tasks: args.steps.map((s) => ({
      step_id: s.id,
      include_in_base: true,
      depends_on: [],
    })),
  };

  const result = computeSchedule({
    workflowSteps: workflow,
    schedule,
    resources: emptyResources(),
    qtyOf,
    qtyUnitOf: (c) => lineMap.get(c)?.unit ?? null,
  });
  assert.equal(result.errors.length, 0, `${args.label}: ${result.errors.join(",")}`);
  for (const [id, role] of Object.entries(args.expectRoles)) {
    const placed = result.placed.find((p) => p.stepId === id);
    assert.ok(placed, `${args.label}: missing ${id}`);
    const phase = resolveCanonicalPhase({
      lot: placed!.lot,
      name: placed!.name,
    });
    assert.equal(phase.role, role, `${args.label} ${id}: expected ${role} got ${phase.role}`);
    assert.equal(placed!.duration.quantity, lineMap.get(id)!.validatedQuantity);
  }
  // CONTROL / HANDOVER : rôle terminal + au moins une dépendance structurelle vers travaux
  const terminals = result.placed.filter((p) => {
    const r = resolveCanonicalPhase({ lot: p.lot, name: p.name }).role;
    return r === "controls" || r === "handover";
  });
  for (const term of terminals) {
    const workIds = result.placed
      .filter((p) => {
        const r = resolveCanonicalPhase({ lot: p.lot, name: p.name }).role;
        return !["controls", "handover", "wait"].includes(r);
      })
      .map((p) => p.stepId);
    if (workIds.length === 0) continue;
    const hasStructural = term.dependsOn.some((d) => workIds.includes(d.stepId));
    const afterSomeWork = workIds.some((wid) => {
      const w = result.placed.find((p) => p.stepId === wid)!;
      if (!term.startDate || !w.endDate) return false;
      return `${term.startDate}|${term.start.half}` >= `${w.endDate}|${w.end.half}`;
    });
    assert.ok(
      hasStructural || afterSomeWork,
      `${args.label}: ${term.stepId} should depend on or follow works`,
    );
  }
  console.log(`PASS fixture ${args.label}`);
}

// Électricité
runTradeFixture({
  label: "electricite",
  steps: [
    {
      id: "E01",
      name: "Installation de chantier",
      lot: "PHASE 1 — Installation & déposes",
      section: "LOT 01 — INSTALLATION DE CHANTIER ET DÉPOSE",
      qty: 1,
      unit: "Forfait",
    },
    {
      id: "E02",
      name: "Distribution électrique générale",
      lot: "PHASE 1 — Installation & déposes",
      section: "LOT 03 — DISTRIBUTION ÉLECTRIQUE ET ENCASTREMENT",
      qty: 60,
      unit: "ml",
    },
    {
      id: "E03",
      name: "Fourniture et pose de prises",
      lot: "PHASE 1 — Installation & déposes",
      section: "LOT 04 — PRISES DE COURANT ET APPAREILLAGES",
      qty: 6,
      unit: "U",
    },
    {
      id: "E04",
      name: "Contrôles et essais de fonctionnement finals",
      lot: "PHASE 1 — Installation & déposes",
      section: "LOT 08 — CONTRÔLES, ESSAIS ET LIVRAISON",
      qty: 1,
      unit: "Forfait",
      kind: "control",
    },
    {
      id: "E05",
      name: "Nettoyage et remise au client",
      lot: "PHASE 1 — Installation & déposes",
      section: "LOT 08 — CONTRÔLES, ESSAIS ET LIVRAISON",
      qty: 1,
      unit: "Forfait",
    },
  ],
  expectRoles: {
    E01: "preparation",
    E02: "networks",
    E04: "controls",
    E05: "handover",
  },
});

// Terrassement
runTradeFixture({
  label: "terrassement",
  steps: [
    {
      id: "T01",
      name: "Installation de chantier et base vie",
      lot: "Travaux",
      section: "LOT 01 — INSTALLATION CHANTIER",
      qty: 1,
      unit: "Forfait",
    },
    {
      id: "T02",
      name: "Décapage de terre végétale",
      lot: "Travaux",
      section: "LOT 02 — DÉCAPAGE",
      qty: 120,
      unit: "m²",
    },
    {
      id: "T03",
      name: "Terrassement des fouilles",
      lot: "Travaux",
      section: "LOT 03 — TERRASSEMENT",
      qty: 80,
      unit: "m³",
    },
    {
      id: "T04",
      name: "Évacuation des déblais",
      lot: "Travaux",
      section: "LOT 04 — ÉVACUATION",
      qty: 80,
      unit: "m³",
    },
    {
      id: "T05",
      name: "Réception des terrassements et contrôles finals",
      lot: "Travaux",
      section: "LOT 05 — RÉCEPTION",
      qty: 1,
      unit: "Forfait",
      kind: "control",
    },
  ],
  expectRoles: {
    T01: "preparation",
    T03: "networks",
    T05: "controls",
  },
});

// Maçonnerie
runTradeFixture({
  label: "maconnerie",
  steps: [
    {
      id: "M01",
      name: "Installation de chantier",
      lot: "Travaux",
      section: "LOT 01 — INSTALLATION",
      qty: 1,
      unit: "Forfait",
    },
    {
      id: "M02",
      name: "Fondations béton armé",
      lot: "Travaux",
      section: "LOT 02 — FONDATIONS",
      qty: 25,
      unit: "m³",
    },
    {
      id: "M03",
      name: "Élévation des murs",
      lot: "Travaux",
      section: "LOT 03 — ÉLÉVATION",
      qty: 180,
      unit: "m²",
    },
    {
      id: "M04",
      name: "Finitions maçonnerie",
      lot: "Travaux",
      section: "LOT 04 — FINITIONS",
      qty: 1,
      unit: "Forfait",
    },
    {
      id: "M05",
      name: "Contrôle et réception technique finale",
      lot: "Travaux",
      section: "LOT 05 — RÉCEPTION",
      qty: 1,
      unit: "Forfait",
      kind: "control",
    },
  ],
  expectRoles: {
    M01: "preparation",
    M03: "installation",
    M04: "finishes",
    M05: "controls",
  },
});

// --- Fixture MOREL-like (dry-run, pas de BDD) : quantités + phases ---
{
  const morelLines = [
    { code: "Q04-01", qty: 7, name: "Prises séjour", section: "LOT 04 — PRISES DE COURANT ET APPAREILLAGES" },
    { code: "Q04-02", qty: 6, name: "Prises cuisine", section: "LOT 04 — PRISES DE COURANT ET APPAREILLAGES" },
    { code: "Q04-03", qty: 4, name: "Prises chambres", section: "LOT 04 — PRISES DE COURANT ET APPAREILLAGES" },
    { code: "Q04-04", qty: 4, name: "Prises SDB", section: "LOT 04 — PRISES DE COURANT ET APPAREILLAGES" },
    { code: "Q05-01", qty: 2, name: "Points lumineux", section: "LOT 05 — INSTALLATION DES POINTS LUMINEUX" },
    { code: "Q06-01", qty: 2, name: "Interrupteurs", section: "LOT 06 — INTERRUPTEURS ET COMMANDES D'ÉCLAIRAGE" },
    { code: "Q08-02", qty: 1, name: "Nettoyage et remise au client", section: "LOT 08 — CONTRÔLES, ESSAIS ET LIVRAISON" },
  ];
  for (const l of morelLines) {
    const src = resolvePlanningTaskSource({
      stepId: l.code,
      stepName: l.name,
      stepLot: "PHASE 1 — Installation & déposes",
      commercialSectionTitle: l.section,
      takeoffIds: [l.code],
      line: {
        code: l.code,
        unit: "U",
        validatedQuantity: l.qty,
        lot: "PHASE 1 — Installation & déposes",
        designation: l.name,
      },
    });
    assert.equal(src.quantity, l.qty, l.code);
    assert.notEqual(src.phase.label, "PHASE 1 — Installation & déposes");
    if (l.code === "Q08-02") assert.equal(src.phase.role, "handover");
    if (l.code.startsWith("Q04")) {
      assert.match(src.phase.label, /PRISE|APPAREILLAGE/i);
    }
  }
}

console.log("pipeline-source-resolution.test.ts PASS");
