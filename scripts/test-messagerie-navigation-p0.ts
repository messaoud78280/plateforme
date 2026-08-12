/**
 * P0 — Navigation Messagerie Discussions ↔ Par chantier
 * Run: node --import tsx scripts/test-messagerie-navigation-p0.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildMessagerieChantierUrl,
  buildMessagerieMissionsUrl,
  buildMessagerieUrl,
  resolveMessagerieView,
} from "../src/lib/messagerie/messaging-url";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function params(qs: string) {
  return new URLSearchParams(qs);
}

function testResolveView() {
  assert.equal(resolveMessagerieView(params("")), "missions");
  assert.equal(resolveMessagerieView(params(""), true), "chantiers");
  assert.equal(resolveMessagerieView(params("view=missions")), "missions");
  assert.equal(resolveMessagerieView(params("view=discussions")), "missions");
  assert.equal(resolveMessagerieView(params("view=chantiers")), "chantiers");
  assert.equal(
    resolveMessagerieView(params("view=chantiers&project=proj1")),
    "chantiers",
  );
  assert.equal(
    resolveMessagerieView(params("view=chantiers&project=proj1&channelId=ch1")),
    "chantiers",
  );
  assert.equal(resolveMessagerieView(params("task=abc")), "missions");
  assert.equal(resolveMessagerieView(params("with=user1")), "missions");
  assert.equal(resolveMessagerieView(params("channelId=ch1")), "chantiers");
  // Vue explicite missions prime sur channelId résidu
  assert.equal(
    resolveMessagerieView(params("view=missions&channelId=ch1")),
    "missions",
  );
  console.log("✓ resolveMessagerieView");
}

function testBuildUrls() {
  assert.equal(
    buildMessagerieMissionsUrl(),
    "/dashboard/messagerie?view=missions",
  );
  assert.equal(
    buildMessagerieChantierUrl(),
    "/dashboard/messagerie?view=chantiers",
  );
  assert.equal(
    buildMessagerieChantierUrl({ project: "proj1" }),
    "/dashboard/messagerie?view=chantiers&project=proj1",
  );
  assert.equal(
    buildMessagerieChantierUrl({
      project: "proj1",
      channelId: "ch1",
      channel: "INTERNE",
    }),
    "/dashboard/messagerie?view=chantiers&project=proj1&channelId=ch1&channel=INTERNE",
  );
  assert.equal(
    buildMessagerieMissionsUrl({ task: "task1" }),
    "/dashboard/messagerie?view=missions&task=task1",
  );
  assert.equal(
    buildMessagerieMissionsUrl({ with: "user1" }),
    "/dashboard/messagerie?view=missions&with=user1",
  );

  // Discussions depuis chantier+sélection : plus de project résidu
  const fromChantier = buildMessagerieMissionsUrl();
  assert.ok(!fromChantier.includes("project="));
  assert.ok(!fromChantier.includes("channelId="));
  assert.ok(!fromChantier.includes("channel="));

  // Par chantier depuis discussions : plus de task/with
  const fromMissions = buildMessagerieChantierUrl();
  assert.ok(!fromMissions.includes("task="));
  assert.ok(!fromMissions.includes("with="));

  assert.equal(
    buildMessagerieUrl({ view: "chantiers", project: null }),
    "/dashboard/messagerie?view=chantiers",
  );
  console.log("✓ buildMessagerieUrl / variantes");
}

function testHubUsesUrlNavigation() {
  const hub = read("src/components/messagerie/MessagerieHub.tsx");
  assert.match(hub, /resolveMessagerieView/);
  assert.match(hub, /buildMessagerieMissionsUrl/);
  assert.match(hub, /buildMessagerieChantierUrl/);
  assert.match(hub, /router\.push/);
  assert.doesNotMatch(hub, /setUserView/);
  assert.doesNotMatch(hub, /forceChantiers/);
  console.log("✓ MessagerieHub — URL source de vérité, pas de setUserView");
}

function testChildViewsUseSharedBuilder() {
  const missions = read("src/components/messagerie/MessagerieMissionsView.tsx");
  const view = read("src/components/messagerie/MessagerieView.tsx");
  assert.match(missions, /buildMessagerieMissionsUrl/);
  assert.match(missions, /buildMessagerieChantierUrl/);
  assert.match(view, /buildMessagerieChantierUrl/);
  console.log("✓ vues enfants — builders partagés");
}

testResolveView();
testBuildUrls();
testHubUsesUrlNavigation();
testChildViewsUseSharedBuilder();
console.log("\n✅ test-messagerie-navigation-p0 OK");
