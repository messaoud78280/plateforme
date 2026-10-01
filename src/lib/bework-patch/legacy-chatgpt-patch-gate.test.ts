/**
 * Phase A — gate legacy chatgpt-patch writes.
 * npx tsx src/lib/bework-patch/legacy-chatgpt-patch-gate.test.ts
 */
import assert from "node:assert/strict";
import {
  isLegacyChatgptPatchWritesEnabled,
  LEGACY_CHATGPT_PATCH_DISABLED_CODE,
  legacyChatgptPatchDisabledBody,
} from "./legacy-chatgpt-patch-gate";
import { getSectionCapability } from "./capability";

// Default: disabled
{
  const prev = process.env.LEGACY_CHATGPT_PATCH_WRITES_ENABLED;
  delete process.env.LEGACY_CHATGPT_PATCH_WRITES_ENABLED;
  assert.equal(isLegacyChatgptPatchWritesEnabled(), false);
  if (prev !== undefined) process.env.LEGACY_CHATGPT_PATCH_WRITES_ENABLED = prev;
  console.log("A — default FALSE: ok");
}

// Explicit true
{
  const prev = process.env.LEGACY_CHATGPT_PATCH_WRITES_ENABLED;
  process.env.LEGACY_CHATGPT_PATCH_WRITES_ENABLED = "true";
  assert.equal(isLegacyChatgptPatchWritesEnabled(), true);
  if (prev === undefined) delete process.env.LEGACY_CHATGPT_PATCH_WRITES_ENABLED;
  else process.env.LEGACY_CHATGPT_PATCH_WRITES_ENABLED = prev;
  console.log("B — env true enables: ok");
}

// Body contract
{
  const q = legacyChatgptPatchDisabledBody("quote");
  assert.equal(q.code, LEGACY_CHATGPT_PATCH_DISABLED_CODE);
  assert.equal(q.writePerformed, false);
  assert.equal(q.section, "QUOTE");
  const p = legacyChatgptPatchDisabledBody("prep");
  assert.equal(p.section, "TAKEOFF");
  assert.equal(p.writePerformed, false);
  console.log("C — 410 body contract: ok");
}

// Universal capabilities intact
{
  assert.equal(getSectionCapability("QUOTE").mode, "AVAILABLE");
  assert.equal(getSectionCapability("TAKEOFF").mode, "AVAILABLE");
  console.log("D — QUOTE/TAKEOFF AVAILABLE: ok");
}

console.log("\nlegacy-chatgpt-patch-gate: ALL PASS");
