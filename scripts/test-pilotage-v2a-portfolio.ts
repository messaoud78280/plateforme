/**
 * Tests PILOTAGE-V2A — architecture Project-first + loader.
 * Run: npx tsx scripts/test-pilotage-v2a-portfolio.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..");
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

const page = read("src/app/dashboard/pilotage-travaux/page.tsx");
assert.ok(page.includes("loadPilotagePortfolio"));
assert.ok(page.includes("PilotagePortfolioView"));
assert.ok(!page.includes("BeWork · Command Center"));
assert.ok(!page.includes("worksitePilotage.findMany")); // page principale Project-first
assert.ok(page.includes("Vue d’ensemble") || page.includes("Vue d'ensemble"));

const loader = read("src/lib/pilotage/load-pilotage-portfolio.ts");
assert.ok(loader.includes("loadProjectsPortfolio"));
assert.ok(loader.includes("Source de vérité : Project"));
assert.ok(!loader.includes("await loadChantierCockpitOps"));
assert.ok(loader.includes("worksitePilotage.findMany")); // enrichissement optionnel seulement
assert.ok(loader.includes("/dashboard/projets/"));

const nav = read("src/components/pilotage/PilotageSubNav.tsx");
assert.ok(nav.includes("/dashboard/a-traiter"));
assert.ok(nav.includes("/dashboard/agenda"));
assert.ok(!nav.includes("Nouveau pilotage")); // sorti de la nav principale

const nouveau = read("src/app/dashboard/pilotage-travaux/nouveau/page.tsx");
assert.ok(nouveau.includes("Suivi contractuel"));
assert.ok(nouveau.includes("n’est pas recréé") || nouveau.includes("n'est pas recréé"));

console.log("OK — test:pilotage-v2a-portfolio");
