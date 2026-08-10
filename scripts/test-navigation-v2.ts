/**
 * NAVIGATION-V2 — chemins contextuels + présentation chantier.
 * Run: node --import tsx scripts/test-navigation-v2.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildContextualHref,
  contextBackLabelForHref,
  messagerieReturnTo,
  resolveSafeReturnTo,
  stripNestedReturnTo,
  withReturnTo,
} from "../src/lib/navigation/safe-return-to";
import { buildProjectPresentation } from "../src/lib/chantier/party-labels";

function testConversationLabel() {
  const href = messagerieReturnTo({
    projectId: "p1",
    channelId: "c1",
  });
  assert.equal(contextBackLabelForHref(href), "Retour à la conversation");
  assert.equal(
    contextBackLabelForHref("/dashboard/messagerie"),
    "Retour à la Messagerie",
  );
  assert.equal(contextBackLabelForHref("/dashboard/projets"), "Retour aux chantiers");
  console.log("✓ libellé Retour à la conversation");
}

function testNoNestedReturnTo() {
  const nested = withReturnTo(
    "/dashboard/projets/p1?returnTo=%2Fdashboard%2Fmessagerie",
    messagerieReturnTo({ projectId: "p1", channelId: "c1" }),
  );
  assert.doesNotMatch(nested, /returnTo=.*returnTo/);
  const stripped = stripNestedReturnTo(
    "/dashboard/messagerie?view=chantiers&returnTo=/dashboard/projets/x",
  );
  assert.doesNotMatch(stripped, /returnTo/);
  assert.equal(buildContextualHref, withReturnTo);
  console.log("✓ pas de returnTo imbriqué");
}

function testSecurity() {
  assert.equal(
    resolveSafeReturnTo("https://evil.test/x", "/dashboard/projets"),
    "/dashboard/projets",
  );
  console.log("✓ sécurité returnTo");
}

function testPresentationDenisNotClient() {
  const p = buildProjectPresentation({
    title: "Résidence Les Jardins",
    client: {
      name: "Denis Buret",
      company: "SETRIM",
      personType: "INTERNAL",
      role: "CLIENT",
    },
    assignedTo: null,
    hostOrganizationName: "SETRIM",
    clientOrganizationName: "ABC Promotion",
    followUpClientName: null,
  });
  assert.equal(p.clientLabel, "ABC Promotion");
  assert.notEqual(p.clientLabel, "Denis Buret");
  assert.equal(p.responsibleDisplay, "Responsable à définir");

  const withSophie = buildProjectPresentation({
    title: "Les Jardins",
    client: { name: "Denis Buret", personType: "INTERNAL", company: "SETRIM" },
    assignedTo: { name: "Sophie Martin", personType: "CLIENT_EXT" },
    hostOrganizationName: "SETRIM",
    clientExtLabels: ["ABC Promotion"],
    internalManager: "Karim Benali",
  });
  assert.equal(withSophie.clientLabel, "ABC Promotion");
  assert.equal(withSophie.responsibleLabel, "Karim Benali");
  console.log("✓ Denis ≠ client · Sophie ≠ responsable");
}

function testWiring() {
  const page = readFileSync(
    join(process.cwd(), "src/app/dashboard/projets/[id]/page.tsx"),
    "utf8",
  );
  assert.match(page, /buildProjectPresentation/);
  assert.match(page, /Retour à la conversation|contextBackLabelForHref/);
  assert.match(page, /withReturnTo\(\s*projectTeamHref/);
  assert.match(page, /type: "CLIENT"/);

  const view = readFileSync(
    join(process.cwd(), "src/components/messagerie/MessagerieView.tsx"),
    "utf8",
  );
  assert.match(view, /Vous consultez cette conversation en supervision/);
  assert.match(view, /role="dialog"/);
  assert.doesNotMatch(view, /text-violet-700/);
  console.log("✓ câblage V2");
}

testConversationLabel();
testNoNestedReturnTo();
testSecurity();
testPresentationDenisNotClient();
testWiring();
console.log("\nTous les tests NAVIGATION-V2 OK.");
