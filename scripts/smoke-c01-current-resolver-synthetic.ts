/**
 * Smoke C-01 sans I/O — snapshot lecture SQL du 2026-10-03.
 * Valide resolveCurrent / resolveSchedulePlanForScope × 5.
 */
import assert from "node:assert/strict";
import {
  resolveCurrentSchedulePlan,
  resolveSchedulePlanForScope,
} from "../src/lib/chantier/resolve-workspace-entities";

const SCOPE = "cmui2yaj20001dli4kof4j59b";
const STUDY = "cmuh6cy4c000y1423lqo85g5v";
const EXPECTED = "cmus31wp300029r8m7mxw0d04";
const OLD = "cmui103dx0002scx8q99joufl";

const plans = [
  {
    id: EXPECTED,
    studyId: STUDY,
    scopeId: SCOPE,
    status: "CURRENT",
    revisionKind: "CURRENT",
    revisionNumber: 2,
    studyVersionAtGeneration: 4,
    createdAt: "2026-10-03T07:41:00.999Z",
  },
  {
    id: "cmus2gpmm003ivfsmad3hafw2",
    studyId: STUDY,
    scopeId: null,
    status: "ARCHIVED",
    revisionKind: "CURRENT",
    revisionNumber: 2,
    createdAt: "2026-10-03T07:24:32.063Z",
  },
  {
    id: OLD,
    studyId: STUDY,
    scopeId: SCOPE,
    status: "ARCHIVED",
    revisionKind: "INITIAL",
    revisionNumber: 1,
    createdAt: "2026-09-26T06:45:55.365Z",
  },
];

const scope = {
  id: SCOPE,
  referenceStudyId: STUDY,
  referenceQuoteId: null as string | null,
  referenceSchedulePlanId: EXPECTED,
};

for (let i = 0; i < 5; i++) {
  assert.equal(resolveCurrentSchedulePlan(plans)?.id, EXPECTED);
  assert.equal(
    resolveSchedulePlanForScope({ plans, scope, studyId: STUDY })?.id,
    EXPECTED,
  );
}
assert.notEqual(resolveCurrentSchedulePlan(plans)?.id, OLD);
console.log("C-01 synthetic smoke OK", EXPECTED, "×5 · 0 écriture");
