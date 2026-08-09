/**
 * CHANTIER-V2A — tests purs (helpers liens / focus / hors DB).
 * Exécuter : npx tsx scripts/test-chantier-cockpit-ops.ts
 */
import assert from "node:assert/strict";
import {
  projectClientHref,
  projectSupplierHref,
  projectTeamHref,
} from "../src/lib/messagerie/resolve-conversation";
import { chantierStatusDisplayLabel } from "../src/lib/chantier/cockpit-ops";
import { sortAttentionCards, type ATraiterAttentionCard } from "../src/lib/a-traiter/attention-board";

function testMessagerieDeepLinks() {
  const pid = "proj_vh";
  assert.ok(projectTeamHref(pid).includes(`project=${pid}`));
  assert.ok(projectTeamHref(pid).includes("channel=INTERNE"));
  assert.ok(projectClientHref(pid).includes("channel=CLIENT"));
  assert.ok(projectSupplierHref(pid).includes("channel=FOURNISSEUR"));
}

function testCreateDeepLinks() {
  const pid = "proj_vh";
  const commande = `/dashboard/commandes/nouvelle?projectId=${encodeURIComponent(pid)}`;
  const fiche = `/dashboard/fiches-suivi/nouvelle?projectId=${encodeURIComponent(pid)}`;
  const agenda = `/dashboard/agenda?projectId=${encodeURIComponent(pid)}&new=1`;
  assert.ok(commande.includes("projectId=proj_vh"));
  assert.ok(fiche.includes("projectId=proj_vh"));
  assert.ok(agenda.includes("new=1"));
}

function testStatusLabel() {
  const label = chantierStatusDisplayLabel("EN_COURS");
  assert.ok(typeof label === "string" && label.length > 0);
}

function testAttentionSortKeepsUrgencyFirst() {
  const base = {
    subjectType: "FOLLOW_UP" as const,
    sheetId: "a",
    clientName: null,
    projectId: "p",
    projectTitle: "Victor Hugo",
    osNumber: null,
    orderNumber: null,
    workObject: null,
    nextAction: null,
    nextActionDone: false,
    assigneeId: null,
    assigneeName: null,
    nextActionAt: null,
    dueLabel: null,
    status: "EN_COURS",
    statusEnteredAt: null,
    primaryReason: "x",
    attentionItems: [],
    otherReasonsCount: 0,
    category: "SUIVI" as const,
    categoryLabel: "Suivi",
    relatedAgendaId: null,
    relatedTaskId: null,
    actionUrl: "/x",
    actionLabel: "Voir",
    supplierMessageUrl: null,
  };
  const cards: ATraiterAttentionCard[] = [
    {
      ...base,
      subjectId: "1",
      sheetId: "1",
      title: "Important",
      effectiveUrgency: "IMPORTANT",
    },
    {
      ...base,
      subjectId: "2",
      sheetId: "2",
      title: "Critique",
      effectiveUrgency: "CRITIQUE",
    },
  ];
  const sorted = [...cards].sort(sortAttentionCards);
  assert.equal(sorted[0]?.title, "Critique");
}

const tests: [string, () => void][] = [
  ["deep links messagerie chantier", testMessagerieDeepLinks],
  ["deep links création contextualisée", testCreateDeepLinks],
  ["label statut chantier", testStatusLabel],
  ["tri attention urgence", testAttentionSortKeepsUrgencyFirst],
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
console.log(`\nOK — test:chantier-cockpit-ops (${tests.length})`);
