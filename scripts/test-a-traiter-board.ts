/**
 * Tests W3-B — tri / filtre / regroupement À traiter
 * Exécuter : npx tsx scripts/test-a-traiter-board.ts
 */
import assert from "node:assert/strict";
import {
  buildAttentionCard,
  filterAttentionCards,
  groupAttentionCards,
  sortAttentionCards,
  countHotAttention,
  type ATraiterAttentionCard,
} from "../src/lib/a-traiter/attention-board";
import type { SerializedAttention } from "../src/lib/follow-up/attention";

function att(
  level: SerializedAttention["effectiveUrgency"],
  reason: string,
  code: SerializedAttention["attentionItems"][0]["code"] = "STEP_OVERDUE",
): SerializedAttention {
  return {
    effectiveUrgency: level,
    computedUrgency: level,
    manualUrgency: null,
    primaryReason: reason,
    attentionItems: [
      {
        code,
        level,
        reason,
        actionLabel: null,
        dueAt: null,
        overdueByHours: null,
        relatedEntity: null,
      },
    ],
  };
}

function card(
  id: string,
  level: SerializedAttention["effectiveUrgency"],
  reason: string,
  extra?: Partial<ATraiterAttentionCard>,
): ATraiterAttentionCard {
  const built = buildAttentionCard({
    sheet: {
      id,
      title: `Fiche ${id}`,
      status: "A_PLANIFIER",
      nextAction: "Agir",
      nextActionAt: extra?.nextActionAt ?? "2026-08-10T08:00:00.000Z",
      assigneeId: extra?.assigneeId ?? "u1",
      assigneeName: extra?.assigneeName ?? "Karim",
      clientName: extra?.clientName ?? "ABC",
      projectTitle: extra?.projectTitle ?? "Chantier",
    },
    attention: att(level, reason),
  });
  assert.ok(built);
  return { ...built!, ...extra };
}

function testNormalExcluded() {
  const c = buildAttentionCard({
    sheet: { id: "n", title: "OK", status: "PLANIFIE" },
    attention: att("NORMAL", null as unknown as string),
  });
  // force empty
  const empty = buildAttentionCard({
    sheet: { id: "n", title: "OK", status: "PLANIFIE" },
    attention: {
      effectiveUrgency: "NORMAL",
      computedUrgency: "NORMAL",
      manualUrgency: null,
      primaryReason: null,
      attentionItems: [],
    },
  });
  assert.equal(empty, null);
  void c;
}

function testSortOrder() {
  const list = [
    card("w", "A_SURVEILLER", "watch"),
    card("c", "CRITIQUE", "crit"),
    card("i", "IMPORTANT", "imp"),
    card("u", "URGENT", "urg"),
  ].sort(sortAttentionCards);
  assert.deepEqual(
    list.map((x) => x.effectiveUrgency),
    ["CRITIQUE", "URGENT", "IMPORTANT", "A_SURVEILLER"],
  );
}

function testOneCardMultipleReasons() {
  const built = buildAttentionCard({
    sheet: { id: "1", title: "Alpha", status: "A_FACTURER" },
    attention: {
      effectiveUrgency: "URGENT",
      computedUrgency: "URGENT",
      manualUrgency: null,
      primaryReason: "Travaux terminés depuis 5 jours — facturation à préparer",
      attentionItems: [
        {
          code: "BILLING_PENDING",
          level: "URGENT",
          reason: "Travaux terminés depuis 5 jours — facturation à préparer",
          actionLabel: null,
          dueAt: null,
          overdueByHours: 120,
          relatedEntity: null,
        },
        {
          code: "DUE_TODAY",
          level: "URGENT",
          reason: "Échéance aujourd’hui",
          actionLabel: null,
          dueAt: null,
          overdueByHours: null,
          relatedEntity: null,
        },
      ],
    },
  });
  assert.ok(built);
  assert.equal(built!.otherReasonsCount, 1);
  assert.equal(built!.category, "FACTURATION");
}

function testFilterMineAndSearch() {
  const cards = [
    card("a", "URGENT", "Alpha", { assigneeId: "karim", assigneeName: "Karim", title: "Immeuble Alpha" }),
    card("b", "IMPORTANT", "Jardins", {
      assigneeId: "marc",
      assigneeName: "Marc",
      title: "Les Jardins",
      clientName: "ABC Promotion",
    }),
  ];
  // patch titles after build
  cards[0]!.title = "Immeuble Alpha";
  cards[1]!.title = "Les Jardins";

  const mine = filterAttentionCards(cards, { mineOnly: true, currentUserId: "karim" });
  assert.equal(mine.length, 1);
  assert.equal(mine[0]!.subjectId, "a");
  assert.equal(mine[0]!.subjectType, "FOLLOW_UP");

  const search = filterAttentionCards(cards, { q: "jardin" });
  assert.equal(search.length, 1);
  assert.equal(search[0]!.subjectId, "b");
}

function testGroupAndHot() {
  const cards = [
    card("c", "CRITIQUE", "c"),
    card("u", "URGENT", "u"),
    card("i", "IMPORTANT", "i"),
  ];
  const groups = groupAttentionCards(cards);
  assert.equal(groups[0]!.urgency, "CRITIQUE");
  assert.equal(countHotAttention(cards), 2);
}

const tests: [string, () => void][] = [
  ["NORMAL absente", testNormalExcluded],
  ["tri CRITIQUE → … → WATCH", testSortOrder],
  ["plusieurs raisons → une carte", testOneCardMultipleReasons],
  ["filtre Mes actions + recherche", testFilterMineAndSearch],
  ["groupes + hot count", testGroupAndHot],
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
if (failed) {
  process.exit(1);
}
console.log(`\n${tests.length} tests OK`);
