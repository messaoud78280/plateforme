/**
 * PLATFORM-ISOLATION-V1.1 — garde-fous multi-client avant nouvelle démo.
 * npx tsx scripts/test-platform-isolation-v1-1.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  BEWORK_INTERNAL_CONFIG,
  CLIENT_TEST_PLATFORM_CONFIG,
  GENERIC_DEMO_CONFIG,
  NEUTRAL_CLIENT_CONFIG,
  PLATFORM_KEY_BY_LOGIN_IDENTIFIER,
  SETRIM_PLATFORM_TEMPLATE,
  allowsSharedBeworkInternalStaff,
  filterAiToolIdsForPlatform,
  getPlatformConfigForOrganization,
  isCommercialDemoPlatform,
  isInternalBeworkPlatform,
  isSetrimPlatform,
  resolvePlatformKeyFromLoginIdentifier,
} from "../src/lib/platform/config";
import {
  DEMO_PERSONAS,
  getDemoPersonasForPlatform as getPersonas,
} from "../src/lib/demo-environment/personas";
import { ASSISTANT_IA_TOOLS, filterAssistantIaToolsForPlatform } from "../src/lib/assistant-ia/tools";
import { evaluateDirectMessageAcl, type DirectAclUser } from "../src/lib/messaging/direct-acl";

const root = process.cwd();

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "dist") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(name)) acc.push(p);
  }
  return acc;
}

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

/** 1–4 — Identité : loginIdentifier / platformKey, jamais companyName. */
function testIdentityResolution() {
  assert.equal(resolvePlatformKeyFromLoginIdentifier("bework-demo"), "setrim");
  assert.equal(resolvePlatformKeyFromLoginIdentifier("client-test"), "client_test");
  assert.equal(resolvePlatformKeyFromLoginIdentifier("client-b"), null);
  assert.ok(PLATFORM_KEY_BY_LOGIN_IDENTIFIER["bework-demo"] === "setrim");

  const bework = getPlatformConfigForOrganization({ isDemo: false });
  assert.equal(bework.key, "bework_internal");
  assert.ok(isInternalBeworkPlatform(bework));

  const setrim = getPlatformConfigForOrganization({
    isDemo: true,
    loginIdentifier: "bework-demo",
    companyName: "Nom Affiché Différent",
  });
  assert.equal(setrim.key, "setrim");
  assert.equal(setrim.branding.displayName, "Nom Affiché Différent");
  assert.ok(isSetrimPlatform(setrim));
  assert.ok(isCommercialDemoPlatform(setrim));
  assert.ok(allowsSharedBeworkInternalStaff(setrim));

  // companyName SETRIM seul NE doit plus activer setrim
  const fakeByName = getPlatformConfigForOrganization({
    isDemo: true,
    companyName: "SETRIM",
    loginIdentifier: "autre-prospect",
  });
  assert.equal(fakeByName.key, "generic_demo");
  assert.ok(!isSetrimPlatform(fakeByName));
  assert.ok(!allowsSharedBeworkInternalStaff(fakeByName));

  const clientTest = getPlatformConfigForOrganization({
    platformKey: "client_test",
    isDemo: true,
    companyName: "Client Test",
  });
  assert.equal(clientTest.key, "client_test");
  assert.equal(clientTest.features.purchaseOrders, false);

  const unknownDemo = getPlatformConfigForOrganization({
    isDemo: true,
    loginIdentifier: "client-b",
    companyName: "Client B",
    organizationId: "org-b",
  });
  assert.equal(unknownDemo.key, "generic_demo");
  assert.notEqual(unknownDemo.key, "setrim");
  assert.notEqual(unknownDemo.key, "bework_internal");

  const unknownClient = getPlatformConfigForOrganization({
    isDemo: false,
    organizationId: "org-client-prod",
    companyName: "Entreprise X",
  });
  assert.equal(unknownClient.key, "neutral_client");
  assert.ok(!isInternalBeworkPlatform(unknownClient));
  assert.notEqual(unknownClient.key, "setrim");

  assert.equal(BEWORK_INTERNAL_CONFIG.key, "bework_internal");
  assert.equal(SETRIM_PLATFORM_TEMPLATE.key, "setrim");
  assert.equal(CLIENT_TEST_PLATFORM_CONFIG.key, "client_test");
  assert.equal(GENERIC_DEMO_CONFIG.key, "generic_demo");
  assert.equal(NEUTRAL_CLIENT_CONFIG.key, "neutral_client");
}

