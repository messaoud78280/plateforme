/**
 * SETRIM-DEMO-V1.1 — assertions locales apply-brand (sans DB).
 * npx tsx scripts/test-demo-apply-brand-v11.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DEMO_BRAND, demoBrandContactFullName, isLegacyDemoCompanyName } from "../src/lib/demo-environment/brand";

function testBrandTargets() {
  assert.equal(DEMO_BRAND.companyName, "SETRIM");
  assert.equal(demoBrandContactFullName(), "Denis Buret");
  assert.ok(isLegacyDemoCompanyName("ABC Étanchéité (Démo BeWork)"));
  assert.ok(isLegacyDemoCompanyName("ABC Étanchéité"));
  console.log("ok cibles brand");
}

function testWiring() {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
  assert.ok(pkg.scripts["demo:apply-brand"]);
  assert.ok(existsSync(join(process.cwd(), "scripts/apply-demo-brand.ts")));
  assert.ok(existsSync(join(process.cwd(), "src/lib/demo-environment/apply-brand.ts")));
  const auth = readFileSync(join(process.cwd(), "src/lib/auth.ts"), "utf8");
  assert.ok(auth.includes("demoUser"));
  assert.ok(auth.includes("token.name = demoUser.name"));
  const apply = readFileSync(join(process.cwd(), "src/lib/demo-environment/apply-brand.ts"), "utf8");
  assert.ok(apply.includes("ensureDemoStaffDisplayNames"));
  assert.ok(!apply.includes("clearDemoEnvironmentData"));
  assert.ok(!apply.includes("seedDemoEnvironmentData"));
  console.log("ok wiring script + JWT name refresh + pas de reseed");
}

function main() {
  testBrandTargets();
  testWiring();
  console.log("\nSETRIM-DEMO-V1.1 — ALL PASS");
}

main();
