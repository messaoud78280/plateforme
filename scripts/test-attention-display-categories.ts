/**
 * ATTENTION-UI-2 — agrégation catégories (purs).
 * npx tsx scripts/test-attention-display-categories.ts
 */
import assert from "node:assert/strict";
import type { ATraiterAttentionCard } from "../src/lib/a-traiter/attention-board";
import {
  buildAttentionDisplayCategories,
  filterCardsByDisplayCategory,
  getAttentionDisplayCategory,
  parseAttentionDisplayTypeParam,
} from "../src/lib/a-traiter/display-categories";

function card(
  partial: Partial<ATraiterAttentionCard> &
    Pick<ATraiterAttentionCard, "subjectType" | "category" | "effectiveUrgency" | "subjectId">,
): ATraiterAttentionCard {
  return {
    sheetId: partial.subjectId,
    title: partial.title ?? "Titre",
    clientName: null,
    projectId: null,
    projectTitle: null,
    osNumber: null,
    orderNumber: null,
    workObject: null,
    nextAction: null,
    nextActionDone: false,
    assigneeId: null,
    assigneeName: null,
    nextActionAt: partial.nextActionAt ?? null,
    dueLabel: null,
    status: "X",
    statusEnteredAt: null,
    primaryReason: null,
    attentionItems: partial.attentionItems ?? [],
    otherReasonsCount: 0,
    categoryLabel: partial.category,
    relatedAgendaId: null,
    relatedTaskId: null,
    actionUrl: "/dashboard/a-traiter",
    actionLabel: "Ouvrir",
    supplierMessageUrl: null,
    ...partial,
  };
}

function testClassification() {
  assert.equal(
    getAttentionDisplayCategory({ subjectType: "ANNUAL_CONTRACT", category: "INTERVENTION" }),
    "annual_contract",
  );
  assert.equal(
    getAttentionDisplayCategory({ subjectType: "ANNUAL_CONTRACT", category: "FACTURATION" }),
    "billing",
  );
  assert.equal(
    getAttentionDisplayCategory({ subjectType: "PURCHASE_ORDER", category: "LIVRAISON" }),
    "purchase_order",
  );
  assert.equal(
    getAttentionDisplayCategory({ subjectType: "FOLLOW_UP", category: "FACTURATION" }),
    "billing",
  );
  assert.equal(
    getAttentionDisplayCategory({ subjectType: "FOLLOW_UP", category: "SUIVI" }),
    "tasks_followup",
  );
}

function testNoMonopoly() {
  const cards = [
    ...Array.from({ length: 8 }, (_, i) =>
      card({
        subjectType: "ANNUAL_CONTRACT",
        category: "INTERVENTION",
        effectiveUrgency: "CRITIQUE",
        subjectId: `a${i}`,
        nextActionAt: "2026-01-20T00:00:00.000Z",
      }),
    ),
    card({
      subjectType: "PURCHASE_ORDER",
      category: "LIVRAISON",
      effectiveUrgency: "URGENT",
      subjectId: "po1",
      nextActionAt: "2026-01-18T00:00:00.000Z",
    }),
    card({
      subjectType: "FOLLOW_UP",
      category: "FACTURATION",
      effectiveUrgency: "IMPORTANT",
      subjectId: "f1",
    }),
    card({
      subjectType: "FOLLOW_UP",
      category: "SUIVI",
      effectiveUrgency: "IMPORTANT",
      subjectId: "f2",
    }),
  ];
  const cats = buildAttentionDisplayCategories(cards, { limit: 4 });
  assert.equal(cats.length, 4);
  assert.equal(cats[0]!.id, "annual_contract");
  assert.equal(cats[0]!.count, 8);
  assert.ok(cats.some((c) => c.id === "purchase_order"));
  assert.ok(cats.some((c) => c.id === "billing"));
  assert.ok(cats.some((c) => c.id === "tasks_followup"));
  const sum = cats.reduce((s, c) => s + c.count, 0);
  assert.equal(sum, cards.length);
}

function testNoEmptyNoDouble() {
  const cards = [
    card({
      subjectType: "PURCHASE_ORDER",
      category: "COMMANDE",
      effectiveUrgency: "CRITIQUE",
      subjectId: "1",
    }),
    card({
      subjectType: "PURCHASE_ORDER",
      category: "LIVRAISON",
      effectiveUrgency: "URGENT",
      subjectId: "2",
    }),
  ];
  const cats = buildAttentionDisplayCategories(cards, { limit: 4 });
  assert.equal(cats.length, 1);
  assert.equal(cats[0]!.count, 2);
  assert.equal(filterCardsByDisplayCategory(cards, "purchase_order").length, 2);
  assert.equal(filterCardsByDisplayCategory(cards, "annual_contract").length, 0);
}

function testTypeParam() {
  assert.equal(parseAttentionDisplayTypeParam("annual-contract"), "annual_contract");
  assert.equal(parseAttentionDisplayTypeParam("billing"), "billing");
  assert.equal(parseAttentionDisplayTypeParam("nope"), "all");
  assert.equal(parseAttentionDisplayTypeParam(null), "all");
}

const tests: [string, () => void][] = [
  ["classification structurée", testClassification],
  ["pas de monopole 8 CE → 1 carte + autres familles", testNoMonopoly],
  ["pas de carte vide / pas de double comptage", testNoEmptyNoDouble],
  ["parse ?type=", testTypeParam],
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
console.log(`\nOK — test-attention-display-categories (${tests.length})`);