/** 16–18 — Pas de singleton mutable entre requêtes. */
function testMultiRequestNoResidue() {
  const a = getPlatformConfigForOrganization({
    isDemo: true,
    loginIdentifier: "bework-demo",
    companyName: "SETRIM",
  });
  const b = getPlatformConfigForOrganization({ isDemo: false });
  const c = getPlatformConfigForOrganization({
    platformKey: "client_test",
    isDemo: true,
    companyName: "Client Test",
  });
  assert.equal(a.key, "setrim");
  assert.equal(b.key, "bework_internal");
  assert.equal(c.key, "client_test");
  assert.equal(a.branding.displayName, "SETRIM");
  assert.equal(b.branding.displayName, "BeWork");
  assert.equal(c.branding.displayName, "Client Test");
  // Ré-appel A : pas de résidu C
  const a2 = getPlatformConfigForOrganization({
    isDemo: true,
    loginIdentifier: "bework-demo",
  });
  assert.equal(a2.key, "setrim");
}

function testPersonasAndFeatures() {
  assert.equal(getPersonas("bework_internal"), null);
  const setrimP = getPersonas("setrim");
  assert.ok(setrimP?.direction.name === DEMO_PERSONAS.direction.name);
  const other = getPersonas("generic_demo", "Client B");
  assert.equal(other?.direction.company, "Client B");
  assert.notEqual(other?.direction.name, DEMO_PERSONAS.direction.name);

  const setrim = getPlatformConfigForOrganization({
    loginIdentifier: "bework-demo",
    isDemo: true,
  });
  const ct = getPlatformConfigForOrganization({ platformKey: "client_test", isDemo: true });
  assert.equal(setrim.features.purchaseOrders, true);
  assert.equal(ct.features.purchaseOrders, false);
  assert.equal(setrim.features.commercialTour, true);
  assert.equal(ct.features.commercialTour, false);
}

function testAiToolsFilter() {
  const setrim = getPlatformConfigForOrganization({
    loginIdentifier: "bework-demo",
    isDemo: true,
  });
  const ct = getPlatformConfigForOrganization({ platformKey: "client_test", isDemo: true });
  const catalogIds = ASSISTANT_IA_TOOLS.map((t) => t.id);
  const setrimIds = filterAiToolIdsForPlatform(setrim, catalogIds);
  const ctIds = filterAiToolIdsForPlatform(ct, catalogIds);
  assert.ok(setrimIds.includes("analyser-marche-prive"));
  assert.ok(!ctIds.includes("analyser-marche-prive"));
  assert.ok(ctIds.includes("controler-doe"));
  assert.equal(filterAssistantIaToolsForPlatform(ct.features.aiTools).length, 2);
}

function testDirectMessageCrossTenant() {
  const denis = actor({
    id: "denis",
    role: "CLIENT",
    personType: "INTERNAL",
    permissionProfile: "DIRECTION",
    email: "bework-demo@demo.bework.local",
    organizationIds: ["org-setrim"],
  });
  const clientB = actor({
    id: "dir-b",
    role: "CLIENT",
    personType: "INTERNAL",
    permissionProfile: "DIRECTION",
    email: "client-b@demo.bework.local",
    organizationIds: ["org-b"],
  });
  const staff = actor({
    id: "staff",
    role: "AGENT",
    email: "karim.benali.demo@bework.internal",
    personType: "INTERNAL",
    permissionProfile: "CONDUCTEUR",
    organizationIds: [],
  });
  assert.equal(evaluateDirectMessageAcl(denis, clientB).ok, false);
  assert.equal(evaluateDirectMessageAcl(denis, staff).ok, false);
  assert.equal(evaluateDirectMessageAcl(clientB, denis).ok, false);
}

