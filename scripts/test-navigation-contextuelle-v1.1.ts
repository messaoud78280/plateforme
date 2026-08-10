/**
 * NAVIGATION-CONTEXTUELLE-V1.1 — returnTo + labels + parties chantier.
 * Run: node --import tsx scripts/test-navigation-contextuelle-v1.1.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  contextBackLabelForHref,
  messagerieReturnTo,
  resolveSafeReturnTo,
  sanitizeInternalReturnTo,
  withReturnTo,
} from "../src/lib/navigation/safe-return-to";
import {
  isInternalChantierResponsible,
  resolveChantierHeaderParties,
} from "../src/lib/chantier/party-labels";

function testSafeReturnTo() {
  assert.equal(
    resolveSafeReturnTo("/dashboard/messagerie?task=abc", "/dashboard/projets"),
    "/dashboard/messagerie?task=abc",
  );
  assert.equal(
    sanitizeInternalReturnTo("https://evil.com/phish", "/dashboard/projets"),
    "/dashboard/projets",
  );
  assert.equal(
    sanitizeInternalReturnTo("//evil.com", "/dashboard/projets"),
    "/dashboard/projets",
  );
  assert.equal(
    sanitizeInternalReturnTo("javascript:alert(1)", "/dashboard/projets"),
    "/dashboard/projets",
  );
  assert.equal(
    sanitizeInternalReturnTo("/login", "/dashboard/projets"),
    "/dashboard/projets",
  );
  console.log("✓ returnTo sécurité");
}

function testLabels() {
  assert.equal(
    contextBackLabelForHref("/dashboard/messagerie?task=x"),
    "Retour à la Messagerie",
  );
  assert.equal(contextBackLabelForHref("/dashboard/projets"), "Retour aux chantiers");
  assert.equal(contextBackLabelForHref("/dashboard/a-traiter"), "Retour à À traiter");
  assert.equal(contextBackLabelForHref("/dashboard/commandes"), "Retour aux commandes");
  assert.equal(contextBackLabelForHref("/dashboard/agenda"), "Retour à l'Agenda");
  console.log("✓ libellés contextuels");
}

function testWithReturnTo() {
  const href = withReturnTo(
    "/dashboard/projets/p1",
    messagerieReturnTo({ taskId: "t1" }),
  );
  assert.match(href, /\/dashboard\/projets\/p1/);
  assert.match(href, /returnTo=/);
  assert.match(decodeURIComponent(href), /messagerie\?task=t1/);
  console.log("✓ withReturnTo Messagerie → chantier");
}

function testParties() {
  assert.equal(
    isInternalChantierResponsible({
      name: "Sophie Martin",
      personType: "CLIENT_EXT",
    }),
    false,
  );
  assert.equal(
    isInternalChantierResponsible({
      name: "Karim Benali",
      personType: "INTERNAL",
      permissionProfile: "CONDUCTEUR",
    }),
    true,
  );

  const header = resolveChantierHeaderParties({
    client: {
      name: "Denis Buret",
      personType: "INTERNAL",
      company: "SETRIM",
      role: "CLIENT",
    },
    assignedTo: {
      name: "Sophie Martin",
      personType: "CLIENT_EXT",
    },
    internalManager: "Karim Benali",
    followUpClientName: "Syndic Horizon Copro",
  });
  assert.equal(header.clientLabel, "Syndic Horizon Copro");
  assert.equal(header.responsibleLabel, "Karim Benali");
  assert.equal(header.responsibleIsInternal, true);

  const withKarim = resolveChantierHeaderParties({
    client: { name: "Denis Buret", personType: "INTERNAL", company: "SETRIM" },
    assignedTo: { name: "Karim Benali", personType: "INTERNAL" },
    clientExtLabels: ["Syndic Horizon Copro"],
  });
  assert.equal(withKarim.clientLabel, "Syndic Horizon Copro");
  assert.equal(withKarim.responsibleLabel, "Karim Benali");
  console.log("✓ parties chantier (Denis ≠ client, Sophie ≠ responsable)");
}

function testWiring() {
  const page = readFileSync(
    join(process.cwd(), "src/app/dashboard/projets/[id]/page.tsx"),
    "utf8",
  );
  assert.match(page, /ContextBackButton/);
  assert.match(page, /returnTo/);
  assert.match(page, /resolveChantierHeaderParties/);
  assert.doesNotMatch(page, /BackLink href="\/dashboard\/projets"/);

  const missions = readFileSync(
    join(process.cwd(), "src/components/messagerie/MessagerieMissionsView.tsx"),
    "utf8",
  );
  assert.match(missions, /withReturnTo/);
  assert.match(missions, /messagerieReturnTo/);
  assert.match(missions, /variant="menu"/);
  assert.doesNotMatch(missions, /VoiceRecorder|voiceOpen|title="Message vocal"/);

  const deleteBtn = readFileSync(
    join(process.cwd(), "src/components/tasks/DeleteTaskButton.tsx"),
    "utf8",
  );
  assert.match(deleteBtn, /Supprimer la mission/);

  const view = readFileSync(
    join(process.cwd(), "src/components/messagerie/MessagerieView.tsx"),
    "utf8",
  );
  assert.match(view, /withReturnTo/);
  assert.doesNotMatch(view, /VoiceRecorder|voiceOpen|title="Message vocal"/);
  console.log("✓ câblage pages + absence micro");
}

testSafeReturnTo();
testLabels();
testWithReturnTo();
testParties();
testWiring();
console.log("\nTous les tests NAVIGATION-CONTEXTUELLE-V1.1 OK.");
