/**
 * Tests W3-C2B — scheduler / sécurité now / épisode (sans DB pour la plupart).
 * Exécuter : npx tsx scripts/test-attention-scheduler.ts
 */
import assert from "node:assert/strict";
import {
  canSimulateAttentionNow,
  resolveAttentionProcessNow,
} from "../src/lib/follow-up/attention/resolve-now";
import {
  buildStagedAttentionDedupeKey,
  episodeKeyFromStatusTransition,
} from "../src/lib/follow-up/attention/escalation-policy";
import { evaluateAttentionEscalation } from "../src/lib/follow-up/attention/evaluate-escalation";

const JULIE = "julie";
const MARC = "marc";
const SHEET = "alpha";
const CODE = "BILLING_PENDING";
const EPISODE = "evt_sched_1";
const ENTERED = new Date("2026-08-01T08:00:00.000Z");

function staged(
  userId: string,
  stage: "INITIAL" | "REMINDER_1" | "REMINDER_2" | "ESCALATION",
  level = "IMPORTANT",
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

/** A/C/D/E/F/I — décisions métier inchangées via evaluate (job = thin wrapper). */
function testJobDecisions() {
  const initial = {
    dedupeKey: staged(JULIE, "INITIAL"),
    userId: JULIE,
    type: "FOLLOWUP_ATTENTION",
    createdAt: ENTERED,
  };

  // C — aucune échéance
  const none = evaluateAttentionEscalation({
    sheetId: SHEET,
    sheetTitle: "Alpha",
    code: CODE,
    level: "IMPORTANT",
    primaryReason: "Facturation",
    statusEnteredAt: ENTERED,
    statusEpisodeKey: EPISODE,
    responsibleId: JULIE,
    escalateToId: MARC,
    existingNotifications: [initial],
    now: new Date("2026-08-01T10:00:00.000Z"),
  });
  assert.equal(none.action, "NONE");

  // D — rappel dû
  const remind = evaluateAttentionEscalation({
    sheetId: SHEET,
    sheetTitle: "Alpha",
    code: CODE,
    level: "IMPORTANT",
    primaryReason: "Facturation",
    statusEnteredAt: ENTERED,
    statusEpisodeKey: EPISODE,
    responsibleId: JULIE,
    escalateToId: MARC,
    existingNotifications: [initial],
    now: new Date("2026-08-02T10:00:00.000Z"),
  });
  assert.equal(remind.action, "REMIND");
  assert.equal(remind.dedupeKey, staged(JULIE, "REMINDER_1"));

  // B — 2e passage même état → même clé (idempotence)
  const again = evaluateAttentionEscalation({
    sheetId: SHEET,
    sheetTitle: "Alpha",
    code: CODE,
    level: "IMPORTANT",
    primaryReason: "Facturation",
    statusEnteredAt: ENTERED,
    statusEpisodeKey: EPISODE,
    responsibleId: JULIE,
    escalateToId: MARC,
    existingNotifications: [
      initial,
      {
        dedupeKey: staged(JULIE, "REMINDER_1"),
        userId: JULIE,
        type: "FOLLOWUP_REMINDER",
        createdAt: new Date("2026-08-02T10:00:00.000Z"),
      },
    ],
    now: new Date("2026-08-02T11:00:00.000Z"),
  });
  assert.equal(again.action, "NONE");

  // E — escalade
  const esc = evaluateAttentionEscalation({
    sheetId: SHEET,
    sheetTitle: "Alpha",
    code: CODE,
    level: "IMPORTANT",
    primaryReason: "Facturation",
    statusEnteredAt: ENTERED,
    statusEpisodeKey: EPISODE,
    responsibleId: JULIE,
    escalateToId: MARC,
    responsibleName: "Julie",
    existingNotifications: [
      initial,
      {
        dedupeKey: staged(JULIE, "REMINDER_1"),
        userId: JULIE,
        type: "FOLLOWUP_REMINDER",
        createdAt: new Date("2026-08-02T10:00:00.000Z"),
      },
      {
        dedupeKey: staged(JULIE, "REMINDER_2"),
        userId: JULIE,
        type: "FOLLOWUP_REMINDER",
        createdAt: new Date("2026-08-04T10:00:00.000Z"),
      },
    ],
    now: new Date("2026-08-06T12:00:00.000Z"),
  });
  assert.equal(esc.action, "ESCALATE");
  assert.equal(esc.recipientId, MARC);

  // F — pas d’INITIAL (problème résolu / pas resync) → rien
  const resolved = evaluateAttentionEscalation({
    sheetId: SHEET,
    sheetTitle: "Alpha",
    code: CODE,
    level: "IMPORTANT",
    primaryReason: "Facturation",
    statusEnteredAt: ENTERED,
    statusEpisodeKey: EPISODE,
    responsibleId: JULIE,
    escalateToId: MARC,
    existingNotifications: [],
    now: new Date("2026-08-06T12:00:00.000Z"),
  });
  assert.equal(resolved.action, "NONE");

  // I — job retardé : rappel quand même (délai largement dépassé)
  const late = evaluateAttentionEscalation({
    sheetId: SHEET,
    sheetTitle: "Alpha",
    code: CODE,
    level: "IMPORTANT",
    primaryReason: "Facturation",
    statusEnteredAt: ENTERED,
    statusEpisodeKey: EPISODE,
    responsibleId: JULIE,
    escalateToId: MARC,
    existingNotifications: [initial],
    now: new Date("2026-08-02T12:00:00.000Z"), // prévu ~10h, exécuté 12h
  });
  assert.equal(late.action, "REMIND");
}

/** G/J — secret / now production. */
function testNowHardening() {
  assert.equal(
    canSimulateAttentionNow({
      forceRealNow: true,
      nodeEnv: "production",
      allowSimulatedFlag: "true",
    }),
    false,
  );

  assert.equal(
    canSimulateAttentionNow({
      nodeEnv: "development",
    }),
    true,
  );

  assert.equal(
    canSimulateAttentionNow({
      nodeEnv: "production",
      isDemoSession: true,
    }),
    true,
  );

  assert.equal(
    canSimulateAttentionNow({
      nodeEnv: "production",
      beworkEnv: "demo",
    }),
    true,
  );

  assert.equal(
    canSimulateAttentionNow({
      nodeEnv: "production",
      beworkEnv: "production",
      isDemoSession: false,
      allowSimulatedFlag: "false",
    }),
    false,
  );

  const rejected = resolveAttentionProcessNow({
    requestedNow: "2026-08-10T00:00:00.000Z",
    forceRealNow: true,
  });
  assert.equal(rejected.simulated, false);
  assert.equal(rejected.rejectedSimulation, true);
  // Heure réelle ≈ maintenant (pas la date demandée)
  assert.ok(Math.abs(rejected.now.getTime() - Date.now()) < 60_000);

  const allowed = resolveAttentionProcessNow({
    requestedNow: "2026-08-10T00:00:00.000Z",
    nodeEnv: "development",
  });
  assert.equal(allowed.simulated, true);
  assert.equal(allowed.now.toISOString(), "2026-08-10T00:00:00.000Z");
}

/** G — forme auth cron (secret). */
function testCronSecretShape() {
  const expected = "super-secret-value-abcdef";
  function check(provided: string | null, exp: string | undefined): boolean {
    if (!exp) return false;
    if (!provided) return false;
    if (provided.length !== exp.length) return false;
    let ok = 0;
    for (let i = 0; i < exp.length; i++) {
      ok |= provided.charCodeAt(i) ^ exp.charCodeAt(i);
    }
    return ok === 0;
  }
  assert.equal(check(null, expected), false);
  assert.equal(check("wrong", expected), false);
  assert.equal(check(expected, expected), true);
  assert.equal(check(expected, undefined), false);
}

/** H — isolation tenant via destinataire dans la clé. */
function testTenantIsolation() {
  const a = staged("orgA-marc", "ESCALATION");
  const b = staged("orgB-boss", "ESCALATION");
  assert.notEqual(a, b);
  assert.match(a, /^ATTENTION:orgA-marc:/);
}

function testEpisodeFromEventId() {
  const k = episodeKeyFromStatusTransition({
    eventId: "clxyz123",
    occurredAt: new Date("2026-08-01T10:00:00.000Z"),
  });
  assert.equal(k, "clxyz123");
  const fallback = episodeKeyFromStatusTransition({
    occurredAt: new Date("2026-08-01T10:00:00.000Z"),
  });
  assert.equal(fallback, `t${new Date("2026-08-01T10:00:00.000Z").getTime()}`);
}

const tests: [string, () => void][] = [
  ["A–F/I décisions job", testJobDecisions],
  ["J now arbitraire impossible en prod/cron", testNowHardening],
  ["G secret incorrect / correct", testCronSecretShape],
  ["H isolation tenant", testTenantIsolation],
  ["épisode = eventId timeline", testEpisodeFromEventId],
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