function testResetIsolationSource() {
  const seed = readFileSync(join(root, "src/lib/demo-environment/seed.ts"), "utf8");
  const clearFn = seed.slice(seed.indexOf("export async function clearDemoEnvironmentData"));
  assert.ok(clearFn.includes("organizationId: orgId"));
  assert.ok(!/deleteMany\(\s*\{\s*\}\s*\)/.test(clearFn));
  assert.ok(seed.includes("allowSharedBeworkStaff"));
  assert.ok(seed.includes("organizationMemberships: { some: { organizationId } }"));

  const service = readFileSync(join(root, "src/lib/demo-environment/service.ts"), "utf8");
  assert.ok(service.includes("allowSharedBeworkStaff: platform.key === \"setrim\""));
  assert.ok(service.includes("loginIdentifier: demo.loginIdentifier"));
}

function testCachesKeyedByDemoId() {
  const cache = readFileSync(join(root, "src/lib/auth/cached-dashboard-user.ts"), "utf8");
  assert.ok(cache.includes("demoEnvironmentId"));
  assert.ok(cache.includes("loginIdentifier"));
  assert.ok(!/cache\(async\s*\(\)\s*=>/.test(cache));
}

function testNoCompanyNameIdentityInPlatformConfig() {
  const cfg = readFileSync(join(root, "src/lib/platform/config.ts"), "utf8");
  assert.ok(!cfg.includes("isSetrimCompanyName"));
  assert.ok(cfg.includes("PLATFORM_KEY_BY_LOGIN_IDENTIFIER"));
  assert.ok(cfg.includes("neutral_client"));
}

function testMessagerieBeworkFiltersDemoEmails() {
  const page = readFileSync(join(root, "src/app/dashboard/messagerie/page.tsx"), "utf8");
  assert.ok(page.includes("@demo.bework.local"));
  assert.ok(page.includes("organizationId: orgId"));
}

function testDangerousDemoScripts() {
  const demoScripts = walk(join(root, "src/lib/demo-environment"));
  const offenders: string[] = [];
  for (const f of demoScripts) {
    const t = readFileSync(f, "utf8");
    if (/deleteMany\(\s*\{\s*\}\s*\)/.test(t) || /updateMany\(\s*\{\s*\}\s*\)/.test(t)) {
      offenders.push(f.replace(root + "/", ""));
    }
  }
  assert.deepEqual(offenders, [], `deleteMany/updateMany vides: ${offenders.join(", ")}`);
}

function testSeedIdempotentGuards() {
  const personas = readFileSync(join(root, "src/lib/demo-environment/seed-personas.ts"), "utf8");
  assert.ok(personas.includes("upsert") || personas.includes("findUnique"));
  assert.ok(personas.includes("organizationId"));
  const seed = readFileSync(join(root, "src/lib/demo-environment/seed.ts"), "utf8");
  assert.ok(seed.includes("existing === 0") || seed.includes("count({"));
}

function main() {
  testIdentityResolution();
  testMultiRequestNoResidue();
  testPersonasAndFeatures();
  testAiToolsFilter();
  testDirectMessageCrossTenant();
  testResetIsolationSource();
  testCachesKeyedByDemoId();
  testNoCompanyNameIdentityInPlatformConfig();
  testMessagerieBeworkFiltersDemoEmails();
  testDangerousDemoScripts();
  testSeedIdempotentGuards();
  console.log("OK — platform isolation v1.1");
}

main();
