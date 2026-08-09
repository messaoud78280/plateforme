/**
 * Tests CHANTIERS-V2B — portefeuille (helpers purs + invariants responsable).
 * Run: npx tsx scripts/test-chantiers-v2b-portfolio.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..");

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

// Page n’est plus un classeur
const page = read("src/app/dashboard/projets/page.tsx");
assert.ok(page.includes('title="Chantiers"') || page.includes("title: \"Chantiers\"") || page.includes(">Chantiers<") || page.includes('"Chantiers"'));
assert.ok(!page.includes("Classeur numérique"));
assert.ok(!page.includes("Dossiers chantier"));
assert.ok(page.includes("loadProjectsPortfolio"));
assert.ok(page.includes("ChantiersPortfolioList"));

// Loader batch — pas de cockpit × N
const portfolio = read("src/lib/chantier/portfolio.ts");
assert.ok(portfolio.includes("loadProjectsPortfolio"));
assert.ok(!portfolio.includes("await loadChantierCockpitOps"));
assert.ok(portfolio.includes("loadAttentionForSheets"));
assert.ok(portfolio.includes("loadPurchaseOrderAttention"));
assert.ok(portfolio.includes("projectId: { in: projectIds }"));

// Responsable : filtre CLIENT_EXT
assert.ok(portfolio.includes("CLIENT_EXT"));
assert.ok(portfolio.includes("isInternalAssignee") || portfolio.includes("personType === \"INTERNAL\""));
assert.ok(portfolio.includes("sophie martin") || portfolio.includes("Sophie"));

// Seed / cohérence Victor Hugo → Karim
const personas = read("src/lib/demo-environment/seed-personas.ts");
assert.ok(personas.includes("assignedToId: users.conducteur.id"));
const coherence = read("src/lib/demo-environment/coherence-victor-hugo.ts");
assert.ok(coherence.includes("assignedToId: karim.id"));
assert.ok(coherence.includes("jamais Sophie") || coherence.includes("CLIENT_EXT"));

// UI : pas de gros Ouvrir permanent, menu •••
const ui = read("src/components/chantier/ChantiersPortfolioList.tsx");
assert.ok(ui.includes("•••"));
assert.ok(ui.includes("Supprimer définitivement"));
assert.ok(ui.includes("Prochaine activité"));
assert.ok(ui.includes("Livraison"));
assert.ok(!ui.includes("Ouvrir →"));
assert.ok(ui.includes("debounce") || ui.includes("280") || ui.includes("setDebouncedQ"));

// Legacy list peut rester mais page ne l’utilise plus
assert.ok(!page.includes("ChantierProjectsList"));

console.log("OK — test:chantiers-v2b-portfolio");
