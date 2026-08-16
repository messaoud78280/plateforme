/**
 * CONTRATS-ANNUELS-1 — scénario métier critique.
 * Run: npx tsx scripts/test-annual-contracts.ts
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
  const { evaluateAnnualInterventionAttention } = await import(
    "../src/lib/annual-contracts/evaluate-attention"
  );
  const { addYearsDateOnly } = await import("../src/lib/annual-contracts/types");
  const { completeAnnualIntervention } = await import(
    "../src/lib/annual-contracts/complete-intervention"
  );
  const { scheduleAnnualIntervention } = await import(
    "../src/lib/annual-contracts/schedule-intervention"
  );
  const {
    canAccessAnnualContracts,
    canViewAnnualContractFinancials,
  } = await import("../src/lib/annual-contracts/access");
  const { evaluateSetrimEcoGuard } = await import(
    "../src/lib/demo-environment/economic-scenario-guard"
  );

  // --- Attention rules (pure) ---
  const planned = new Date("2026-01-23T00:00:00.000Z");
  const j30 = evaluateAnnualInterventionAttention({
    plannedDate: planned,
    status: "TO_PREPARE",
    now: new Date("2025-12-24T00:00:00.000Z"),
  });
  assert.equal(j30?.level, "IMPORTANT");
  assert.match(j30!.reason, /préparer/i);

  const j15 = evaluateAnnualInterventionAttention({
    plannedDate: planned,
    status: "TO_PREPARE",
    now: new Date("2026-01-08T00:00:00.000Z"),
  });
  assert.equal(j15?.level, "URGENT");

  const j7 = evaluateAnnualInterventionAttention({
    plannedDate: planned,
    status: "TO_PREPARE",
    now: new Date("2026-01-16T00:00:00.000Z"),
  });
  assert.equal(j7?.level, "CRITIQUE");

  const late = evaluateAnnualInterventionAttention({
    plannedDate: planned,
    status: "TO_PREPARE",
    now: new Date("2026-01-24T00:00:00.000Z"),
  });
  assert.equal(late?.level, "CRITIQUE");
  assert.match(late!.reason, /retard/i);

  const confirmedOk = evaluateAnnualInterventionAttention({
    plannedDate: planned,
    status: "SCHEDULED",
    now: new Date("2026-01-16T00:00:00.000Z"),
  });
  // Confirmée à J-7 : plus Critique non confirmée — tombe en Important (J-30 window)
  assert.ok(confirmedOk === null || confirmedOk.level === "IMPORTANT");

  assert.equal(
    addYearsDateOnly(planned, 1).toISOString().slice(0, 10),
    "2027-01-23",
  );

  // --- SEC-1 ---
  assert.equal(
    canAccessAnnualContracts({
      id: "x",
      personType: "CLIENT_EXT",
      permissionProfile: "CLIENT",
    }),
    false,
  );
  assert.equal(
    canAccessAnnualContracts({
      id: "x",
      personType: "SUPPLIER",
      permissionProfile: "FOURNISSEUR",
    }),
    false,
  );
  assert.equal(
    canViewAnnualContractFinancials({
      id: "x",
      personType: "INTERNAL",
      permissionProfile: "CONDUCTEUR",
    }),
    false,
  );
  assert.equal(
    canViewAnnualContractFinancials({
      id: "x",
      personType: "INTERNAL",
      permissionProfile: "DIRECTION",
    }),
    true,
  );

  // --- DB scenario SETRIM ---
  const demo = await prisma.demoEnvironment.findFirst({
    where: { loginIdentifier: { in: ["bework-demo", "setrim"] }, status: "ACTIVE" },
  });
  assert.ok(demo?.organizationId);
  const guard = evaluateSetrimEcoGuard({
    loginIdentifier: demo!.loginIdentifier,
    organizationId: demo!.organizationId,
    status: demo!.status,
  });
  assert.equal(guard.ok, true);

  const orgId = demo!.organizationId!;
  const owner = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { ownerUserId: true },
  });
  assert.ok(owner?.ownerUserId);

  const testKey = "SETRIM-CE-TEST-RECURRENCE";
  await prisma.annualServiceIntervention.deleteMany({
    where: { organizationId: orgId, contract: { demoKey: testKey } },
  });
  await prisma.annualServiceContract.deleteMany({
    where: { organizationId: orgId, demoKey: testKey },
  });

  const contract = await prisma.annualServiceContract.create({
    data: {
      organizationId: orgId,
      demoKey: testKey,
      clientName: "TEST RÉCURRENCE LOISELET",
      siteAddress: "29/47 Avenue de Condé, 94100 Saint-Maur-des-Fossés",
      amountHt: 1085,
      plannedCrewCount: 2,
      plannedDuration: "1 jour",
      status: "ACTIVE",
      nextPlannedDate: planned,
      interventions: {
        create: {
          organizationId: orgId,
          plannedDate: planned,
          plannedCrewCount: 2,
          status: "TO_PREPARE",
        },
      },
    },
    include: { interventions: true },
  });
  const interventionId = contract.interventions[0]!.id;

  const sched = await scheduleAnnualIntervention({
    interventionId,
    organizationId: orgId,
    actorUserId: owner!.ownerUserId,
  });
  assert.ok(sched.agendaEventId);

  // Pas de doublon Agenda au 2e schedule
  const sched2 = await scheduleAnnualIntervention({
    interventionId,
    organizationId: orgId,
    actorUserId: owner!.ownerUserId,
  });
  assert.equal(sched2.agendaEventId, sched.agendaEventId);
  const agendaCount = await prisma.agendaEvent.count({
    where: {
      organizationId: orgId,
      id: sched.agendaEventId,
    },
  });
  assert.equal(agendaCount, 1);

  const completed = await completeAnnualIntervention({
    interventionId,
    organizationId: orgId,
    actorUserId: owner!.ownerUserId,
    completedAt: planned,
  });
  assert.ok(completed.followUpSheetId);
  assert.equal(completed.nextPlannedDate, "2027-01-23");

  const sheet = await prisma.followUpSheet.findUnique({
    where: { id: completed.followUpSheetId! },
  });
  assert.equal(sheet?.status, "A_FACTURER");
  assert.equal(Number(sheet?.amountHt), 1085);

  const hist = await prisma.annualServiceIntervention.findUnique({
    where: { id: interventionId },
  });
  assert.equal(hist?.status, "COMPLETED");

  const next = await prisma.annualServiceIntervention.findFirst({
    where: {
      contractId: contract.id,
      plannedDate: new Date("2027-01-23T00:00:00.000Z"),
      status: "TO_PREPARE",
    },
  });
  assert.ok(next);

  // Résiliation : pas de N+1
  const termKey = "SETRIM-CE-TEST-TERMINE";
  await prisma.annualServiceIntervention.deleteMany({
    where: { organizationId: orgId, contract: { demoKey: termKey } },
  });
  await prisma.annualServiceContract.deleteMany({
    where: { organizationId: orgId, demoKey: termKey },
  });
  const term = await prisma.annualServiceContract.create({
    data: {
      organizationId: orgId,
      demoKey: termKey,
      clientName: "TEST RÉSILIE",
      siteAddress: "1 rue Test",
      amountHt: 100,
      status: "TERMINATED",
      nextPlannedDate: planned,
      interventions: {
        create: {
          organizationId: orgId,
          plannedDate: planned,
          status: "SCHEDULED",
        },
      },
    },
    include: { interventions: true },
  });
  const termDone = await completeAnnualIntervention({
    interventionId: term.interventions[0]!.id,
    organizationId: orgId,
    actorUserId: owner!.ownerUserId,
  });
  assert.equal(termDone.nextInterventionId, null);
  assert.equal(termDone.nextPlannedDate, null);

  // Cleanup test keys (garder seed métier)
  await prisma.annualServiceIntervention.deleteMany({
    where: {
      organizationId: orgId,
      contract: { demoKey: { in: [testKey, termKey] } },
    },
  });
  await prisma.followUpSheet.deleteMany({
    where: {
      organizationId: orgId,
      title: { startsWith: "CE à facturer — TEST" },
    },
  });
  await prisma.agendaEvent.deleteMany({
    where: { id: sched.agendaEventId },
  });
  await prisma.annualServiceContract.deleteMany({
    where: { organizationId: orgId, demoKey: { in: [testKey, termKey] } },
  });

  console.log("✅ test-annual-contracts OK");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
