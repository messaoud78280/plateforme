/**
 * CONTRATS-ANNUELS-2 — facturation directe (LOISELET + idempotence).
 * npx tsx scripts/test-annual-contracts-invoice.ts
 */
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import {
  getScriptDatabaseUrlCandidatesForLongJobs,
  loadScriptEnv,
} from "./load-script-env";

loadScriptEnv();
process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= "0";

async function pickUrl() {
  for (const url of getScriptDatabaseUrlCandidatesForLongJobs()) {
    const c = new PrismaClient({ datasourceUrl: url });
    try {
      await c.$queryRaw`SELECT 1`;
      await c.$disconnect();
      process.env.DATABASE_URL = url;
      return;
    } catch {
      await c.$disconnect().catch(() => {});
    }
  }
  throw new Error("DB injoignable");
}

async function main() {
  await pickUrl();
  const { prisma } = await import("../src/lib/prisma");
  const { prepareAnnualInterventionInvoice } = await import(
    "../src/lib/annual-contracts/prepare-invoice"
  );
  const { completeAnnualIntervention } = await import(
    "../src/lib/annual-contracts/complete-intervention"
  );
  const { issueInvoice } = await import("../src/lib/commercial/invoices");
  const { evaluateAnnualBillingAttention } = await import(
    "../src/lib/annual-contracts/evaluate-attention"
  );
  const { canPrepareAnnualInvoice } = await import(
    "../src/lib/annual-contracts/prepare-invoice"
  );

  assert.equal(
    canPrepareAnnualInvoice({
      personType: "INTERNAL",
      permissionProfile: "CONDUCTEUR",
    }),
    false,
  );
  assert.equal(
    canPrepareAnnualInvoice({
      personType: "INTERNAL",
      permissionProfile: "DIRECTION",
    }),
    true,
  );

  const draftAtt = evaluateAnnualBillingAttention({
    billingNeededAt: new Date("2026-01-23"),
    billedAt: null,
    invoiceStatus: "DRAFT",
    now: new Date("2026-01-24"),
  });
  assert.match(draftAtt!.reason, /préparation|finaliser/i);

  const demo = await prisma.demoEnvironment.findFirst({
    where: { loginIdentifier: { in: ["bework-demo", "setrim"] }, status: "ACTIVE" },
  });
  assert.ok(demo?.organizationId);
  const orgId = demo!.organizationId!;
  const owner = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { ownerUserId: true },
  });
  assert.ok(owner?.ownerUserId);

  const testKey = "SETRIM-CE-TEST-INVOICE-V2";
  await prisma.annualServiceIntervention.deleteMany({
    where: { organizationId: orgId, contract: { demoKey: testKey } },
  });
  await prisma.annualServiceContract.deleteMany({
    where: { organizationId: orgId, demoKey: testKey },
  });

  const planned = new Date("2026-01-23T00:00:00.000Z");
  const contract = await prisma.annualServiceContract.create({
    data: {
      organizationId: orgId,
      demoKey: testKey,
      clientName: "LOISELET DAIGREMONT",
      siteAddress: "29/47 Avenue de Condé, 94100 Saint-Maur-des-Fossés",
      amountHt: 1085,
      plannedCrewCount: 2,
      status: "ACTIVE",
      nextPlannedDate: planned,
      interventions: {
        create: {
          organizationId: orgId,
          plannedDate: planned,
          plannedCrewCount: 2,
          status: "SCHEDULED",
        },
      },
    },
    include: { interventions: true },
  });
  const interventionId = contract.interventions[0]!.id;

  await completeAnnualIntervention({
    interventionId,
    organizationId: orgId,
    actorUserId: owner!.ownerUserId,
    completedAt: planned,
  });

  const prep1 = await prepareAnnualInterventionInvoice({
    organizationId: orgId,
    interventionId,
    actorUserId: owner!.ownerUserId,
  });
  assert.equal(prep1.action, "created");
  assert.ok(prep1.invoiceId);

  const inv = await prisma.commercialInvoice.findUnique({
    where: { id: prep1.invoiceId },
    include: { lines: true },
  });
  assert.ok(inv);
  assert.equal(inv!.status, "DRAFT");
  assert.equal(inv!.projectId, null); // pas de faux chantier
  assert.match(inv!.subject ?? "", /LOISELET/i);
  assert.equal(inv!.lines.length, 1);
  assert.equal(Number(inv!.lines[0]!.unitSellHt), 1085);
  assert.match(inv!.lines[0]!.designation, /Intervention annuelle/i);
  assert.match(inv!.lines[0]!.designation, /LOISELET/i);
  const snap = inv!.clientSnapshotJson as { name?: string; addressLine1?: string };
  assert.equal(snap?.name, "LOISELET DAIGREMONT");
  assert.match(snap?.addressLine1 ?? "", /Condé/i);

  const prep2 = await prepareAnnualInterventionInvoice({
    organizationId: orgId,
    interventionId,
    actorUserId: owner!.ownerUserId,
  });
  assert.equal(prep2.action, "continue");
  assert.equal(prep2.invoiceId, prep1.invoiceId);

  const count = await prisma.annualServiceIntervention.count({
    where: { commercialInvoiceId: prep1.invoiceId },
  });
  assert.equal(count, 1);

  await issueInvoice(orgId, prep1.invoiceId, owner!.ownerUserId);

  const after = await prisma.annualServiceIntervention.findUnique({
    where: { id: interventionId },
  });
  assert.ok(after?.billedAt);

  const sheet = after?.followUpSheetId
    ? await prisma.followUpSheet.findUnique({ where: { id: after.followUpSheetId } })
    : null;
  assert.equal(sheet?.status, "FACTURE");

  const next2027 = await prisma.annualServiceIntervention.findFirst({
    where: {
      contractId: contract.id,
      plannedDate: new Date("2027-01-23T00:00:00.000Z"),
      status: "TO_PREPARE",
    },
  });
  assert.ok(next2027);

  const prep3 = await prepareAnnualInterventionInvoice({
    organizationId: orgId,
    interventionId,
    actorUserId: owner!.ownerUserId,
  });
  assert.equal(prep3.action, "view");

  // Cleanup
  await prisma.annualServiceIntervention.update({
    where: { id: interventionId },
    data: { commercialInvoiceId: null },
  });
  await prisma.commercialInvoiceLine.deleteMany({ where: { invoiceId: prep1.invoiceId } });
  await prisma.commercialStatusEvent.deleteMany({
    where: { entityType: "INVOICE", entityId: prep1.invoiceId },
  });
  await prisma.commercialInvoice.delete({ where: { id: prep1.invoiceId } });
  if (after?.followUpSheetId) {
    await prisma.followUpTimelineEvent.deleteMany({
      where: { sheetId: after.followUpSheetId },
    });
    await prisma.followUpSheet.delete({ where: { id: after.followUpSheetId } });
  }
  await prisma.annualServiceIntervention.deleteMany({
    where: { contractId: contract.id },
  });
  await prisma.annualServiceContract.delete({ where: { id: contract.id } });

  console.log("✅ test-annual-contracts-invoice OK");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
