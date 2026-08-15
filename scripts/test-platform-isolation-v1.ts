/**
 * PLATFORM-ISOLATION-V1 — garde-fous config multi-plateformes.
 * npx tsx scripts/test-platform-isolation-v1.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  BEWORK_INTERNAL_CONFIG,
  CLIENT_TEST_PLATFORM_CONFIG,
  SETRIM_PLATFORM_TEMPLATE,
  getPlatformConfigForOrganization,
  isCommercialDemoPlatform,
  isInternalBeworkPlatform,
  isSetrimPlatform,
  resolveHostCompanyLabel,
} from "../src/lib/platform/config";
import { DEMO_BRAND, demoBrandDefaultLogoUrl } from "../src/lib/demo-environment/brand";
import {
  DEMO_PERSONAS,
  getDemoPersonasForPlatform,
} from "../src/lib/demo-environment/personas";

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

function testConfigsDistinct() {
  const bework = getPlatformConfigForOrganization({ isDemo: false });
  const setrim = getPlatformConfigForOrganization({
    isDemo: true,
    loginIdentifier: "bework-demo",
    companyName: "SETRIM",
    logoUrl: DEMO_BRAND.logoPath,
  });
  const clientTest = getPlatformConfigForOrganization({
    platformKey: "client_test",
    isDemo: true,
    companyName: "Client Test",
  });
  const generic = getPlatformConfigForOrganization({
    isDemo: true,
    companyName: "Dupont Étanchéité",
    loginIdentifier: "dupont",
  });
  const batinord = getPlatformConfigForOrganization({
    isDemo: true,
    companyName: "BATINORD",
    loginIdentifier: "batinord",
  });

  assert.equal(bework.key, "bework_internal");
  assert.equal(setrim.key, "setrim");
  assert.equal(clientTest.key, "client_test");
  assert.equal(generic.key, "generic_demo");
  assert.equal(batinord.key, "generic_demo");
  assert.equal(isSetrimPlatform(batinord), false);
  assert.equal(batinord.branding.displayName, "BATINORD");
  assert.equal(batinord.features.commercialTour, false);

  assert.notEqual(bework.branding.displayName, setrim.branding.displayName);
  assert.equal(bework.branding.displayName, "BeWork");
  assert.equal(setrim.branding.displayName, "SETRIM");
  assert.equal(setrim.branding.logo, DEMO_BRAND.logoPath);
  assert.equal(bework.branding.logo, null);

  assert.ok(isInternalBeworkPlatform(bework));
  assert.ok(!isInternalBeworkPlatform(setrim));
  assert.ok(isCommercialDemoPlatform(setrim));
  assert.ok(!isCommercialDemoPlatform(bework));
  assert.ok(!isCommercialDemoPlatform(generic));
  assert.ok(isSetrimPlatform(setrim));
  assert.ok(!isSetrimPlatform(bework));

  assert.equal(bework.features.demoViewAs, false);
  assert.equal(setrim.features.demoViewAs, true);
  assert.equal(setrim.features.commercialTour, true);
  assert.equal(bework.features.commercialTour, false);
  assert.equal(clientTest.features.purchaseOrders, false);
  assert.equal(setrim.features.purchaseOrders, true);

  assert.equal(BEWORK_INTERNAL_CONFIG.key, "bework_internal");
  assert.equal(SETRIM_PLATFORM_TEMPLATE.key, "setrim");
  assert.equal(CLIENT_TEST_PLATFORM_CONFIG.key, "client_test");
}

function testHostFallbackNeutral() {
  assert.equal(resolveHostCompanyLabel(null), "Équipe");
  assert.equal(resolveHostCompanyLabel(""), "Équipe");
  assert.equal(resolveHostCompanyLabel("  "), "Équipe");
  assert.equal(resolveHostCompanyLabel("Acme BTP"), "Acme BTP");
  assert.notEqual(resolveHostCompanyLabel(null), "SETRIM");
}

function testLogoDefaultScoped() {
  assert.equal(demoBrandDefaultLogoUrl(null, "SETRIM"), DEMO_BRAND.logoPath);
  assert.equal(demoBrandDefaultLogoUrl(null, "ABC Étanchéité"), DEMO_BRAND.logoPath);
  assert.equal(demoBrandDefaultLogoUrl(null, "Dupont SAS"), null);
  assert.equal(demoBrandDefaultLogoUrl("/custom.png", "Dupont SAS"), "/custom.png");
}

function testPersonasScoped() {
  assert.equal(getDemoPersonasForPlatform("bework_internal"), null);
  const setrim = getDemoPersonasForPlatform("setrim");
  assert.ok(setrim);
  assert.equal(setrim!.direction.name, DEMO_PERSONAS.direction.name);
  assert.ok(
    setrim!.direction.name.includes("Denis") || setrim!.direction.name.includes("Buret"),
  );

  const other = getDemoPersonasForPlatform("generic_demo", "Client B");
  assert.ok(other);
  assert.equal(other!.direction.company, "Client B");
  assert.notEqual(other!.direction.name, DEMO_PERSONAS.direction.name);
}

function testCoreNoDemoBrandFallback() {
  const channels = readFileSync(
    join(root, "src/lib/messagerie/project-channels.ts"),
    "utf8",
  );
  assert.ok(
    !channels.includes("DEMO_BRAND.companyName"),
    "project-channels ne doit plus fallback sur DEMO_BRAND",
  );
  assert.ok(
    channels.includes("resolveHostCompanyLabel"),
    "project-channels doit utiliser resolveHostCompanyLabel",
  );

  const documents = readFileSync(
    join(root, "src/app/dashboard/documents/page.tsx"),
    "utf8",
  );
  assert.ok(
    !documents.includes("DEMO_BRAND"),
    "documents/page ne doit plus importer DEMO_BRAND",
  );

  const layout = readFileSync(join(root, "src/app/dashboard/layout.tsx"), "utf8");
  assert.ok(layout.includes("getCurrentPlatformConfig"));
  assert.ok(!layout.includes("DEMO_BRAND.logoPath"));
  assert.ok(layout.includes("platform.commercialDemo"));

  const sidebar = readFileSync(
    join(root, "src/components/dashboard/AppSidebar.tsx"),
    "utf8",
  );
  assert.ok(!sidebar.includes('from "@/lib/demo-environment/brand"'));
}

function testNoCompanyNameEqualsSetrimBehavior() {
  const srcFiles = walk(join(root, "src"));
  const offenders: string[] = [];
  for (const f of srcFiles) {
    const t = readFileSync(f, "utf8");
    if (/companyName\s*===\s*["']SETRIM["']/.test(t)) offenders.push(f);
  }
  assert.deepEqual(offenders, [], `conditions companyName===SETRIM: ${offenders.join(", ")}`);
}

function testClearDemoRequiresOrgScopeInSource() {
  const seed = readFileSync(join(root, "src/lib/demo-environment/seed.ts"), "utf8");
  assert.ok(seed.includes("clearDemoEnvironmentData"));
  assert.ok(seed.includes("organizationId: orgId"));
  assert.ok(seed.includes("followUpSheet.deleteMany"));
  const clearFn = seed.slice(seed.indexOf("export async function clearDemoEnvironmentData"));
  assert.ok(!/deleteMany\(\s*\{\s*\}\s*\)/.test(clearFn));
}

function main() {
  testConfigsDistinct();
  testHostFallbackNeutral();
  testLogoDefaultScoped();
  testPersonasScoped();
  testCoreNoDemoBrandFallback();
  testNoCompanyNameEqualsSetrimBehavior();
  testClearDemoRequiresOrgScopeInSource();
  console.log("OK — platform isolation v1");
}

main();
