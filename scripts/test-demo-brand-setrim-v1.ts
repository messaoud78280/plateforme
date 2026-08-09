/**
 * SETRIM-DEMO-V1 — assertions locales branding.
 * npx tsx scripts/test-demo-brand-setrim-v1.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEMO_BRAND,
  demoBrandBannerCompanyLabel,
  demoBrandContactFullName,
  isLegacyDemoCompanyName,
  resolveDemoCompanyName,
} from "../src/lib/demo-environment/brand";
import { DEMO_PERSONAS } from "../src/lib/demo-environment/personas";
import { EXPRESS_TOUR_STEPS, COMPLETE_TOUR_STEPS } from "../src/lib/demo-environment/commercial-tour";

function testBrandIdentity() {
  assert.equal(DEMO_BRAND.companyName, "SETRIM");
  assert.equal(DEMO_BRAND.productSecondaryLabel, "Démonstration BeWork");
  assert.equal(demoBrandContactFullName(), "Denis Buret");
  assert.equal(DEMO_PERSONAS.direction.name, "Denis Buret");
  assert.equal(DEMO_PERSONAS.direction.jobTitle, "Direction");
  assert.equal(DEMO_PERSONAS.direction.company, "SETRIM");
  assert.ok(DEMO_BRAND.logoPath?.startsWith("/brands/setrim/"));
  console.log("ok identité SETRIM / Denis Buret");
}

function testLegacyMigration() {
  assert.ok(isLegacyDemoCompanyName("ABC Étanchéité"));
  assert.equal(resolveDemoCompanyName("ABC Étanchéité"), "SETRIM");
  assert.equal(resolveDemoCompanyName("Dupont SAS"), "Dupont SAS");
  assert.equal(demoBrandBannerCompanyLabel("SETRIM (Démo BeWork)"), "SETRIM");
  console.log("ok migration soft ABC → SETRIM");
}

function testLogoAsset() {
  const logo = join(process.cwd(), "public/brands/setrim/logo.jpg");
  assert.ok(existsSync(logo), "logo.jpg manquant");
  const buf = readFileSync(logo);
  assert.ok(buf.length > 1000);
  assert.equal(buf[0], 0xff);
  assert.equal(buf[1], 0xd8);
  console.log("ok logo JPEG local");
}

function testCommercialTourCopy() {
  const all = [...EXPRESS_TOUR_STEPS, ...COMPLETE_TOUR_STEPS];
  for (const step of all) {
    assert.ok(!/\bMarc\b/.test(step.body), `body contient Marc: ${step.id}`);
    if (step.tip) assert.ok(!/\bMarc\b/.test(step.tip), `tip contient Marc: ${step.id}`);
  }
  console.log("ok parcours commercial sans Marc");
}

function testNoBlindAbcInSurfaces() {
  const files = [
    "src/components/demo-environment/DemoTenantBanner.tsx",
    "src/components/dashboard/AppSidebar.tsx",
    "src/app/dashboard/layout.tsx",
    "src/lib/demo-environment/personas.ts",
  ];
  for (const rel of files) {
    const src = readFileSync(join(process.cwd(), rel), "utf8");
    assert.ok(!src.includes("ABC Étanchéité"), `${rel} contient encore ABC Étanchéité`);
  }
  console.log("ok surfaces sans ABC hardcodé");
}

function main() {
  testBrandIdentity();
  testLegacyMigration();
  testLogoAsset();
  testCommercialTourCopy();
  testNoBlindAbcInSurfaces();
  console.log("\nSETRIM-DEMO-V1 — ALL PASS");
}

main();
