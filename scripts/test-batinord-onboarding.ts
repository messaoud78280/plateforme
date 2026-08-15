/**
 * ONBOARDING-1 — isolation SETRIM / BATINORD + SEC-1 + parcours économique.
 * npx tsx scripts/test-batinord-onboarding.ts
 */
import assert from "node:assert/strict";
import { loadScriptEnv } from "./load-script-env";

loadScriptEnv();
process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= "0";

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { canAccessDashboardHref } = await import("../src/lib/equipe-acces/dashboard-policy");
  const { getPlatformConfigForOrganization, isSetrimPlatform } = await import(
    "../src/lib/platform/config"
  );
  const { evaluateBatinordPilotGuard, BATINORD_LOGIN_IDENTIFIER } = await import(
    "../src/lib/demo-environment/batinord-pilot-guard"
  );
  const { evaluateSetrimEcoGuard } = await import(
    "../src/lib/demo-environment/economic-scenario-guard"
  );
  const { searchGlobal } = await import("../src/lib/search/global-search");
  const { loadProjectProfitability } = await import("../src/lib/chantier/project-profitability");
  const { resolveDocumentAccess } = await import("../src/lib/ged/resolve-document-access");
  const { listQuotes } = await import("../src/lib/commercial/quotes");

  const batinordDemo = await prisma.demoEnvironment.findUnique({
    where: { loginIdentifier: BATINORD_LOGIN_IDENTIFIER },
  });
  assert.ok(batinordDemo?.organizationId, "DemoEnvironment batinord requis — lancer le seed");
  const guard = evaluateBatinordPilotGuard({
    loginIdentifier: batinordDemo.loginIdentifier,
    organizationId: batinordDemo.organizationId,
    status: batinordDemo.status,
  });
  assert.equal(guard.ok, true, guard.ok ? "" : guard.reason);

  const setrimRefuse = evaluateBatinordPilotGuard({
    loginIdentifier: "bework-demo",
    organizationId: "x",
  });
  assert.equal(setrimRefuse.ok, false);

  const setrimDemo = await prisma.demoEnvironment.findFirst({
    where: { loginIdentifier: { in: ["bework-demo", "setrim"] } },
  });
  assert.ok(setrimDemo?.organizationId, "SETRIM requis pour le test d’isolation");
  assert.notEqual(batinordDemo.organizationId, setrimDemo.organizationId);

  const setrimGuard = evaluateSetrimEcoGuard({
    loginIdentifier: setrimDemo.loginIdentifier,
    organizationId: setrimDemo.organizationId,
    status: setrimDemo.status,
  });
  assert.equal(setrimGuard.ok, true);

  const platform = getPlatformConfigForOrganization({
    isDemo: true,
    loginIdentifier: BATINORD_LOGIN_IDENTIFIER,
    companyName: "BATINORD",
    organizationId: batinordDemo.organizationId,
  });
  assert.equal(platform.key, "generic_demo");
  assert.equal(isSetrimPlatform(platform), false);
  assert.equal(platform.branding.displayName, "BATINORD");

  const orgId = batinordDemo.organizationId;
  const setrimOrgId = setrimDemo.organizationId;

  const christopher = await prisma.user.findUniqueOrThrow({
    where: { id: batinordDemo.rootUserId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      personType: true,
      permissionProfile: true,
    },
  });
  assert.equal(christopher.name, "Christopher Rockman");
  assert.equal(christopher.permissionProfile, "DIRECTION");

  const members = await prisma.user.findMany({
    where: { organizationMemberships: { some: { organizationId: orgId } } },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      personType: true,
      permissionProfile: true,
    },
  });
  const laura = members.find((u) => u.permissionProfile === "ADMINISTRATIF");
  const nicolas = members.find((u) => u.permissionProfile === "CONDUCTEUR");
  assert.ok(laura && laura.name === "Laura Martin");
  assert.ok(nicolas && nicolas.name === "Nicolas Bernard");
  assert.equal(members.length, 3, "3 utilisateurs internes uniquement");

  const setrimUsers = await prisma.user.findMany({
    where: { organizationMemberships: { some: { organizationId: setrimOrgId } } },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      personType: true,
      permissionProfile: true,
    },
  });
  const denis = setrimUsers.find((u) => u.permissionProfile === "DIRECTION");
  assert.ok(denis, "Denis SETRIM requis");
  assert.ok(!setrimUsers.some((u) => u.id === christopher.id));
  assert.ok(!members.some((u) => u.id === denis.id));

  const parc = await prisma.project.findFirst({
    where: { organizationId: orgId, title: "Résidence Parc Central" },
    select: { id: true, title: true, clientId: true },
  });
  const ecole = await prisma.project.findFirst({
    where: { organizationId: orgId, title: "École Jean Moulin" },
    select: { id: true },
  });
  const victor = await prisma.project.findFirst({
    where: { organizationId: setrimOrgId, title: { contains: "Victor Hugo" } },
    select: { id: true, title: true },
  });
  assert.ok(parc && ecole && victor);
  assert.notEqual(parc.id, victor.id);
  assert.equal(parc.clientId, christopher.id);

  const leakParcOnSetrim = await prisma.project.findFirst({
    where: { organizationId: setrimOrgId, title: { contains: "Parc Central" } },
  });
  assert.equal(leakParcOnSetrim, null);
  const leakVictorOnBatinord = await prisma.project.findFirst({
    where: { organizationId: orgId, title: { contains: "Victor Hugo" } },
  });
  assert.equal(leakVictorOnBatinord, null);

  const quote = await prisma.commercialQuote.findFirst({
    where: { organizationId: orgId, number: "DEV-BAT-2026-001" },
    select: { id: true, status: true, totalSellHt: true, projectId: true },
  });
  assert.ok(quote);
  assert.equal(quote.status, "ACCEPTED");
  assert.equal(Number(quote.totalSellHt), 120000);
  assert.equal(quote.projectId, parc.id);

  const setrimQuote = await prisma.commercialQuote.findFirst({
    where: { organizationId: setrimOrgId, number: { contains: "ECO" } },
    select: { id: true, number: true },
  });

  const budget = await prisma.projectBudget.findUnique({
    where: { projectId: parc.id },
    select: { id: true, organizationId: true, sourceQuoteId: true, marketSellHt: true },
  });
  assert.ok(budget, "ECO-3 : budget automatique requis");
  assert.equal(budget.organizationId, orgId);
  assert.equal(budget.sourceQuoteId, quote.id);

  const po = await prisma.purchaseOrder.findFirst({
    where: { organizationId: orgId, number: "BC-BAT-2026-001" },
    include: { lines: { select: { costCategory: true } } },
  });
  assert.ok(po);
  assert.equal(Number(po.amountHt), 8000);
  assert.ok(po.lines.every((l) => l.costCategory === "MATERIAL"));

  const receipt = await prisma.purchaseOrderReceipt.findFirst({
    where: { organizationId: orgId, purchaseOrderId: po.id, cancelledAt: null },
  });
  assert.ok(receipt);
  assert.ok(receipt.status === "PARTIAL" || po.status === "PARTIELLEMENT_RECUE");

  const invoice = await prisma.supplierInvoice.findFirst({
    where: { organizationId: orgId, supplierNumber: "FAC-BAT-2026-001" },
  });
  assert.ok(invoice);
  assert.equal(invoice.status, "RECORDED");
  assert.equal(Number(invoice.amountHt), 7800);

  const delivery = await prisma.agendaEvent.findFirst({
    where: { organizationId: orgId, purchaseOrderId: po.id, type: "LIVRAISON" },
  });
  assert.ok(delivery, "PurchaseOrder → AgendaEvent LIVRAISON");

  const profit = await loadProjectProfitability(orgId, parc.id);
  assert.ok(profit);
  assert.equal(profit.organizationId, orgId);
  assert.ok((profit.budget?.marketSellHt ?? profit.commercial.marketSellHt) >= 119000);
  assert.ok(profit.committedTotalHt >= 7900 && profit.committedTotalHt <= 8100);
  assert.ok(profit.actualTotalHt != null && profit.actualTotalHt >= 7700 && profit.actualTotalHt <= 7900);
  const leakProfit = await loadProjectProfitability(orgId, victor.id);
  assert.equal(leakProfit, null);
  const leakProfitDenis = await loadProjectProfitability(setrimOrgId, parc.id);
  assert.equal(leakProfitDenis, null);

  const asChristopher = {
    id: christopher.id,
    role: christopher.role,
    personType: christopher.personType,
    permissionProfile: christopher.permissionProfile,
    isDemo: true,
    demoRootUserId: christopher.id,
  };
  const asDenis = {
    id: denis.id,
    role: denis.role,
    personType: denis.personType,
    permissionProfile: denis.permissionProfile,
    isDemo: true,
    demoRootUserId: setrimDemo.rootUserId,
  };
  const asNicolas = {
    id: nicolas.id,
    role: nicolas.role,
    personType: nicolas.personType,
    permissionProfile: nicolas.permissionProfile,
    isDemo: true,
    demoRootUserId: christopher.id,
  };

  assert.equal(canAccessDashboardHref("/dashboard/rentabilite", asChristopher.personType, asChristopher.permissionProfile), true);
  assert.equal(canAccessDashboardHref("/dashboard/depenses", asLaura.personType, asLaura.permissionProfile), true);
  assert.equal(canAccessDashboardHref("/dashboard/rentabilite", asNicolas.personType, asNicolas.permissionProfile), false);
  assert.equal(canAccessDashboardHref("/dashboard/depenses", asNicolas.personType, asNicolas.permissionProfile), false);
  assert.equal(canAccessDashboardHref("/dashboard/pilotage", asNicolas.personType, asNicolas.permissionProfile), false);
  assert.equal(canAccessDashboardHref("/dashboard/fournisseurs", asNicolas.personType, asNicolas.permissionProfile), false);
  assert.equal(canAccessDashboardHref("/dashboard/commandes", asNicolas.personType, asNicolas.permissionProfile), true);
  assert.equal(canAccessDashboardHref("/dashboard/projets", asNicolas.personType, asNicolas.permissionProfile), true);

  const chrisParc = await searchGlobal({ user: asChristopher, query: "Parc Central" });
  assert.ok(
    chrisParc.items.some((i) => i.title.includes("Parc Central")),
    "Christopher trouve Parc Central",
  );
  const chrisVictor = await searchGlobal({ user: asChristopher, query: "Victor Hugo" });
  assert.ok(
    !chrisVictor.items.some((i) => /victor hugo/i.test(i.title) && i.kind === "project"),
    "Christopher ne trouve pas Victor Hugo SETRIM",
  );
  const denisParc = await searchGlobal({ user: asDenis, query: "Parc Central" });
  assert.ok(
    !denisParc.items.some((i) => /parc central/i.test(i.title)),
    "Denis ne trouve pas Parc Central BATINORD",
  );

  const batFile = await prisma.chantierFile.findFirst({
    where: { organizationId: orgId, deletedAt: null, name: { contains: "Plan de masse" } },
    select: { id: true },
  });
  const setrimFile = await prisma.chantierFile.findFirst({
    where: { organizationId: setrimOrgId, deletedAt: null },
    select: { id: true, name: true },
  });
  assert.ok(batFile && setrimFile);

  const chrisOwn = await resolveDocumentAccess(asChristopher, {
    kind: "CHANTIER_FILE",
    id: batFile.id,
  });
  assert.ok(chrisOwn.ok === true || (chrisOwn.ok === false && chrisOwn.status !== 403), "Christopher lit son plan");

  const chrisLeak = await resolveDocumentAccess(asChristopher, {
    kind: "CHANTIER_FILE",
    id: setrimFile.id,
  });
  assert.equal(chrisLeak.ok, false, "Christopher ne lit pas un document SETRIM");
  assert.ok(chrisLeak.ok === false && (chrisLeak.status === 403 || chrisLeak.status === 404));

  const denisLeak = await resolveDocumentAccess(asDenis, {
    kind: "CHANTIER_FILE",
    id: batFile.id,
  });
  assert.equal(denisLeak.ok, false, "Denis ne lit pas un document BATINORD");

  const batMsg = await prisma.directMessage.findFirst({
    where: {
      OR: [
        { senderId: christopher.id, receiverId: nicolas.id },
        { senderId: nicolas.id, receiverId: christopher.id },
      ],
    },
  });
  assert.ok(batMsg);
  const setrimSeesBatMsg = await prisma.directMessage.findFirst({
    where: {
      id: batMsg.id,
      OR: [{ senderId: denis.id }, { receiverId: denis.id }],
    },
  });
  assert.equal(setrimSeesBatMsg, null);

  const batSuppliers = await prisma.externalOrganization.findMany({
    where: { hostOrganizationId: orgId, type: "SUPPLIER" },
    select: { id: true, name: true },
  });
  assert.ok(batSuppliers.some((s) => s.name.includes("POINT.P BATINORD")));
  const setrimPointp = await prisma.externalOrganization.findFirst({
    where: { hostOrganizationId: setrimOrgId, name: { contains: "Point.P" } },
    select: { id: true },
  });
  if (setrimPointp) {
    assert.ok(!batSuppliers.some((s) => s.id === setrimPointp.id));
  }

  const listed = await listQuotes(orgId);
  const listedIds = listed.map((q) => q.id);
  assert.ok(listedIds.includes(quote.id));
  if (setrimQuote) {
    assert.ok(!listedIds.includes(setrimQuote.id));
  }

  console.log("OK ONBOARDING-1 isolation + SEC-1 + ECO");
}

const asLaura = {
  personType: "INTERNAL" as const,
  permissionProfile: "ADMINISTRATIF" as const,
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
