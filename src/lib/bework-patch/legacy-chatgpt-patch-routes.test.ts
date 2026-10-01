/**
 * Phase A — les handlers commit/undo legacy doivent court-circuiter apply* quand gate OFF.
 * npx tsx src/lib/bework-patch/legacy-chatgpt-patch-routes.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isLegacyChatgptPatchWritesEnabled,
  LEGACY_CHATGPT_PATCH_DISABLED_CODE,
} from "./legacy-chatgpt-patch-gate";

const root = join(process.cwd(), "src/app/api");

const routes = [
  "commercial/quotes/[id]/chatgpt-patch/commit/route.ts",
  "commercial/quotes/[id]/chatgpt-patch/undo/route.ts",
  "prep-studies/[id]/chatgpt-patch/commit/route.ts",
  "prep-studies/[id]/chatgpt-patch/undo/route.ts",
];

for (const rel of routes) {
  const src = readFileSync(join(root, rel), "utf8");
  assert.match(
    src,
    /isLegacyChatgptPatchWritesEnabled/,
    `${rel}: gate manquant`,
  );
  assert.match(src, /status:\s*410/, `${rel}: 410 manquant`);
  assert.match(
    src,
    /LEGACY_CHATGPT_PATCH_DISABLED|legacyChatgptPatchDisabledBody/,
    `${rel}: code manquant`,
  );
  // Gate avant appel apply (ignore imports)
  const gateIdx = src.indexOf("isLegacyChatgptPatchWritesEnabled()");
  const applyCallIdx = Math.max(
    src.indexOf("await applyQuotePatch"),
    src.indexOf("await applyPrepPatch"),
    src.indexOf("await undoLastQuotePatch"),
    src.indexOf("await undoLastPrepPatch"),
  );
  if (applyCallIdx >= 0) {
    assert.ok(gateIdx >= 0 && gateIdx < applyCallIdx, `${rel}: gate doit précéder await apply/undo`);
  }
  console.log(`route ${rel}: gate+410 ok`);
}

assert.equal(isLegacyChatgptPatchWritesEnabled(), false);
assert.equal(LEGACY_CHATGPT_PATCH_DISABLED_CODE, "LEGACY_CHATGPT_PATCH_DISABLED");

// UI: legacyCommit prop absente
{
  const toolbar = readFileSync(
    join(process.cwd(), "src/components/bework-patch/BeworkPatchToolbar.tsx"),
    "utf8",
  );
  assert.doesNotMatch(toolbar, /legacyCommit/);
  const modal = readFileSync(
    join(process.cwd(), "src/components/bework-patch/BeworkPatchModal.tsx"),
    "utf8",
  );
  assert.doesNotMatch(modal, /legacyCommit/);
  console.log("UI toolbar/modal: legacyCommit removed");
}

// Undo CTA absents
{
  const quote = readFileSync(
    join(process.cwd(), "src/components/commercial/QuoteEditor.tsx"),
    "utf8",
  );
  assert.doesNotMatch(quote, /chatgpt-patch\/undo/);
  assert.doesNotMatch(quote, /legacyCommit/);
  const prep = readFileSync(
    join(process.cwd(), "src/components/preparation/PrepStudyWorkspace.tsx"),
    "utf8",
  );
  assert.doesNotMatch(prep, /chatgpt-patch\/undo/);
  assert.doesNotMatch(prep, /legacyCommit/);
  console.log("UI Quote/Prep: undo legacy CTA removed");
}

console.log("\nlegacy-chatgpt-patch-routes: ALL PASS");
