/**
 * Tests PILOTAGE-V2A.1 — silo fermé, suivi contractuel rattaché au Project.
 * Run: npx tsx scripts/test-pilotage-v2a1.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..");
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

// 1 — Portfolio → cockpit Project
const loader = read("src/lib/pilotage/load-pilotage-portfolio.ts");
assert.ok(loader.includes('href: `/dashboard/projets/${r.id}`'));

const portfolioView = read("src/components/pilotage/PilotagePortfolioView.tsx");
assert.ok(portfolioView.includes("/dashboard/projets/"));
assert.ok(portfolioView.includes("#tab-contractuel") || portfolioView.includes("suivi-contractuel"));
assert.ok(!portfolioView.includes("${PILOTAGE_LIST_PATH}/${"));

// 2 — Pas de CTA « Nouveau pilotage » en primaire
const page = read("src/app/dashboard/pilotage-travaux/page.tsx");
assert.ok(!page.includes("Nouveau pilotage"));
assert.ok(page.includes("Configurer suivi contractuel") || page.includes("Échéances contractuelles"));

const nav = read("src/components/pilotage/PilotageSubNav.tsx");
assert.ok(!nav.includes("Nouveau pilotage"));
assert.ok(!nav.includes("/nouveau"));

// 3 — Activation légère + cockpit
const actions = read("src/app/dashboard/pilotage-travaux/actions.ts");
assert.ok(actions.includes("activateContractualFollowUp"));
assert.ok(actions.includes("Suivi contractuel activé depuis le chantier"));

const cockpit = read("src/components/chantier/ChantierCockpit.tsx");
assert.ok(cockpit.includes('id: "contractuel"'));
assert.ok(cockpit.includes("Suivi contractuel"));

const panel = read("src/components/chantier/ChantierContractuelPanel.tsx");
assert.ok(panel.includes("Activer le suivi contractuel"));
assert.ok(panel.includes("Non activé"));

const projetPage = read("src/app/dashboard/projets/[id]/page.tsx");
assert.ok(projetPage.includes("ChantierContractuelPanel"));
assert.ok(projetPage.includes("Summary légère") || projetPage.includes("summary légère") || projetPage.includes("pas le détail contractuel complet"));

// 4 — Ancien détail [id] → redirect vue vers Project
const detail = read("src/app/dashboard/pilotage-travaux/[id]/page.tsx");
assert.ok(detail.includes("projectContractuelTabHref"));
assert.ok(detail.includes('tabRaw === "vue"'));
assert.ok(detail.includes("Extension du chantier"));
assert.ok(detail.includes("DoeItem = suivi de complétude") || detail.includes("complétude / conformité DOE"));

// 5 — Entrée Project-first
const suivi = read("src/app/dashboard/projets/[id]/suivi-contractuel/page.tsx");
assert.ok(suivi.includes("suivi-contractuel"));
assert.ok(suivi.includes("CLIENT_EXT") || suivi.includes("SUPPLIER"));

// 6 — Liens deep → chantier
const calendrier = read("src/app/dashboard/pilotage-travaux/calendrier/page.tsx");
assert.ok(calendrier.includes("Échéances contractuelles"));
assert.ok(calendrier.includes("/dashboard/projets/"));
assert.ok(calendrier.includes("suivi-contractuel"));

const aTraiter = read("src/app/dashboard/pilotage-travaux/a-traiter/page.tsx");
assert.ok(aTraiter.includes("/dashboard/projets/"));
assert.ok(aTraiter.includes("suivi-contractuel"));

const blocages = read("src/app/dashboard/pilotage-travaux/blocages/page.tsx");
assert.ok(blocages.includes("/dashboard/projets/"));
assert.ok(blocages.includes("suivi-contractuel?onglet=blocages"));

const createForm = read("src/components/pilotage/CreatePilotageForm.tsx");
assert.ok(createForm.includes("projectContractuelTabHref"));
assert.ok(createForm.includes("Activer le suivi contractuel"));
assert.ok(!createForm.includes("${PILOTAGE_LIST_PATH}/${res.id}"));

const links = read("src/lib/pilotage/project-links.ts");
assert.ok(links.includes("projectContractuelTabHref"));
assert.ok(links.includes("projectContractuelSectionHref"));

// 7 — Pas de migration Prisma dans ce ticket
assert.ok(!actions.includes("prisma migrate"));

console.log("OK — test:pilotage-v2a1");
