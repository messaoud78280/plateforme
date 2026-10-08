/**
 * CTX-05 — mapping codes techniques → messages métier (couche UI).
 */
import assert from "node:assert/strict";
import {
  mapPatchErrorToUser,
  sectionMetierLabel,
  syncModeUserHint,
  SECTION_METIER_LABEL,
} from "@/lib/bework-patch/ui-messages";
import type { BeworkPatchSection } from "@/lib/bework-patch/types";

const SECTIONS: BeworkPatchSection[] = [
  "TAKEOFF",
  "QUOTE",
  "PLANNING",
  "VISIT",
  "FOLLOW_UP",
  "REPORT",
  "NOTICE",
];

const EXPECTED_LABELS: Record<BeworkPatchSection, string> = {
  TAKEOFF: "Métré / quantitatif",
  QUOTE: "Devis",
  PLANNING: "Planning chantier",
  VISIT: "Visite & relevés",
  FOLLOW_UP: "Suivi de chantier",
  REPORT: "Compte rendu",
  NOTICE: "Notice explicative",
};

console.log("CTX-05 ui-messages");

// --- Labels métier 7 sections ---
for (const s of SECTIONS) {
  assert.equal(sectionMetierLabel(s), EXPECTED_LABELS[s]);
  assert.equal(SECTION_METIER_LABEL[s], EXPECTED_LABELS[s]);
  // Pas de code technique comme libellé principal
  assert.notEqual(sectionMetierLabel(s), s);
}
console.log("  labels métier 7 sections: ok");

// --- Mapping erreurs ---
const cases: Array<{
  code: string;
  expectTitle: RegExp;
  expectAction: string | null;
  forbid: RegExp;
}> = [
  {
    code: "VERSION_CONFLICT",
    expectTitle: /données ont changé/i,
    expectAction: "reanalyze",
    forbid: /VERSION_CONFLICT|fingerprint|base_version/i,
  },
  {
    code: "PREVIEW_STALE",
    expectTitle: /situation a changé/i,
    expectAction: "reanalyze",
    forbid: /PREVIEW_STALE|fingerprint/i,
  },
  {
    code: "DUPLICATE_PATCH",
    expectTitle: /déjà appliquées/i,
    expectAction: "refresh",
    forbid: /DUPLICATE_PATCH/i,
  },
  {
    code: "TARGET_NOT_FOUND",
    expectTitle: /Impossible/i,
    expectAction: "retry_paste",
    forbid: /TARGET_NOT_FOUND/i,
  },
  {
    code: "PROJECT_MISMATCH",
    expectTitle: /Impossible/i,
    expectAction: "retry_paste",
    forbid: /PROJECT_MISMATCH/i,
  },
  {
    code: "OPERATION_NOT_ALLOWED_FOR_SECTION",
    expectTitle: /non applicables/i,
    expectAction: "retry_paste",
    forbid: /OPERATION_NOT_ALLOWED/i,
  },
  {
    code: "INVALID_JSON",
    expectTitle: /non reconnu/i,
    expectAction: "retry_paste",
    forbid: /INVALID_JSON/i,
  },
  {
    code: "SERVER_ERROR",
    expectTitle: /Impossible/i,
    expectAction: "retry_paste",
    forbid: /SERVER_ERROR/i,
  },
];

for (const c of cases) {
  const mapped = mapPatchErrorToUser({ code: c.code, section: "TAKEOFF" });
  assert.match(mapped.title, c.expectTitle);
  assert.equal(mapped.action, c.expectAction);
  assert.ok(mapped.message.length > 10);
  assert.doesNotMatch(mapped.title, c.forbid);
  assert.doesNotMatch(mapped.message, c.forbid);
}
console.log("  mapping erreurs métier: ok");

// Message serveur métier conservé si déjà clair
const keep = mapPatchErrorToUser({
  code: "VERSION_CONFLICT",
  serverMessage: "Le métré a été modifié par un collègue.",
  section: "TAKEOFF",
});
assert.equal(keep.message, "Le métré a été modifié par un collègue.");
console.log("  conservation message serveur clair: ok");

// Sync mode hints — pas de jargon principal
for (const mode of [
  "FULL_SYNC",
  "SAFE_PARTIAL_SYNC",
  "QUOTE_ONLY",
  "PLANNING_ONLY",
  "VISIT_ONLY",
  "FOLLOW_UP_ONLY",
  "REPORT_ONLY",
  "NOTICE_ONLY",
  "SUPPLY_ONLY",
]) {
  const hint = syncModeUserHint(mode);
  assert.ok(hint.length > 10);
  assert.doesNotMatch(hint, /FULL_SYNC|SAFE_PARTIAL|DIRECT_ONLY/);
}
console.log("  syncMode hints métier: ok");

console.log("CTX-05 ui-messages: PASS");
