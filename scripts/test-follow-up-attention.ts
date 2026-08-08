/**
 * Tests W3-A — moteur evaluateFollowUpAttention
 * Exécuter : npm run test:follow-up-attention
 */
import assert from "node:assert/strict";
import {
  evaluateFollowUpAttention,
  type AttentionWorkflowStep,
} from "../src/lib/follow-up/attention";

function atLocal(y: number, m: number, d: number, h = 12, min = 0) {
  return new Date(y, m, d, h, min, 0, 0);
}

const NOW = atLocal(2026, 7, 8, 12); // 8 août 2026

const stepPlanifier: AttentionWorkflowStep = {
  statusKey: "A_PLANIFIER",
  label: "À planifier",
  delayHours: 48,
  alertOrangeHours: 48,
  alertRedHours: 72,
  escalateHours: 96,
};

const stepFacturer: AttentionWorkflowStep = {
  statusKey: "A_FACTURER",
  label: "À facturer",
  delayHours: 72,
  alertOrangeHours: 72,
  alertRedHours: 120,
  escalateHours: 168,
};

function testA_dueFutureNormal() {
  const r = evaluateFollowUpAttention(
    {
      id: "1",
      status: "PLANIFIE",
      nextActionAt: atLocal(2026, 7, 20),
      nextActionDone: false,
    },
    { now: NOW },
  );
  assert.equal(r.effectiveUrgency, "NORMAL");
  assert.equal(r.attentionItems.length, 0);
  assert.equal(r.primaryReason, null);
}

function testB_dueSoonWatch() {
  const r = evaluateFollowUpAttention(
    {
      id: "1",
      status: "PLANIFIE",
      nextActionAt: atLocal(2026, 7, 11), // +3 j
      nextActionDone: false,
    },
    { now: NOW },
  );
  assert.equal(r.effectiveUrgency, "A_SURVEILLER");
  assert.ok(r.attentionItems.some((i) => i.code === "DUE_SOON"));
}

function testB2_dueTomorrowImportant() {
  const r = evaluateFollowUpAttention(
    {
      id: "1",
      status: "PLANIFIE",
      nextActionAt: atLocal(2026, 7, 9),
      nextActionDone: false,
    },
    { now: NOW },
  );
  assert.equal(r.effectiveUrgency, "IMPORTANT");
  assert.ok(r.attentionItems.some((i) => i.code === "DUE_TOMORROW"));
}

function testC_dueTodayUrgent() {
  const r = evaluateFollowUpAttention(
    {
      id: "1",
      status: "PLANIFIE",
      nextActionAt: atLocal(2026, 7, 8, 18),
      nextActionDone: false,
    },
    { now: NOW },
  );
  assert.equal(r.effectiveUrgency, "URGENT");
  assert.ok(r.attentionItems.some((i) => i.code === "DUE_TODAY"));
}

function testD_dueOverdueCritical() {
  const r = evaluateFollowUpAttention(
    {
      id: "1",
      status: "PLANIFIE",
      nextActionAt: atLocal(2026, 7, 6),
      nextActionDone: false,
    },
    { now: NOW },
  );
  assert.equal(r.effectiveUrgency, "CRITIQUE");
  assert.ok(r.attentionItems.some((i) => i.code === "DUE_OVERDUE"));
  assert.match(r.primaryReason ?? "", /Échéance dépassée/);
}

function testE_stepWithinDelay() {
  const r = evaluateFollowUpAttention(
    {
      id: "1",
      status: "A_PLANIFIER",
      statusEnteredAt: atLocal(2026, 7, 7, 12), // 24 h
      nextActionDone: true,
    },
    { now: NOW, workflowStep: stepPlanifier },
  );
  assert.equal(r.effectiveUrgency, "NORMAL");
  assert.ok(!r.attentionItems.some((i) => i.code === "STEP_OVERDUE"));
}

function testF_stepOverdue() {
  const r = evaluateFollowUpAttention(
    {
      id: "1",
      status: "A_PLANIFIER",
      statusEnteredAt: atLocal(2026, 7, 4, 12), // 4 j = 96 h
      nextActionDone: true,
    },
    { now: NOW, workflowStep: stepPlanifier },
  );
  assert.ok(r.attentionItems.some((i) => i.code === "STEP_OVERDUE"));
  assert.ok(urgencyAtLeast(r.effectiveUrgency, "IMPORTANT"));
  assert.match(r.primaryReason ?? "", /À planifier depuis/);
}

function testG_multipleMaxLevel() {
  const r = evaluateFollowUpAttention(
    {
      id: "1",
      status: "A_FACTURER",
      nextActionAt: atLocal(2026, 7, 5), // overdue → CRITIQUE
      nextActionDone: false,
      statusEnteredAt: atLocal(2026, 7, 1), // billing also
    },
    { now: NOW, workflowStep: stepFacturer },
  );
  assert.equal(r.effectiveUrgency, "CRITIQUE");
  assert.ok(r.attentionItems.length >= 2);
}

