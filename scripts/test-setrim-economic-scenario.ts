/**
 * ECO-0 — Recette déterministe + lecture live SETRIM si disponible.
 *   npm run test:setrim-eco
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateSetrimEcoGuard,
  SETRIM_ECO_LOGIN_IDENTIFIERS,
} from "../src/lib/demo-environment/economic-scenario-guard";
import { resolvePlatformKeyFromLoginIdentifier } from "../src/lib/platform/config";

let failed = 0;
function ok(cond: boolean, msg: string) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  } else {
    console.log("OK:", msg);
  }
}

function testGuard() {
  const good = evaluateSetrimEcoGuard({
    loginIdentifier: "bework-demo",
    organizationId: "org_setrim",
    status: "ACTIVE",
    companyName: "N’importe quoi",
  });
  ok(good.ok === true, "bework-demo + orgId → accepté");

  const setrimLogin = evaluateSetrimEcoGuard({
    loginIdentifier: "setrim",
    organizationId: "org_setrim",
    status: "ACTIVE",
  });
  ok(setrimLogin.ok === true, "setrim + orgId → accepté");

  ok(
    evaluateSetrimEcoGuard({
      loginIdentifier: "bework-demo",
      organizationId: null,
    }).ok === false,
    "sans organizationId → refus (ne jamais deviner)",
  );
  ok(
    evaluateSetrimEcoGuard({
      loginIdentifier: "client-test",
      organizationId: "org_x",
    }).ok === false,
    "client-test → refus",
  );
  ok(
    evaluateSetrimEcoGuard({
      loginIdentifier: "dupont",
      organizationId: "org_x",
      companyName: "SETRIM",
    }).ok === false,
    "companyName SETRIM ne suffit pas",
  );
  ok(
    evaluateSetrimEcoGuard({ loginIdentifier: null, organizationId: "org" }).ok ===
      false,
    "loginIdentifier vide → refus",
  );
  ok(
    SETRIM_ECO_LOGIN_IDENTIFIERS.every(
      (id) => resolvePlatformKeyFromLoginIdentifier(id) === "setrim",
    ),
    "identifiants autorisés → platformKey setrim",
  );
}

async function testEngineFacts() {
  const { isCommittedPurchaseOrder } = await import(
    "../src/lib/chantier/project-profitability"
  );
  const { classifySupplierCostCategory, resolvePurchaseActualHt } = await import(
    "../src/lib/chantier/supplier-invoices"
  );
  const { aggregateCommittedByCategory } = await import(
    "../src/lib/purchase-orders/cost-category"
  );
  ok(isCommittedPurchaseOrder("A_CONFIRMER") === true, "A_CONFIRMER est engagé");
  ok(isCommittedPurchaseOrder("LIVRAISON_PROGRAMMEE") === true, "LIVRAISON_PROGRAMMEE est engagé");
  ok(isCommittedPurchaseOrder("BROUILLON") === false, "BROUILLON n’est pas engagé");
  ok(isCommittedPurchaseOrder("A_VALIDER") === false, "A_VALIDER n’est pas engagé");
  ok(
    classifySupplierCostCategory("SUPPLIER") === "UNCLASSIFIED",
    "facture : type SUPPLIER sans catégorie → UNCLASSIFIED (pas un mapping PO)",
  );
  ok(
    classifySupplierCostCategory("SUBCONTRACTOR") === "SUBCONTRACT",
    "facture : type SUBCONTRACTOR → défaut SUBCONTRACT",
  );
  const mixed = aggregateCommittedByCategory({
    lines: [
      { quantity: 1, unitPriceHt: 5_000, costCategory: "MATERIAL" },
      { quantity: 1, unitPriceHt: 2_000, costCategory: "EQUIPMENT" },
    ],
  });
  ok(mixed.MATERIAL === 5_000 && mixed.EQUIPMENT === 2_000 && mixed.UNCLASSIFIED === 0, "engagé PO ventilé par ligne");
  const both = resolvePurchaseActualHt({
    recordedInvoiceHt: 33_500,
    hasRecordedInvoice: true,
    receiptHt: 20_000,
  });
  ok(both.source === "invoice" && both.actualHt === 33_500, "anti-double-comptage : facture gagne");
  const receiptOnly = resolvePurchaseActualHt({
    recordedInvoiceHt: 0,
    hasRecordedInvoice: false,
    receiptHt: 20_000,
  });
  ok(receiptOnly.source === "receipt" && receiptOnly.actualHt === 20_000, "réel = réception si pas de facture");
}

function testSeedDoesNotInventConnections() {
  const seed = readFileSync(
    join(process.cwd(), "src/lib/demo-environment/economic-scenario.ts"),
    "utf8",
  );
  const acceptBlock = seed.slice(
    seed.indexOf("async function ensureAccepted"),
    seed.indexOf("async function ensureBudget"),
  );
  ok(
    !acceptBlock.includes("initializeProjectBudget("),
    "seed acceptation n’invente pas un second calcul budget",
  );
  const acceptService = readFileSync(
    join(process.cwd(), "src/lib/commercial/accepted-snapshot.ts"),
    "utf8",
  );
  ok(
    acceptService.includes("tryInitializeProjectBudgetAfterAccept"),
    "acceptation produit appelle initializeProjectBudget existant",
  );
  const receiptBlock = seed.slice(
    seed.indexOf("async function ensureReceipts"),
    seed.indexOf("async function ensureSupplierInvoices"),
  );
  ok(
    !receiptBlock.includes("createSupplierInvoice"),
    "réception n’appelle pas createSupplierInvoice",
  );
  const guard = readFileSync(
    join(process.cwd(), "src/lib/demo-environment/economic-scenario-guard.ts"),
    "utf8",
  );
  ok(
    guard.includes("evaluateSetrimEcoGuard") && guard.includes("organizationId manquant"),
    "garde SETRIM présente",
  );
  ok(!seed.includes("prisma.project.create"), "ne crée pas un chantier inventé");
}

async function testLiveIfAvailable() {
  const { loadScriptEnv, getScriptDatabaseUrlCandidatesForLongJobs } = await import(
    "./load-script-env"
  );
  const { PrismaClient } = await import("@prisma/client");
  loadScriptEnv();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= "0";
  const candidates = getScriptDatabaseUrlCandidatesForLongJobs();
  if (candidates.length === 0) {
    console.log("SKIP live : DATABASE_URL absente");
    return { ran: false, reason: "no-db" as const };
  }
  let connected = false;
  for (const url of candidates) {
    const probe = new PrismaClient({ datasourceUrl: url });
    try {
      await probe.$queryRaw`SELECT 1`;
      await probe.$disconnect();
      process.env.DATABASE_URL = url;
      connected = true;
      break;
    } catch {
      await probe.$disconnect().catch(() => {});
    }
  }
  if (!connected) {
    console.log("SKIP live : DB injoignable (identifiants / réseau)");
    return { ran: false, reason: "db-error" as const };
  }

  try {
    const { resolveSetrimDemoForEconomicSeed, EcoEnvironmentError } = await import(
      "../src/lib/demo-environment/economic-scenario"
    );
    const { loadProjectProfitability } = await import(
      "../src/lib/chantier/project-profitability"
    );
    const { prisma } = await import("../src/lib/prisma");
    const { demoProjectTitleWhere } = await import("../src/lib/demo-environment/scenario");
    const { ECO0_QUOTE_NUMBER, ECO0_MARK } = await import(
      "../src/lib/demo-environment/economic-scenario-guard"
    );

    let ctx;
    try {
      ctx = await resolveSetrimDemoForEconomicSeed();
    } catch (e) {
      if (e instanceof EcoEnvironmentError) {
        console.log(`SKIP live : ${e.message}`);
        return { ran: false, reason: "no-setrim" as const };
      }
      throw e;
    }

    const project = await prisma.project.findFirst({
      where: {
        organizationId: ctx.organizationId,
        ...demoProjectTitleWhere("primary"),
      },
      select: { id: true, title: true },
    });
    if (!project) {
      console.log("SKIP live : chantier Les Lilas introuvable (seed non exécuté ?)");
      return { ran: false, reason: "no-project" as const };
    }

    const quote = await prisma.commercialQuote.findFirst({
      where: {
        organizationId: ctx.organizationId,
        OR: [{ number: ECO0_QUOTE_NUMBER }, { subject: { contains: ECO0_MARK } }],
      },
      select: { id: true, number: true, status: true, totalSellHt: true, acceptedVersionId: true },
    });
    if (!quote) {
      console.log("SKIP live : devis ECO-0 absent — lancer npm run db:seed-setrim-eco");
      return { ran: false, reason: "no-seed" as const };
    }

    ok(quote.status === "ACCEPTED", `devis ${quote.number} ACCEPTED`);
    ok(Number(quote.totalSellHt) === 250_000, `devis ${quote.totalSellHt} = 250 000 HT`);

    const snap = await prisma.commercialQuoteSnapshot.findFirst({
      where: { quoteId: quote.id, organizationId: ctx.organizationId, kind: "ACCEPTED_PDF" },
      select: { id: true },
    });
    ok(
      Boolean(quote.acceptedVersionId),
      "version d’acceptation figée (acceptedVersionId)",
    );
    ok(Boolean(snap), "snapshot PDF accepté présent (storage privé)");

    const budget = await prisma.projectBudget.findUnique({
      where: { projectId: project.id },
    });
    ok(Boolean(budget), "ProjectBudget présent (manuel, pas auto-acceptation)");
    if (budget && budget.sourceQuoteId === quote.id) {
      ok(Number(budget.marketSellHt) === 250_000, "budget CA 250 000");
      ok(Number(budget.totalCostHt) === 180_000, "budget coûts 180 000");
      ok(Number(budget.plannedMarginHt) === 70_000, "marge prévue 70 000");
      ok(Number(budget.plannedMarginPercent) === 28, "marge prévue 28 %");
      ok(Number(budget.materialsHt) === 80_000, "matériaux 80 000");
      ok(Number(budget.laborHt) === 55_000, "MO 55 000");
      ok(Number(budget.equipmentHt) === 15_000, "matériel 15 000");
      ok(Number(budget.subcontractHt) === 25_000, "sous-traitance 25 000");
      ok(Number(budget.otherHt) === 5_000, "autres 5 000");
    }

    const pos = await prisma.purchaseOrder.findMany({
      where: {
        organizationId: ctx.organizationId,
        OR: [{ number: { startsWith: "BC-ECO-" } }, { subject: { contains: ECO0_MARK } }],
      },
    });
    ok(pos.length === 3, `3 commandes ECO-0 (trouvé ${pos.length})`);

    const sis = await prisma.supplierInvoice.findMany({
      where: { organizationId: ctx.organizationId, supplierNumber: { startsWith: "FAC-ECO-" } },
    });
    ok(sis.length === 3, "3 factures fournisseurs ECO-0");
    ok(
      sis.every((s) => s.purchaseOrderId),
      "SupplierInvoice reliée à PurchaseOrder (relation existante)",
    );
    ok(
      sis.every((s) => s.projectId === project.id),
      "SupplierInvoice reliée au chantier",
    );

    const receipts = await prisma.purchaseOrderReceipt.findMany({
      where: {
        organizationId: ctx.organizationId,
        cancelledAt: null,
        purchaseOrderId: { in: pos.map((p) => p.id) },
      },
    });
    ok(receipts.length === 2, `2 réceptions ECO-0 (trouvé ${receipts.length})`);

    const dto = await loadProjectProfitability(ctx.organizationId, project.id);
    ok(Boolean(dto), "loadProjectProfitability");
    if (dto) {
      ok(dto.actualIncomplete === true, "actualIncomplete = true (volontaire)");
      const labor = dto.categories.find((c) => c.key === "LABOR");
      ok(labor == null || labor.actualHt == null, "LABOR actualHt = null");
      ok(dto.commercial.marketSellHt > 0, "CA prévu > 0");
      const mat = dto.categories.find((c) => c.key === "MATERIAL");
      const eq = dto.categories.find((c) => c.key === "EQUIPMENT");
      const unc = dto.categories.find((c) => c.key === "UNCLASSIFIED");
      console.log(
        `  moteur : CA ${dto.commercial.marketSellHt} · budget ${dto.budget?.totalCostHt} · engagé ${dto.committedTotalHt} · réel ${dto.actualTotalHt} · facturé ${dto.commercial.invoicedHt} · encaissé ${dto.commercial.collectedTtc} · forecast ${dto.forecastTotalHt} · marge est. ${dto.estimatedMarginHt} (${dto.estimatedMarginPercent} %) · santé ${dto.healthLabel}`,
      );
      console.log(
        `  catégories : MATERIAL engagé ${mat?.committedHt ?? 0} · EQUIPMENT engagé ${eq?.committedHt ?? 0} · UNCLASSIFIED engagé ${unc?.committedHt ?? 0}`,
      );
    }

    await prisma.$disconnect();
    return { ran: true, reason: "ok" as const };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/Can't reach|P1001|authentication|ENOTFOUND|ECONNREFUSED/i.test(msg)) {
      console.log(`SKIP live : DB injoignable (${msg.slice(0, 120)})`);
      return { ran: false, reason: "db-error" as const };
    }
    throw e;
  }
}

async function main() {
  testGuard();
  testSeedDoesNotInventConnections();
  const { loadScriptEnv, getScriptDatabaseUrlCandidatesForLongJobs } = await import(
    "./load-script-env"
  );
  const { PrismaClient } = await import("@prisma/client");
  loadScriptEnv();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= "0";
  for (const url of getScriptDatabaseUrlCandidatesForLongJobs()) {
    const probe = new PrismaClient({ datasourceUrl: url });
    try {
      await probe.$queryRaw`SELECT 1`;
      await probe.$disconnect();
      process.env.DATABASE_URL = url;
      break;
    } catch {
      await probe.$disconnect().catch(() => {});
    }
  }
  await testEngineFacts();
  return testLiveIfAvailable();
}

main()
  .then((live) => {
    console.log(`Live : ${live.ran ? "exécuté" : `skip (${live.reason})`}`);
    if (failed) {
      console.error(`\nECO-0 tests : ${failed} échec(s)`);
      process.exit(1);
    }
    console.log("\nECO-0 tests OK");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
