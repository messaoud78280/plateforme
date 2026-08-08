/**
 * Tests W3-C2A — moteur rappel / escalade (déterministe, sans DB).
 * Exécuter : npx tsx scripts/test-attention-escalation.ts
 */
import assert from "node:assert/strict";
import {
  evaluateAttentionEscalation,
  type ExistingAttentionNotif,
} from "../src/lib/follow-up/attention/evaluate-escalation";
import {
  buildLegacyAttentionDedupeKey,
  buildStagedAttentionDedupeKey,
  DEFAULT_ESCALATION_BY_LEVEL,
  episodeKeyFromStatusTransition,
  resolveLevelEscalationPolicy,
} from "../src/lib/follow-up/attention/escalation-policy";
import { buildAttentionDedupeKey } from "../src/lib/follow-up/attention/notify-policy";

const JULIE = "julie";
const MARC = "marc";
const SHEET = "alpha";
const CODE = "BILLING_PENDING";
const REASON = "Travaux terminés — facturation à préparer.";
const ENTERED = new Date("2026-08-01T08:00:00.000Z");
/** Id timeline fictif — épisode unique même si même jour. */
const EPISODE = "evt_alpha_status_1";

function staged(
  userId: string,
  level: string,
  stage: "INITIAL" | "REMINDER_1" | "REMINDER_2" | "ESCALATION",
) {
  return buildStagedAttentionDedupeKey({
    userId,
    sheetId: SHEET,
    code: CODE,
    level,
    episode: EPISODE,
    stage,
  });
}

function notif(
  dedupeKey: string,
  userId: string,
  createdAt: Date,
  type = "FOLLOWUP_ATTENTION",
): ExistingAttentionNotif {
  return { dedupeKey, userId, type, createdAt };
}

function base(overrides: Partial<Parameters<typeof evaluateAttentionEscalation>[0]> = {}) {
  return evaluateAttentionEscalation({
    sheetId: SHEET,
    sheetTitle: "Immeuble Alpha",
    code: CODE,
    level: "IMPORTANT",
    primaryReason: REASON,
    statusEnteredAt: ENTERED,
    statusEpisodeKey: EPISODE,
    responsibleId: JULIE,
    escalateToId: MARC,
    responsibleName: "Julie Martin",
    workflowStep: null,
    existingNotifications: [],
    now: new Date("2026-08-01T09:00:00.000Z"),
    ...overrides,
  });
}

/** A — pas de duplication W3-C1 : sans INITIAL → NONE (pas de création ici). */
function testA_noInitialNoRemind() {
  const r = base({ now: new Date("2026-08-05T09:00:00.000Z") });
  assert.equal(r.action, "NONE");
  assert.equal(r.debug?.hasInitial, false);
}

/** B — temps insuffisant → aucun rappel. */
function testB_tooSoon() {
  const initialAt = new Date("2026-08-01T08:00:00.000Z");
  const r = base({
    existingNotifications: [notif(staged(JULIE, "IMPORTANT", "INITIAL"), JULIE, initialAt)],
    now: new Date("2026-08-01T12:00:00.000Z"), // +4h < 24h
  });
  assert.equal(r.action, "NONE");
  assert.ok(r.nextCheckAt);
}

/** C — délai atteint → REMINDER_1. */
function testC_reminder1() {
  const initialAt = new Date("2026-08-01T08:00:00.000Z");
  const r = base({
    existingNotifications: [notif(staged(JULIE, "IMPORTANT", "INITIAL"), JULIE, initialAt)],
    now: new Date("2026-08-02T09:00:00.000Z"), // +25h
  });
  assert.equal(r.action, "REMIND");
  assert.equal(r.stage, "REMINDER_1");
  assert.equal(r.recipientId, JULIE);
  assert.equal(r.notificationType, "FOLLOWUP_REMINDER");
  assert.equal(r.dedupeKey, staged(JULIE, "IMPORTANT", "REMINDER_1"));
}

