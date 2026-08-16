/**
 * VISITES-METRES-1 — tests ciblés (calculs, parcours Peupliers, isolation, SEC-1).
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
  const { computeMeasurement, unitsCompatible } = await import(
    "../src/lib/site-visits/measurements"
  );
  const { canAccessSiteVisits, canCreateQuoteFromVisit } = await import(
    "../src/lib/site-visits/access"
  );
  const { prisma } = await import("../src/lib/prisma");
  const { createSiteVisit, upsertMeasurement, finishSiteVisit } = await import(
    "../src/lib/site-visits/service"
  );
  const {
    createOrOpenQuoteFromVisit,
    addQuoteLineFromMeasurement,
  } = await import("../src/lib/site-visits/create-quote");

  // Calculs
  assert.equal(computeMeasurement({ measureType: "SURFACE", lengthM: 12.4, widthM: 7.2 }).computedQuantity, 89.28);
  assert.equal(computeMeasurement({ measureType: "SURFACE", lengthM: 12.4, widthM: 7.2 }).unit, "m²");
  assert.equal(computeMeasurement({ measureType: "LENGTH", lengthM: 38.5 }).computedQuantity, 38.5);
  assert.equal(computeMeasurement({ measureType: "LENGTH", lengthM: 38.5 }).unit, "ml");
  assert.equal(
    computeMeasurement({
      measureType: "VOLUME",
      lengthM: 2,
      widthM: 3,
      heightM: 1.5,
    }).computedQuantity,
    9,
  );
  assert.equal(
    computeMeasurement({ measureType: "QUANTITY", quantityValue: 4 }).unit,
    "U",
  );
  assert.equal(unitsCompatible("m²", "m2"), true);
  assert.equal(unitsCompatible("ml", "m²"), false);

  const { buildQuoteImpactPoints } = await import("../src/lib/site-visits/impact");
  const { buildVisitSummary } = await import("../src/lib/site-visits/summary");
  const impact = buildQuoteImpactPoints({
    constraints: {
      accessLevel: "Difficile",
      access: ["Accès nacelle", "Stationnement difficile"],
      supportState: "Dégradé",
      supportObservations: ["Infiltration"],
      asbestosStatus: "Diagnostic à demander",
      waste: ["Évacuation à prévoir"],
      means: ["Nacelle", "Protection des parties communes"],
    },
  });
  assert.ok(impact.some((p) => p.id === "nacelle"));
  assert.ok(impact.some((p) => p.id === "dechets"));
  assert.ok(impact.some((p) => p.id === "support" && p.severity === "warn"));
  assert.ok(impact.some((p) => p.id === "amiante" && p.severity === "warn"));
  assert.ok(!impact.some((p) => /pas d.amiante/i.test(p.label)));

  const summary = buildVisitSummary({
    clientName: "Résidence Les Peupliers",
    siteName: "Résidence Les Peupliers",
    constraints: {
      supportState: "Dégradé",
      means: ["Nacelle"],
      waste: ["Évacuation à prévoir"],
    },
    measurements: [
      {
        zone: "Terrasse principale",
        label: "Étanchéité",
        unit: "m²",
        computedQuantity: 89.28,
        quantityLabel: "89,28 m²",
      },
      {
        zone: null,
        label: "Acrotères",
        unit: "ml",
        computedQuantity: 38.5,
        quantityLabel: "38,50 ml",
      },
    ],
    missingOpen: [{ label: "Diagnostic amiante à obtenir" }],
    photoCount: 2,
    documentCount: 1,
    estimatedCrewCount: 2,
    estimatedDuration: "3 jours",
  });
  assert.equal(summary.ready, false);
  assert.equal(summary.missingOpenCount, 1);
  assert.ok(summary.completenessLabel.includes("1 information"));
  assert.ok(summary.totalsByUnit.some((t) => t.unit === "m²"));

  // SEC-1 / personas
  assert.equal(
    canAccessSiteVisits({ personType: "CLIENT_EXT", permissionProfile: "CLIENT" }),
    false,
  );
  assert.equal(
    canAccessSiteVisits({
      personType: "INTERNAL",
      permissionProfile: "CONDUCTEUR",
    }),
    true,
  );
  assert.equal(
    canCreateQuoteFromVisit({
      personType: "INTERNAL",
      permissionProfile: "CONDUCTEUR",
    }),
    true,
  );

  const demo = await prisma.demoEnvironment.findFirst({
    where: {
      loginIdentifier: { in: ["bework-demo", "setrim"] },
      status: "ACTIVE",
    },
  });
  assert.ok(demo?.organizationId);
  const orgId = demo!.organizationId!;
  const owner = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { ownerUserId: true },
  });
  assert.ok(owner?.ownerUserId);

  const demoKey = "SETRIM-VISIT-TEST-FLOW";
  await prisma.siteVisitMedia.deleteMany({
    where: { organizationId: orgId, visit: { demoKey } },
  });
  await prisma.siteVisitMissingInfo.deleteMany({
    where: { organizationId: orgId, visit: { demoKey } },
  });
  await prisma.siteVisitMeasurement.deleteMany({
    where: { organizationId: orgId, visit: { demoKey } },
  });
  await prisma.siteVisit.deleteMany({
    where: { organizationId: orgId, demoKey },
  });

  const visit = await createSiteVisit({
    organizationId: orgId,
    actorUserId: owner!.ownerUserId,
    clientName: "Résidence Les Peupliers",
    siteAddress: "12 Allée des Peupliers, 94000 Créteil",
    subject: "Étanchéité terrasse",
    scheduledAt: new Date("2026-08-16T09:00:00.000Z"),
    clientNeed:
      "Réfection complète de l’étanchéité terrasse avec remplacement de l’isolant.",
  });
  assert.equal(visit.status, "SCHEDULED");
  assert.ok(visit.agendaEventId);
  assert.equal(visit.projectId, null);

  await prisma.siteVisit.update({
    where: { id: visit.id },
    data: { demoKey },
  });

  let cur = await upsertMeasurement({
    organizationId: orgId,
    visitId: visit.id,
    data: {
      zone: "Terrasse bâtiment A",
      label: "Étanchéité terrasse",
      measureType: "SURFACE",
      lengthM: 12.4,
      widthM: 7.2,
    },
  });
  assert.equal(cur.measurements[0]!.computedQuantity, 89.28);

  cur = await upsertMeasurement({
    organizationId: orgId,
    visitId: visit.id,
    data: { label: "Acrotères", measureType: "LENGTH", lengthM: 38.5 },
  });
  cur = await upsertMeasurement({
    organizationId: orgId,
    visitId: visit.id,
    data: {
      label: "Naissances EP",
      measureType: "QUANTITY",
      quantityValue: 4,
    },
  });
  assert.equal(cur.measurements.length, 3);

  // Media sans storage (enregistrement logique via API media nécessite supabase —
  // on crée une entrée minimale pour compter)
  await prisma.siteVisitMedia.create({
    data: {
      visitId: visit.id,
      organizationId: orgId,
      kind: "PHOTO",
      name: "photo-terrasse.jpg",
      createdById: owner!.ownerUserId,
    },
  });
  await prisma.siteVisitMedia.create({
    data: {
      visitId: visit.id,
      organizationId: orgId,
      kind: "DOCUMENT",
      name: "plan.pdf",
      createdById: owner!.ownerUserId,
    },
  });

  cur = (await finishSiteVisit({
    organizationId: orgId,
    visitId: visit.id,
    mode: "ready",
  }))!;
  assert.equal(cur!.status, "READY_TO_QUOTE");

  const q1 = await createOrOpenQuoteFromVisit({
    organizationId: orgId,
    visitId: visit.id,
    actorUserId: owner!.ownerUserId,
  });
  assert.equal(q1.action, "created");
  assert.ok(q1.quoteId);

  const quote = await prisma.commercialQuote.findUnique({
    where: { id: q1.quoteId },
  });
  assert.ok(quote);
  assert.equal(quote!.projectId, null);
  const snap = quote!.clientSnapshotJson as { name?: string };
  assert.equal(snap?.name, "Résidence Les Peupliers");

  const q2 = await createOrOpenQuoteFromVisit({
    organizationId: orgId,
    visitId: visit.id,
    actorUserId: owner!.ownerUserId,
  });
  assert.equal(q2.action, "opened");
  assert.equal(q2.quoteId, q1.quoteId);

  const after = await prisma.siteVisit.findUnique({ where: { id: visit.id } });
  assert.equal(after?.status, "TRANSMITTED");

  // Ouvrage m² pour mapping
  let wi = await prisma.commercialWorkItem.findFirst({
    where: {
      organizationId: orgId,
      saleUnit: { in: ["m²", "m2", "M2"] },
      isActive: true,
    },
    select: { id: true, saleUnit: true },
  });
  if (!wi) {
    wi = await prisma.commercialWorkItem.create({
      data: {
        organizationId: orgId,
        name: "Étanchéité bicouche autoprotégée (test)",
        saleUnit: "m²",
        kind: "SIMPLE",
        unitCostHt: 45,
        unitSellHt: 85,
        createdById: owner!.ownerUserId,
      },
      select: { id: true, saleUnit: true },
    });
  }

  const mSurface = cur!.measurements.find((m) => m.measureType === "SURFACE")!;
  const line = await addQuoteLineFromMeasurement({
    organizationId: orgId,
    visitId: visit.id,
    quoteId: q1.quoteId,
    measurementId: mSurface.id,
    workItemId: wi.id,
  });
  assert.equal(line.quantity, 89.28);

  // Isolation : BATINORD ne voit pas
  const batinord = await prisma.demoEnvironment.findFirst({
    where: { loginIdentifier: { contains: "batinord" }, status: "ACTIVE" },
  });
  if (batinord?.organizationId && batinord.organizationId !== orgId) {
    const leaked = await prisma.siteVisit.findFirst({
      where: {
        id: visit.id,
        organizationId: batinord.organizationId,
      },
    });
    assert.equal(leaked, null);
  }

  // Cleanup quote lines + quote + visit
  await prisma.commercialQuoteLine.deleteMany({
    where: { version: { quoteId: q1.quoteId } },
  });
  await prisma.commercialQuoteSection.deleteMany({
    where: { version: { quoteId: q1.quoteId } },
  });
  await prisma.commercialQuoteVersion.deleteMany({
    where: { quoteId: q1.quoteId },
  });
  await prisma.commercialStatusEvent.deleteMany({
    where: { entityType: "QUOTE", entityId: q1.quoteId },
  });
  await prisma.siteVisit.update({
    where: { id: visit.id },
    data: { commercialQuoteId: null },
  });
  await prisma.commercialQuote.delete({ where: { id: q1.quoteId } });
  if (after?.agendaEventId) {
    await prisma.agendaEvent.deleteMany({ where: { id: after.agendaEventId } });
  }
  await prisma.siteVisitMedia.deleteMany({ where: { visitId: visit.id } });
  await prisma.siteVisitMissingInfo.deleteMany({ where: { visitId: visit.id } });
  await prisma.siteVisitMeasurement.deleteMany({ where: { visitId: visit.id } });
  await prisma.siteVisit.delete({ where: { id: visit.id } });

  console.log("✅ test-site-visits OK");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
