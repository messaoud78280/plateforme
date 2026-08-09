/**
 * MESSAGERIE-V2C.3 — tests locaux (sans DB).
 * npx tsx scripts/test-messagerie-party-type-v2c3.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  formatPartyBadge,
  resolveMessagingPartyType,
} from "../src/lib/messagerie/party-type";

function testPersonas() {
  assert.equal(
    resolveMessagingPartyType({
      personType: "INTERNAL",
      permissionProfile: "DIRECTION",
    }).shortLabel,
    "Interne",
  );
  assert.equal(
    resolveMessagingPartyType({
      personType: "INTERNAL",
      permissionProfile: "CONDUCTEUR",
    }).partyType,
    "INTERNAL",
  );
  assert.equal(
    resolveMessagingPartyType({
      personType: "INTERNAL",
      permissionProfile: "ADMINISTRATIF",
    }).partyType,
    "INTERNAL",
  );
  const sophie = resolveMessagingPartyType({
    personType: "CLIENT_EXT",
    permissionProfile: "CLIENT",
    // Même si role legacy CLIENT — personType gagne
    legacyRole: "CLIENT",
  });
  assert.equal(sophie.partyType, "CLIENT");
  assert.equal(sophie.shortLabel, "Client · Externe");
  assert.equal(sophie.external, true);

  const thomas = resolveMessagingPartyType({
    personType: "SUPPLIER",
    permissionProfile: "FOURNISSEUR",
    externalOrgType: "SUPPLIER",
  });
  assert.equal(thomas.partyType, "SUPPLIER");
  assert.equal(thomas.shortLabel, "Fournisseur · Externe");
  console.log("ok personas Marc/Karim/Julie/Sophie/Thomas");
}

function testPointPMission() {
  const po = resolveMessagingPartyType({
    taskCategory: "Bon de commande",
    titleHint: "POINT.P — Résidence Victor Hugo (BC-2026-043)",
  });
  assert.equal(po.partyType, "SUPPLIER");
  assert.ok(!po.shortLabel.includes("Client"));

  const byChannel = resolveMessagingPartyType({ channel: "FOURNISSEUR" });
  assert.equal(byChannel.partyType, "SUPPLIER");

  // Ne pas classer Interne uniquement parce qu’un User.role=CLIENT existe
  const ambiguous = resolveMessagingPartyType({ legacyRole: "CLIENT" });
  assert.equal(ambiguous.partyType, "CLIENT");
  assert.notEqual(ambiguous.partyType, "INTERNAL");
  console.log("ok Point.P / BC = Fournisseur");
}

function testNoFallbackUserOnly() {
  // Sans aucune donnée fiable → PARTNER (pas Interne)
  const empty = resolveMessagingPartyType({});
  assert.equal(empty.partyType, "PARTNER");
  assert.equal(formatPartyBadge(empty).includes("Interne"), false);
  console.log("ok pas de fallback Interne silencieux");
}

function testUiWiring() {
  const hub = readFileSync(
    join(process.cwd(), "src/components/messagerie/MessagerieHub.tsx"),
    "utf8",
  );
  assert.ok(!hub.includes("comme WhatsApp"));
  assert.ok(hub.includes("Par chantier"));

  const missions = readFileSync(
    join(process.cwd(), "src/components/messagerie/MessagerieMissionsView.tsx"),
    "utf8",
  );
  assert.ok(missions.includes("resolveMessagingPartyType"));
  assert.ok(missions.includes("À qui souhaitez-vous écrire"));
  assert.ok(missions.includes("directAttemptedSend"));
  // Plus de hardcode Client · Externe sur MissionRow
  assert.ok(!missions.includes('text-orange-700">\n              Client · Externe'));

  const view = readFileSync(
    join(process.cwd(), "src/components/messagerie/MessagerieView.tsx"),
    "utf8",
  );
  assert.ok(view.includes("Contexte chantier"));
  assert.ok(!view.includes("Crédits estimés"));
  assert.ok(!view.includes("Voir la demande"));
  assert.ok(!view.includes("Changer priorité"));

  const seed = readFileSync(
    join(process.cwd(), "src/lib/demo-environment/seed.ts"),
    "utf8",
  );
  assert.ok(seed.includes("Sophie Lefèvre"));
  assert.ok(seed.includes("Karim Adjaili"));
  console.log("ok wiring UI + seed homonymes");
}

function main() {
  testPersonas();
  testPointPMission();
  testNoFallbackUserOnly();
  testUiWiring();
  console.log("\nMESSAGERIE-V2C.3 — ALL PASS");
}

main();