function testH_noDataNoFalsePositive() {
  const r = evaluateFollowUpAttention(
    {
      id: "1",
      status: "INTERVENTION_PREVUE",
      nextActionAt: null,
      nextActionDone: false,
      statusEnteredAt: null,
      urgencyOverride: null,
    },
    { now: NOW, workflowStep: { statusKey: "INTERVENTION_PREVUE", label: "Préparation", delayHours: 72 } },
  );
  assert.equal(r.effectiveUrgency, "NORMAL");
  assert.equal(r.attentionItems.length, 0);
}

function testI_manualCombined() {
  const r = evaluateFollowUpAttention(
    {
      id: "1",
      status: "PLANIFIE",
      nextActionAt: atLocal(2026, 7, 20),
      nextActionDone: false,
      urgencyOverride: "IMPORTANT",
    },
    { now: NOW },
  );
  assert.equal(r.manualUrgency, "IMPORTANT");
  assert.equal(r.computedUrgency, "NORMAL");
  assert.equal(r.effectiveUrgency, "IMPORTANT");
}

function testI2_autoBeatsManual() {
  const r = evaluateFollowUpAttention(
    {
      id: "1",
      status: "PLANIFIE",
      nextActionAt: atLocal(2026, 7, 6),
      nextActionDone: false,
      urgencyOverride: "IMPORTANT",
    },
    { now: NOW },
  );
  assert.equal(r.effectiveUrgency, "CRITIQUE");
}

function testBilling() {
  const r = evaluateFollowUpAttention(
    {
      id: "1",
      status: "A_FACTURER",
      nextActionDone: true,
      statusEnteredAt: atLocal(2026, 7, 3, 12), // 5 j
    },
    { now: NOW, workflowStep: stepFacturer },
  );
  assert.ok(r.attentionItems.some((i) => i.code === "BILLING_PENDING"));
  assert.match(r.primaryReason ?? "", /facturation/);
}

function testAvenant() {
  const r = evaluateFollowUpAttention(
    {
      id: "1",
      status: "AVENANT",
      nextActionDone: true,
      statusEnteredAt: atLocal(2026, 7, 1, 12), // 7 j > 120 h
    },
    {
      now: NOW,
      workflowStep: {
        statusKey: "AVENANT",
        label: "Avenant en cours",
        delayHours: 120,
        alertOrangeHours: 168,
        escalateHours: 192,
      },
    },
  );
  assert.ok(r.attentionItems.some((i) => i.code === "AVENANT_WAITING"));
  assert.match(r.primaryReason ?? "", /Avenant en attente/);
}

function testDeliveryUnconfirmed() {
  const r = evaluateFollowUpAttention(
    {
      id: "1",
      status: "ATTENTE_FOURNISSEUR",
      nextActionDone: true,
    },
    {
      now: NOW,
      agendaEvents: [
        {
          id: "ev1",
          type: "LIVRAISON",
          status: "PLANIFIE",
          title: "Livraison Point.P",
          startAt: atLocal(2026, 7, 9, 7, 30),
        },
      ],
    },
  );
  assert.ok(r.attentionItems.some((i) => i.code === "DELIVERY_UNCONFIRMED"));
  assert.match(r.primaryReason ?? "", /Point\.P|Livraison/);
}

function urgencyAtLeast(level: string, min: string) {
  const order = ["NORMAL", "A_SURVEILLER", "IMPORTANT", "URGENT", "CRITIQUE"];
  return order.indexOf(level) >= order.indexOf(min);
}

const tests = [
  ["A échéance future → NORMAL", testA_dueFutureNormal],
  ["B échéance proche → WATCH", testB_dueSoonWatch],
  ["B2 échéance demain → IMPORTANT", testB2_dueTomorrowImportant],
  ["C échéance aujourd’hui → URGENT", testC_dueTodayUrgent],
  ["D échéance dépassée → CRITICAL", testD_dueOverdueCritical],
  ["E étape dans délai → pas de stagnation", testE_stepWithinDelay],
  ["F étape hors délai → attention", testF_stepOverdue],
  ["G plusieurs problèmes → max", testG_multipleMaxLevel],
  ["H aucune donnée → pas de faux positif", testH_noDataNoFalsePositive],
  ["I urgence manuelle combinée", testI_manualCombined],
  ["I2 auto > manuel", testI2_autoBeatsManual],
  ["Billing A_FACTURER", testBilling],
  ["Avenant en attente", testAvenant],
  ["Livraison non confirmée", testDeliveryUnconfirmed],
] as const;

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failed += 1;
    console.error(`✗ ${name}`);
    console.error(e);
  }
}

if (failed > 0) {
  console.error(`\n${failed} test(s) en échec`);
  process.exit(1);
}
console.log(`\n${tests.length} tests OK`);
