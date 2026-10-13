/**
 * Visite → métré : alerte technique, sans réécriture.
 */
import assert from "node:assert/strict";
import {
  buildVisitTechnicalSnapshot,
  evaluateVisitTakeoffDrift,
  isVisitExplicitlyLinked,
  readVisitTechnicalBaseline,
  type VisitTechnicalSnapshot,
} from "./visit-takeoff-drift";

function measure(
  overrides?: Partial<VisitTechnicalSnapshot["measurements"][number]>,
): VisitTechnicalSnapshot["measurements"][number] {
  return {
    id: "m1",
    zone: "Séjour",
    label: "Mur nord",
    measureType: "AREA",
    unit: "m²",
    lengthM: 5,
    widthM: null,
    heightM: 2.5,
    quantityValue: null,
    computedQuantity: 12.5,
    grossQuantity: 12.5,
    multiplier: 1,
    coefficient: 1,
    wastePercent: null,
    deductions: null,
    lot: "Plâtrerie",
    ...overrides,
  };
}

function snap(
  overrides?: Partial<VisitTechnicalSnapshot>,
): VisitTechnicalSnapshot {
  return {
    visitId: "visit-1",
    clientNeed: "Cloisons",
    zones: ["Séjour"],
    lots: ["Plâtrerie"],
    findings: null,
    proposedWorks: null,
    measurements: [measure()],
    ...overrides,
  };
}

const created = "2026-10-01T10:00:00.000Z";
const validated = "2026-10-02T10:00:00.000Z";

assert.equal(
  isVisitExplicitlyLinked({
    projectId: "p1",
    visit: { projectId: null, commercialQuoteId: null },
    quoteIds: [],
  }),
  false,
);
assert.equal(
  isVisitExplicitlyLinked({
    projectId: "p1",
    visit: { projectId: "p1", commercialQuoteId: null },
    quoteIds: [],
  }),
  true,
);

const idle = evaluateVisitTakeoffDrift({
  hasStudy: true,
  visitLinked: true,
  baseline: snap(),
  current: snap(),
});
assert.equal(idle.stale, false);

const length = evaluateVisitTakeoffDrift({
  hasStudy: true,
  visitLinked: true,
  baseline: snap(),
  current: snap({
    measurements: [measure({ lengthM: 6, computedQuantity: 15 })],
  }),
});
assert.equal(length.stale, true);
assert.equal(length.changes[0]?.label, "Mur nord — Séjour");
assert.match(length.changes[0]?.detail ?? "", /Longueur 5 → 6/);
assert.match(length.changes[0]?.detail ?? "", /Quantité calculée/);

const zones = evaluateVisitTakeoffDrift({
  hasStudy: true,
  visitLinked: true,
  baseline: snap(),
  current: snap({ zones: ["Séjour", "Cuisine"] }),
});
assert.equal(zones.stale, true);
assert.equal(zones.changes.some((c) => c.label === "Zones"), true);

const need = evaluateVisitTakeoffDrift({
  hasStudy: true,
  visitLinked: true,
  baseline: snap(),
  current: snap({ clientNeed: "Cloisons et faux-plafond" }),
});
assert.equal(need.changes[0]?.label, "Besoin client");

const unlinked = evaluateVisitTakeoffDrift({
  hasStudy: true,
  visitLinked: false,
  baseline: snap(),
  current: snap({ measurements: [measure({ lengthM: 9 })] }),
});
assert.equal(unlinked.stale, false);

const noStudy = evaluateVisitTakeoffDrift({
  hasStudy: false,
  visitLinked: true,
  baseline: snap(),
  current: snap({ measurements: [measure({ lengthM: 9 })] }),
});
assert.equal(noStudy.stale, false);

const sameNumber = evaluateVisitTakeoffDrift({
  hasStudy: true,
  visitLinked: true,
  baseline: snap(),
  current: snap({
    measurements: [measure({ lengthM: 5.00004 })],
  }),
});
assert.equal(sameNumber.stale, false);

const built = buildVisitTechnicalSnapshot({
  id: "visit-1",
  clientNeed: "  Cloisons  ",
  zonesJson: { b: 1, a: "2" },
  measurements: [
    {
      id: "m1",
      label: "Mur nord",
      zone: "Séjour",
      lengthM: "5,0000",
      heightM: 2.5,
      computedQuantity: 12.5,
      unit: "m²",
      observation: "note logistique",
    } as VisitTechnicalSnapshot["measurements"][number] & { observation?: string },
  ],
});
assert.equal(built.clientNeed, "Cloisons");
assert.equal(built.measurements[0]?.lengthM, 5);
assert.equal("observation" in built.measurements[0]!, false);
const again = buildVisitTechnicalSnapshot({
  id: "visit-1",
  clientNeed: "Cloisons",
  zonesJson: { a: 2, b: 1 },
  measurements: [
    {
      id: "m1",
      label: "Mur nord",
      zone: "Séjour",
      lengthM: 5,
      heightM: 2.5,
      computedQuantity: 12.5,
      unit: "m²",
    },
  ],
});
assert.deepEqual(built.zones, again.zones);

const beforeCreate = evaluateVisitTakeoffDrift({
  hasStudy: true,
  visitLinked: true,
  studyCreatedAt: created,
  measurementTouches: [
    {
      id: "m1",
      label: "Mur nord",
      detail: "Modifié après le métré",
      updatedAt: "2026-09-30T10:00:00.000Z",
    },
  ],
});
assert.equal(beforeCreate.stale, false);

const afterCreate = evaluateVisitTakeoffDrift({
  hasStudy: true,
  visitLinked: true,
  studyCreatedAt: created,
  measurementTouches: [
    {
      id: "m1",
      label: "Mur nord — Séjour",
      detail: "Modifié après le métré · L 6 m",
      updatedAt: "2026-10-01T12:00:00.000Z",
    },
  ],
});
assert.equal(afterCreate.stale, true);
assert.match(afterCreate.changes[0]?.detail ?? "", /L 6 m/);

const acknowledged = evaluateVisitTakeoffDrift({
  hasStudy: true,
  visitLinked: true,
  studyCreatedAt: created,
  studyValidatedAt: validated,
  measurementTouches: [
    {
      id: "m1",
      label: "Mur nord",
      detail: "Modifié après le métré",
      updatedAt: "2026-10-01T12:00:00.000Z",
    },
  ],
});
assert.equal(acknowledged.stale, false);

const afterValidation = evaluateVisitTakeoffDrift({
  hasStudy: true,
  visitLinked: true,
  studyCreatedAt: created,
  studyValidatedAt: validated,
  measurementTouches: [
    {
      id: "m1",
      label: "Mur nord",
      detail: "Modifié après le métré · qté 15 m²",
      updatedAt: "2026-10-03T10:00:00.000Z",
    },
  ],
});
assert.equal(afterValidation.stale, true);

const roundTrip = readVisitTechnicalBaseline({
  visitTechnicalBaseline: snap(),
});
assert.equal(roundTrip?.visitId, "visit-1");
assert.equal(roundTrip?.measurements[0]?.lengthM, 5);
assert.equal(readVisitTechnicalBaseline({ kind: "note" }), null);

console.log("visit-takeoff-drift OK");