/** D — pas de 2e REMINDER_1. */
function testD_noDuplicateReminder1() {
  const initialAt = new Date("2026-08-01T08:00:00.000Z");
  const r = base({
    existingNotifications: [
      notif(staged(JULIE, "IMPORTANT", "INITIAL"), JULIE, initialAt),
      notif(staged(JULIE, "IMPORTANT", "REMINDER_1"), JULIE, new Date("2026-08-02T09:00:00.000Z"), "FOLLOWUP_REMINDER"),
    ],
    now: new Date("2026-08-02T15:00:00.000Z"),
  });
  assert.equal(r.action, "NONE");
  assert.equal(r.debug?.hasReminder1, true);
}

/** E — problème résolu = pas d’item → le process skippe ; ici sans INITIAL métier = NONE. */
function testE_resolvedNoRemind() {
  // Simule absence d’INITIAL actif pour l’épisode (cycle terminé / pas resync)
  const r = base({
    existingNotifications: [
      notif(staged(JULIE, "IMPORTANT", "REMINDER_1"), JULIE, new Date("2026-08-02T09:00:00.000Z"), "FOLLOWUP_REMINDER"),
    ],
    now: new Date("2026-08-03T09:00:00.000Z"),
  });
  assert.equal(r.action, "NONE");
}

/** F — IMPORTANT → URGENT : pas de rappel IMPORTANT simultané ; cycle URGENT. */
function testF_aggravationPriority() {
  const entered = ENTERED;
  // Ancien INITIAL IMPORTANT + nouvel INITIAL URGENT (W3-C1 aggravation)
  const rImportant = base({
    level: "IMPORTANT",
    existingNotifications: [
      notif(staged(JULIE, "IMPORTANT", "INITIAL"), JULIE, entered),
      notif(staged(JULIE, "URGENT", "INITIAL"), JULIE, new Date("2026-08-03T08:00:00.000Z"), "FOLLOWUP_URGENT"),
    ],
    now: new Date("2026-08-03T10:00:00.000Z"),
  });
  // Si on évaluait encore IMPORTANT après aggravation, rappel pourrait être dû —
  // le process n’évalue que le niveau effectif URGENT :
  const rUrgent = base({
    level: "URGENT",
    primaryReason: "Travaux terminés depuis 3 jours — facturation non réalisée.",
    existingNotifications: [
      notif(staged(JULIE, "IMPORTANT", "INITIAL"), JULIE, entered),
      notif(
        staged(JULIE, "URGENT", "INITIAL"),
        JULIE,
        new Date("2026-08-03T08:00:00.000Z"),
        "FOLLOWUP_URGENT",
      ),
    ],
    now: new Date("2026-08-03T10:00:00.000Z"), // +2h depuis INITIAL URGENT < 12h
  });
  assert.equal(rUrgent.action, "NONE");
  assert.equal(rUrgent.debug?.hasInitial, true);
  // Pas de REMINDER IMPORTANT créé par l’évaluation URGENT
  assert.notEqual(rUrgent.stage, "REMINDER_1");
  void rImportant;
}

/** G — retard persistant → escalade. */
function testG_escalate() {
  const initialAt = new Date("2026-08-01T08:00:00.000Z");
  const r = base({
    existingNotifications: [
      notif(staged(JULIE, "IMPORTANT", "INITIAL"), JULIE, initialAt),
      notif(staged(JULIE, "IMPORTANT", "REMINDER_1"), JULIE, new Date("2026-08-02T09:00:00.000Z"), "FOLLOWUP_REMINDER"),
      notif(staged(JULIE, "IMPORTANT", "REMINDER_2"), JULIE, new Date("2026-08-04T09:00:00.000Z"), "FOLLOWUP_REMINDER"),
    ],
    now: new Date("2026-08-06T10:00:00.000Z"), // +126h > 120h
  });
  assert.equal(r.action, "ESCALATE");
  assert.equal(r.recipientId, MARC);
  assert.equal(r.notificationType, "FOLLOWUP_ESCALATION");
  assert.match(r.message ?? "", /Non traité malgré 2 rappels/);
  assert.match(r.message ?? "", /facturation/i);
  assert.equal(r.dedupeKey, staged(MARC, "IMPORTANT", "ESCALATION"));
}

