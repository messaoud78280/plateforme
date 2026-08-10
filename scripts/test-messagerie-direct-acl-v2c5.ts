/**
 * MESSAGERIE-HOTFIX-V2C.5 — ACL directe alignée selector / POST.
 * npx tsx scripts/test-messagerie-direct-acl-v2c5.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateDirectMessageAcl,
  type DirectAclUser,
} from "../src/lib/messaging/direct-acl";

function actor(
  partial: Partial<DirectAclUser> & Pick<DirectAclUser, "id" | "role">,
): DirectAclUser {
  return {
    personType: null,
    permissionProfile: null,
    accessStatus: "ACTIVE",
    email: null,
    organizationIds: [],
    externalHostOrganizationId: null,
    ...partial,
  };
}

function testInternalSameTenant() {
  const denis = actor({
    id: "denis",
    role: "CLIENT",
    personType: "INTERNAL",
    permissionProfile: "DIRECTION",
    email: "bework-demo@demo.bework.local",
    organizationIds: ["org1"],
  });
  const julie = actor({
    id: "julie",
    role: "CLIENT",
    personType: "INTERNAL",
    permissionProfile: "ADMINISTRATIF",
    email: "bework-demo+julie@demo.bework.local",
    organizationIds: ["org1"],
  });
  const karim = actor({
    id: "karim",
    role: "CLIENT",
    personType: "INTERNAL",
    permissionProfile: "CONDUCTEUR",
    email: "bework-demo+karim@demo.bework.local",
    organizationIds: ["org1"],
  });
  assert.equal(evaluateDirectMessageAcl(denis, julie).ok, true);
  assert.equal(evaluateDirectMessageAcl(denis, karim).ok, true);
  console.log("ok Denis → Julie / Karim Benali (même tenant)");
}

function testOtherTenantBlocked() {
  const denis = actor({
    id: "denis",
    role: "CLIENT",
    personType: "INTERNAL",
    permissionProfile: "DIRECTION",
    email: "bework-demo@demo.bework.local",
    organizationIds: ["org1"],
  });
  const stranger = actor({
    id: "x",
    role: "CLIENT",
    personType: "INTERNAL",
    permissionProfile: "CONDUCTEUR",
    organizationIds: ["other-org"],
  });
  const r = evaluateDirectMessageAcl(denis, stranger);
  assert.equal(r.ok, false);
  console.log("ok autre tenant refusé");
}

function testDemoStaffNoLongerCrossTenant() {
  const denis = actor({
    id: "denis",
    role: "CLIENT",
    personType: "INTERNAL",
    permissionProfile: "DIRECTION",
    email: "bework-demo@demo.bework.local",
    organizationIds: ["org1"],
  });
  const adjaili = actor({
    id: "adj",
    role: "AGENT",
    personType: "INTERNAL",
    permissionProfile: "CONDUCTEUR",
    email: "karim.benali.demo@bework.internal",
    organizationIds: [],
  });
  const lefevre = actor({
    id: "lef",
    role: "AGENT",
    personType: "INTERNAL",
    permissionProfile: "CONDUCTEUR",
    email: "sophie.martin.demo@bework.internal",
    organizationIds: [],
  });
  // PLATFORM-ISOLATION-V1.1 — plus de bypass @bework.internal hors org / mission
  assert.equal(evaluateDirectMessageAcl(denis, adjaili).ok, false);
  assert.equal(evaluateDirectMessageAcl(denis, lefevre).ok, false);
  assert.equal(evaluateDirectMessageAcl(denis, adjaili, { taskLinked: true }).ok, true);
  console.log("ok staff @bework.internal refusé sans lien org/mission");
}

function testExternalHost() {
  const denis = actor({
    id: "denis",
    role: "CLIENT",
    personType: "INTERNAL",
    permissionProfile: "DIRECTION",
    email: "bework-demo@demo.bework.local",
    organizationIds: ["org1"],
  });
  const sophie = actor({
    id: "sophie",
    role: "CLIENT",
    personType: "CLIENT_EXT",
    permissionProfile: "CLIENT",
    organizationIds: ["org1"],
    externalHostOrganizationId: "org1",
  });
  assert.equal(evaluateDirectMessageAcl(denis, sophie).ok, true);
  console.log("ok Denis → Sophie CLIENT_EXT (host org)");
}

function testPortalClientNeedsLink() {
  const portal = actor({
    id: "portal",
    role: "CLIENT",
    personType: "CLIENT_EXT",
    permissionProfile: "CLIENT",
    organizationIds: ["org1"],
    externalHostOrganizationId: "org1",
  });
  const agent = actor({
    id: "agent",
    role: "AGENT",
    personType: "INTERNAL",
    permissionProfile: "CONDUCTEUR",
    organizationIds: [],
  });
  assert.equal(evaluateDirectMessageAcl(portal, agent, { taskLinked: false }).ok, false);
  assert.equal(evaluateDirectMessageAcl(portal, agent, { taskLinked: true }).ok, true);
  console.log("ok portail client → agent nécessite lien mission");
}

function testWiring() {
  const route = readFileSync(
    join(process.cwd(), "src/app/api/messages/direct/route.ts"),
    "utf8",
  );
  assert.ok(route.includes("canDirectMessageUser"));
  assert.ok(!route.includes('error: "Destinataire non autorisé." }, { status: 403 });\n      }'));
  const page = readFileSync(
    join(process.cwd(), "src/app/dashboard/messagerie/page.tsx"),
    "utf8",
  );
  assert.ok(page.includes("keepIfMessageable"));
  assert.ok(page.includes("evaluateDirectMessageAcl"));
  const ui = readFileSync(
    join(process.cwd(), "src/components/messagerie/MessagerieMissionsView.tsx"),
    "utf8",
  );
  assert.ok(ui.includes("directSendError"));
  assert.ok(!ui.includes('alert(err?.error ?? "Erreur lors de l\'envoi")'));
  console.log("ok wiring API + page + toast UI");
}

function main() {
  testInternalSameTenant();
  testOtherTenantBlocked();
  testDemoStaffNoLongerCrossTenant();
  testExternalHost();
  testPortalClientNeedsLink();
  testWiring();
  console.log("\nMESSAGERIE-HOTFIX-V2C.5 — ALL PASS");
}

main();
