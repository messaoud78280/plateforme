/**
 * node --import tsx src/lib/schedule-domain/server-flags.test.ts
 */
import assert from "node:assert/strict";

async function main() {
  const { isPlanningV2ServerEnabled, isPlanningV2CommitEnabled } = await import(
    "./server-flags"
  );

  delete process.env.FF_PLANNING_V2_ENABLED;
  delete process.env.FF_PLANNING_V2_COMMIT_ENABLED;
  assert.equal(isPlanningV2ServerEnabled(), true, "preview default on");
  assert.equal(isPlanningV2CommitEnabled(), true, "commit default on");

  process.env.FF_PLANNING_V2_ENABLED = "true";
  process.env.FF_PLANNING_V2_COMMIT_ENABLED = "false";
  assert.equal(isPlanningV2ServerEnabled(), true);
  assert.equal(isPlanningV2CommitEnabled(), false, "commit kill-switch");

  process.env.FF_PLANNING_V2_COMMIT_ENABLED = "true";
  assert.equal(isPlanningV2CommitEnabled(), true);

  process.env.FF_PLANNING_V2_ENABLED = "false";
  assert.equal(isPlanningV2ServerEnabled(), false, "preview kill-switch");
  assert.equal(isPlanningV2CommitEnabled(), false);

  delete process.env.FF_PLANNING_V2_ENABLED;
  delete process.env.FF_PLANNING_V2_COMMIT_ENABLED;

  const { isFeatureEnabled } = await import("@/lib/feature-flags");
  const prevUi = process.env.NEXT_PUBLIC_FF_PLANNING_V2_UI;
  delete process.env.NEXT_PUBLIC_FF_PLANNING_V2_UI;
  assert.equal(isFeatureEnabled("planningV2Ui"), true, "UI default on (CTA → V2)");
  if (prevUi === undefined) delete process.env.NEXT_PUBLIC_FF_PLANNING_V2_UI;
  else process.env.NEXT_PUBLIC_FF_PLANNING_V2_UI = prevUi;

  console.log(
    JSON.stringify({
      ok: true,
      suite: "server-flags.test.ts",
      uiDefaultOn: true,
      serverPreviewDefaultOn: true,
      commitDefaultOn: true,
    }),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
