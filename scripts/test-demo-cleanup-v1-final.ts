/**
 * DEMO-CLEANUP-V1 finalisation — assertions locales (sans DB).
 * npx tsx scripts/test-demo-cleanup-v1-final.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEMO_PERSONA_KEYS,
  DEMO_PERSONAS,
  isDemoPersonaKey,
} from "../src/lib/demo-environment/personas";
import { resolveDemoPersonaKey } from "../src/components/demo-environment/DemoPersonaHomes";
import { LEGACY_DEMO_ALERT_TITLES } from "../src/lib/demo-environment/cleanup-legacy-inbox";
import { isHrefAllowedForPersona } from "../src/lib/equipe-acces/nav-by-persona";
import { displayUserRoleLabel } from "../src/lib/equipe-acces/display-role";

function testPersonasOrder() {
  assert.deepEqual([...DEMO_PERSONA_KEYS], [
    "direction",
    "conducteur",
    "administratif",
    "client",
    "fournisseur",
  ]);
  assert.equal(DEMO_PERSONAS.administratif.name, "Julie Martin");
  assert.equal(DEMO_PERSONAS.administratif.personType, "INTERNAL");
  assert.equal(DEMO_PERSONAS.administratif.permissionProfile, "ADMINISTRATIF");
  assert.equal(DEMO_PERSONAS.administratif.emailSuffix, "julie");
  assert.equal(isDemoPersonaKey("administratif"), true);
  console.log("ok 5 personas + Julie");
}

function testResolveAndHeader() {
  assert.equal(resolveDemoPersonaKey("ADMINISTRATIF", "INTERNAL"), "administratif");
  assert.equal(
    displayUserRoleLabel({
      role: "CLIENT",
      personType: "INTERNAL",
      permissionProfile: "ADMINISTRATIF",
    }),
    "Administratif",
  );
  console.log("ok resolve + header Julie");
}

function testNoHardcodedAlertSeed() {
  const seedPath = join(process.cwd(), "src/lib/demo-environment/seed.ts");
  const seed = readFileSync(seedPath, "utf8");
  assert.equal(seed.includes("prisma.alert.create"), false);
  assert.equal(seed.includes("Action urgente"), false);
  assert.equal(seed.includes("3 actions urgentes"), false);
  assert.ok(LEGACY_DEMO_ALERT_TITLES.includes("Action urgente"));
  assert.ok(seed.includes("BC-2026-043"));
  assert.ok(seed.includes("purgeDemoLegacyInbox"));
  console.log("ok seed sans alertes génériques");
}

function testScopesNav() {
  // Julie = admin interne : menu complet
  assert.equal(
    isHrefAllowedForPersona("/dashboard/pilotage-travaux", "INTERNAL", "ADMINISTRATIF"),
    true,
  );
  // Thomas = fournisseur : pas de pilotage
  assert.equal(
    isHrefAllowedForPersona("/dashboard/pilotage-travaux", "SUPPLIER", "FOURNISSEUR"),
    false,
  );
  // Sophie = client : pas de fournisseurs
  assert.equal(
    isHrefAllowedForPersona("/dashboard/fournisseurs", "CLIENT_EXT", "CLIENT"),
    false,
  );
  console.log("ok scopes nav Marc/Julie vs Sophie/Thomas");
}

function testNoDemoAdministratifHome() {
  const homes = readFileSync(
    join(process.cwd(), "src/components/demo-environment/DemoPersonaHomes.tsx"),
    "utf8",
  );
  assert.equal(homes.includes("DemoAdministratifHome"), false);
  const page = readFileSync(join(process.cwd(), "src/app/dashboard/page.tsx"), "utf8");
  assert.ok(page.includes("AccueilOpsHome"));
  assert.equal(page.includes("DemoConducteurHome"), false);
  console.log("ok pas de home parallèle admin/conducteur");
}

testPersonasOrder();
testResolveAndHeader();
testNoHardcodedAlertSeed();
testScopesNav();
testNoDemoAdministratifHome();
console.log("DEMO-CLEANUP-V1 FINAL — ALL PASS");