/** H — escalade idempotente. */
function testH_escalateOnce() {
  const initialAt = new Date("2026-08-01T08:00:00.000Z");
  const r = base({
    existingNotifications: [
      notif(staged(JULIE, "IMPORTANT", "INITIAL"), JULIE, initialAt),
      notif(staged(MARC, "IMPORTANT", "ESCALATION"), MARC, new Date("2026-08-06T10:00:00.000Z"), "FOLLOWUP_ESCALATION"),
    ],
    now: new Date("2026-08-07T10:00:00.000Z"),
  });
  assert.equal(r.action, "NONE");
  assert.equal(r.debug?.hasEscalation, true);
}

/** I — CRITICAL : escalade rapide, pas de rappel. */
function testI_criticalFastEscalation() {
  const policy = resolveLevelEscalationPolicy("CRITIQUE", null);
  assert.ok(policy);
  assert.equal(policy!.maxReminders, 0);
  assert.ok(policy!.escalateAfterHours <= 12);

  const initialAt = new Date("2026-08-01T08:00:00.000Z");
  const r = base({
    level: "CRITIQUE",
    existingNotifications: [
      notif(staged(JULIE, "CRITIQUE", "INITIAL"), JULIE, initialAt, "FOLLOWUP_CRITICAL"),
    ],
    now: new Date("2026-08-01T21:00:00.000Z"), // +13h
  });
  assert.equal(r.action, "ESCALATE");
  assert.equal(r.recipientId, MARC);
}

/** J — notification lue n’arrête pas le cycle (read non consulté). */
function testJ_readIgnored() {
  const initialAt = new Date("2026-08-01T08:00:00.000Z");
  const r = base({
    existingNotifications: [notif(staged(JULIE, "IMPORTANT", "INITIAL"), JULIE, initialAt)],
    now: new Date("2026-08-02T09:00:00.000Z"),
  });
  assert.equal(r.action, "REMIND");
}

/** K — pas de destinataire escalade externe simulé : escalateToId null. */
function testK_noExternalEscalationTarget() {
  const initialAt = new Date("2026-08-01T08:00:00.000Z");
  const r = base({
    escalateToId: null,
    existingNotifications: [notif(staged(JULIE, "IMPORTANT", "INITIAL"), JULIE, initialAt)],
    now: new Date("2026-08-06T10:00:00.000Z"),
  });
  // Peut rappeler, mais pas escalader
  assert.notEqual(r.action, "ESCALATE");
}

/** L — isolation tenant via clé destinataire (Marc ≠ autre org). */
function testL_tenantIsolationInKeys() {
  const a = staged(MARC, "IMPORTANT", "ESCALATION");
  const other = buildStagedAttentionDedupeKey({
    userId: "other-org-boss",
    sheetId: SHEET,
    code: CODE,
    level: "IMPORTANT",
    episode: EPISODE,
    stage: "ESCALATION",
  });
  assert.notEqual(a, other);
  assert.match(a, new RegExp(`^ATTENTION:${MARC}:`));
}

/** M — simulation now déterministe. */
function testM_nowSimulation() {
  const initialAt = new Date("2026-08-01T08:00:00.000Z");
  const existing = [notif(staged(JULIE, "IMPORTANT", "INITIAL"), JULIE, initialAt)];
  const j0 = base({ existingNotifications: existing, now: new Date("2026-08-01T09:00:00.000Z") });
  const j1 = base({ existingNotifications: existing, now: new Date("2026-08-02T09:00:00.000Z") });
  const j5 = base({
    existingNotifications: [
      ...existing,
      notif(staged(JULIE, "IMPORTANT", "REMINDER_1"), JULIE, new Date("2026-08-02T09:00:00.000Z"), "FOLLOWUP_REMINDER"),
      notif(staged(JULIE, "IMPORTANT", "REMINDER_2"), JULIE, new Date("2026-08-04T09:00:00.000Z"), "FOLLOWUP_REMINDER"),
    ],
    now: new Date("2026-08-06T10:00:00.000Z"),
  });
  assert.equal(j0.action, "NONE");
  assert.equal(j1.action, "REMIND");
  assert.equal(j5.action, "ESCALATE");
}

