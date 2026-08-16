/**
 * Seed SETRIM — 3 visites démo (Les Peupliers, République, Haussmann).
 * npm run db:seed-setrim-site-visits
 */
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
  const { evaluateSetrimEcoGuard } = await import(
    "../src/lib/demo-environment/economic-scenario-guard"
  );

  const demo = await prisma.demoEnvironment.findFirst({
    where: {
      loginIdentifier: { in: ["bework-demo", "setrim"] },
      status: "ACTIVE",
    },
  });
  if (!demo?.organizationId) throw new Error("Demo SETRIM introuvable");
  const guard = evaluateSetrimEcoGuard({
    loginIdentifier: demo.loginIdentifier,
    organizationId: demo.organizationId,
    status: demo.status,
  });
  if (!guard.ok) throw new Error(guard.reason);

  const orgId = demo.organizationId;
  const owner = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { ownerUserId: true },
  });
  if (!owner?.ownerUserId) throw new Error("Owner manquant");

  const seeds = [
    {
      demoKey: "SETRIM-VISIT-PEUPLIERS",
      clientName: "Résidence Les Peupliers",
      siteName: "Résidence Les Peupliers",
      siteAddress: "12 Allée des Peupliers, 94000 Créteil",
      subject: "Étanchéité terrasse",
      clientNeed:
        "Réfection de l’étanchéité de la toiture terrasse avec remplacement de l’isolant.",
      status: "READY_TO_QUOTE" as const,
      scheduledAt: new Date("2026-08-16T09:00:00.000Z"),
      estimatedCrewCount: 2,
      estimatedDuration: "3 jours",
      constraintsJson: {
        accessLevel: "Moyen",
        access: ["Accès toiture", "Accès nacelle", "Stationnement difficile"],
        occupation: ["Site occupé", "Copropriété"],
        supportState: "Dégradé",
        supportObservations: ["Infiltration", "Décollement", "Ancien revêtement"],
        asbestosStatus: "Diagnostic à demander",
        waste: ["Évacuation à prévoir", "Benne nécessaire"],
        means: ["Nacelle", "Protection des parties communes"],
        estimatedDifficulty: "Standard",
      },
      measurements: [
        {
          zone: "Terrasse principale",
          label: "Étanchéité terrasse",
          measureType: "SURFACE" as const,
          lengthM: 12.4,
          widthM: 7.2,
          unit: "m²",
          computedQuantity: 89.28,
        },
        {
          zone: null,
          label: "Acrotères",
          measureType: "LENGTH" as const,
          lengthM: 38.5,
          unit: "ml",
          computedQuantity: 38.5,
        },
        {
          zone: null,
          label: "Naissances EP",
          measureType: "QUANTITY" as const,
          quantityValue: 4,
          unit: "U",
          computedQuantity: 4,
        },
      ],
      missing: ["Diagnostic amiante à obtenir"] as string[],
    },
    {
      demoKey: "SETRIM-VISIT-REPUBLIQUE",
      clientName: "Résidence République",
      siteAddress: "45 Avenue de la République, 75011 Paris",
      subject: "Visite avant devis ravalement",
      clientNeed: "Devis ravalement façade cour.",
      status: "SCHEDULED" as const,
      scheduledAt: new Date(Date.now() + 2 * 86400000),
      estimatedCrewCount: null as number | null,
      estimatedDuration: null as string | null,
      measurements: [] as Array<{
        zone: string | null;
        label: string;
        measureType: "SURFACE" | "LENGTH" | "QUANTITY";
        lengthM?: number;
        widthM?: number;
        quantityValue?: number;
        unit: string;
        computedQuantity: number;
      }>,
      missing: [] as string[],
    },
    {
      demoKey: "SETRIM-VISIT-HAUSSMANN",
      clientName: "Copropriété Haussmann",
      siteAddress: "8 Boulevard Haussmann, 75009 Paris",
      subject: "Toiture zinc — relevé",
      clientNeed: "Réfection toiture partielle.",
      status: "INCOMPLETE" as const,
      scheduledAt: new Date("2026-08-10T14:00:00.000Z"),
      estimatedCrewCount: 3,
      estimatedDuration: "5 jours",
      measurements: [
        {
          zone: "Versant sud",
          label: "Couverture",
          measureType: "SURFACE" as const,
          lengthM: 18,
          widthM: 6,
          unit: "m²",
          computedQuantity: 108,
        },
      ],
      missing: ["Plan toiture manquant"],
    },
  ];

  for (const s of seeds) {
    const existing = await prisma.siteVisit.findUnique({
      where: {
        organizationId_demoKey: { organizationId: orgId, demoKey: s.demoKey },
      },
    });
    if (existing) {
      await prisma.siteVisitMedia.deleteMany({ where: { visitId: existing.id } });
      await prisma.siteVisitMissingInfo.deleteMany({
        where: { visitId: existing.id },
      });
      await prisma.siteVisitMeasurement.deleteMany({
        where: { visitId: existing.id },
      });
      await prisma.siteVisit.delete({ where: { id: existing.id } });
    }

    const visit = await prisma.siteVisit.create({
      data: {
        organizationId: orgId,
        demoKey: s.demoKey,
        clientName: s.clientName,
        siteName: "siteName" in s ? s.siteName ?? null : null,
        siteAddress: s.siteAddress,
        subject: s.subject,
        clientNeed: s.clientNeed,
        status: s.status,
        scheduledAt: s.scheduledAt,
        estimatedCrewCount: s.estimatedCrewCount,
        estimatedDuration: s.estimatedDuration,
        constraintsJson:
          "constraintsJson" in s && s.constraintsJson
            ? s.constraintsJson
            : undefined,
        createdById: owner.ownerUserId,
        responsibleId: owner.ownerUserId,
        measurements: {
          create: s.measurements.map((m, i) => ({
            organizationId: orgId,
            zone: m.zone,
            label: m.label,
            measureType: m.measureType,
            lengthM: m.lengthM ?? null,
            widthM: m.widthM ?? null,
            quantityValue: m.quantityValue ?? null,
            unit: m.unit,
            computedQuantity: m.computedQuantity,
            sortOrder: i,
          })),
        },
        missingInfos: {
          create: s.missing.map((label) => ({
            organizationId: orgId,
            label,
          })),
        },
      },
    });
    console.log("Seed visite:", visit.clientName, visit.status);
  }

  console.log("✅ seed-setrim-site-visits OK");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