function testWorkflowStepOverrides() {
  const p = resolveLevelEscalationPolicy("IMPORTANT", {
    reminderHours: 6,
    escalateHours: 18,
  });
  assert.equal(p!.reminder1AfterHours, 6);
  assert.equal(p!.escalateAfterHours, 18);

  const initialAt = new Date("2026-08-01T08:00:00.000Z");
  const r = base({
    workflowStep: { reminderHours: 6, escalateHours: 18 },
    existingNotifications: [notif(staged(JULIE, "IMPORTANT", "INITIAL"), JULIE, initialAt)],
    now: new Date("2026-08-01T15:00:00.000Z"), // +7h
  });
  assert.equal(r.action, "REMIND");
}

function testLegacyInitialAccepted() {
  const legacy = buildLegacyAttentionDedupeKey({
    userId: JULIE,
    sheetId: SHEET,
    code: CODE,
    level: "IMPORTANT",
  });
  assert.equal(legacy, buildAttentionDedupeKey({
    userId: JULIE,
    sheetId: SHEET,
    code: CODE,
    level: "IMPORTANT",
  }));
  const r = base({
    existingNotifications: [notif(legacy, JULIE, ENTERED)],
    now: new Date("2026-08-02T09:00:00.000Z"),
  });
  assert.equal(r.action, "REMIND");
}

function testEpisodeAllowsNewCycle() {
  const oldEpisode = "evt_old_transition";
  const oldInitial = buildStagedAttentionDedupeKey({
    userId: JULIE,
    sheetId: SHEET,
    code: CODE,
    level: "IMPORTANT",
    episode: oldEpisode,
    stage: "INITIAL",
  });
  // Ancien INITIAL d’un autre épisode + pas d’INITIAL courant → NONE (W3-C1 devra recréer)
  const r = base({
    existingNotifications: [
      notif(oldInitial, JULIE, new Date("2026-06-01T08:00:00.000Z")),
    ],
    now: new Date("2026-08-02T09:00:00.000Z"),
  });
  assert.equal(r.action, "NONE");
  assert.equal(r.debug?.hasInitial, false);
}

function testSameDayDistinctEpisodes() {
  const a = episodeKeyFromStatusTransition({
    eventId: "evt_morning",
    occurredAt: new Date("2026-08-01T09:00:00.000Z"),
  });
  const b = episodeKeyFromStatusTransition({
    eventId: "evt_evening",
    occurredAt: new Date("2026-08-01T18:00:00.000Z"),
  });
  assert.notEqual(a, b);
  assert.equal(a, "evt_morning");
}

function testDefaultsCentralized() {
  assert.equal(DEFAULT_ESCALATION_BY_LEVEL.IMPORTANT.reminder1AfterHours, 24);
  assert.equal(DEFAULT_ESCALATION_BY_LEVEL.URGENT.escalateAfterHours, 48);
  assert.equal(DEFAULT_ESCALATION_BY_LEVEL.CRITIQUE.maxReminders, 0);
}

const tests: [string, () => void][] = [
  ["A aucune duplication W3-C1", testA_noInitialNoRemind],
  ["B temps insuffisant", testB_tooSoon],
  ["C REMINDER_1", testC_reminder1],
  ["D pas de 2e REMINDER_1", testD_noDuplicateReminder1],
  ["E problème résolu", testE_resolvedNoRemind],
  ["F aggravation prioritaire", testF_aggravationPriority],
  ["G escalade", testG_escalate],
  ["H escalade unique", testH_escalateOnce],
  ["I CRITICAL rapide", testI_criticalFastEscalation],
  ["J read ignoré", testJ_readIgnored],
  ["K pas d’escalade sans cible", testK_noExternalEscalationTarget],
  ["L isolation destinataire", testL_tenantIsolationInKeys],
  ["M simulation now", testM_nowSimulation],
  ["WorkflowStep override", testWorkflowStepOverrides],
  ["legacy INITIAL", testLegacyInitialAccepted],
  ["épisode nouveau cycle", testEpisodeAllowsNewCycle],
  ["même jour → épisodes distincts", testSameDayDistinctEpisodes],
  ["defaults centralisés", testDefaultsCentralized],
];

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
if (failed) process.exit(1);
console.log(`\n${tests.length} tests OK`);
