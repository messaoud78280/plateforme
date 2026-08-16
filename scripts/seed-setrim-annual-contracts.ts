/**
 * CONTRATS-ANNUELS-1 — Seed SETRIM (idempotent).
 *
 *   npm run db:seed-setrim-annual-contracts
 *
 * Refuse toute organisation non SETRIM. Ne touche jamais BATINORD.
 */
import { PrismaClient, type AnnualContractStatus } from "@prisma/client";
import {
  getScriptDatabaseUrlCandidatesForLongJobs,
  loadScriptEnv,
} from "./load-script-env";

loadScriptEnv();
process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= "0";

function maskUrl(url: string) {
  return url.replace(/:[^:@]+@/, ":***@");
}

async function pickWorkingDatabaseUrl(): Promise<string> {
  const candidates = getScriptDatabaseUrlCandidatesForLongJobs();
  if (candidates.length === 0) {
    throw new Error("DATABASE_URL manquant — seed refusé.");
  }
  const errors: string[] = [];
  for (const url of candidates) {
    const client = new PrismaClient({ datasourceUrl: url });
    try {
      await client.$queryRaw`SELECT 1`;
      await client.$disconnect();
      console.log(`Connexion OK : ${maskUrl(url)}`);
      return url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${maskUrl(url)} → ${msg.split("\n")[0]}`);
      await client.$disconnect().catch(() => {});
    }
  }
  throw new Error(
    `Aucune URL base joignable.\n${errors.map((l) => `  • ${l}`).join("\n")}`,
  );
}

type SeedRow = {
  demoKey: string;
  clientName: string;
  siteAddress: string;
  amountHt: number;
  plannedCrewCount?: number;
  plannedDuration?: string;
  comment?: string;
  status?: AnnualContractStatus;
  plannedDate?: string; // YYYY-MM-DD — jamais inventée
};

const SEED_ROWS: SeedRow[] = [
  {
    demoKey: "SETRIM-CE-LOISELET",
    clientName: "LOISELET DAIGREMONT",
    siteAddress: "29/47 Avenue de Condé, 94100 Saint-Maur-des-Fossés",
    amountHt: 1085,
    plannedCrewCount: 2,
    plannedDuration: "1 jour",
    comment: "FCT 1952 DU 26/01/26 NON RÉGLÉE",
    plannedDate: "2026-01-23",
  },
  {
    demoKey: "SETRIM-CE-CLARDIM",
    clientName: "CLARDIM",
    siteAddress: "68 rue Gabriel Péri, 92120 Montrouge",
    amountHt: 679,
    plannedDate: "2026-02-05",
  },
  {
    demoKey: "SETRIM-CE-DAUCHEZ",
    clientName: "DAUCHEZ",
    siteAddress: "132 rue Léon Maurice Nordman, 75013 Paris",
    amountHt: 803,
    plannedCrewCount: 2,
    plannedDuration: "1 jour",
    comment: "1 jour à 2 gars ou 2 jours à 1 gars — très sale",
    plannedDate: "2026-02-27",
  },
  {
    demoKey: "SETRIM-CE-DMGESTION",
    clientName: "DM GESTION",
    siteAddress: "27/29 rue Léon Frot, 75011 Paris",
    amountHt: 577,
    plannedDate: "2026-05-19",
  },
  {
    demoKey: "SETRIM-CE-DUBREUIL",
    clientName: "DUBREUIL",
    siteAddress: "104 rue du Ménil, 92600 Asnières",
    amountHt: 1117,
    plannedDate: "2026-03-19",
  },
  {
    demoKey: "SETRIM-CE-CPAB",
    clientName: "CPAB",
    siteAddress: "13/15 rue Benjamin Franklin, 75016 Paris",
    amountHt: 672,
    plannedDate: "2026-01-23",
  },
  {
    demoKey: "SETRIM-CE-AVCIMMO",
    clientName: "AVCIMMO — FONCIA",
    siteAddress: "1/3 rue Jean Thomas, 95600 Eaubonne",
    amountHt: 1310,
    plannedDate: "2026-01-22",
  },
  {
    demoKey: "SETRIM-CE-CRAUNOT",
    clientName: "CRAUNOT",
    siteAddress: "43/49 rue Bernard Iske, 92350 Le Plessis-Robinson",
    amountHt: 1179,
    plannedCrewCount: 2,
    plannedDuration: "1 jour",
    comment: "1 jour / 2 gars",
    plannedDate: "2026-01-21",
  },
  {
    demoKey: "SETRIM-CE-NEXITY",
    clientName: "NEXITY PM",
    siteAddress: "Immeuble Le Pascal, 94000 Créteil",
    amountHt: 1210,
    comment: "ATTENTE OS NOUVEAU SYNDIC — DEVIS 41747",
    // Pas de date certaine → À programmer
  },
  {
    demoKey: "SETRIM-CE-CONCILIA",
    clientName: "CONCILIA",
    siteAddress: "2/6 rue Sadi Lecointe, 75019 Paris",
    amountHt: 950,
    comment: "VA ÊTRE RÉSILIÉ — 22/07/2026",
    status: "TERMINATING",
  },
];

async function main() {
  process.env.DATABASE_URL = await pickWorkingDatabaseUrl();
  const { prisma } = await import("../src/lib/prisma");
  const { evaluateSetrimEcoGuard, EcoEnvironmentError } = await import(
    "../src/lib/demo-environment/economic-scenario-guard"
  );

  const demo = await prisma.demoEnvironment.findFirst({
    where: {
      loginIdentifier: { in: ["bework-demo", "setrim"] },
      status: "ACTIVE",
    },
    select: {
      id: true,
      loginIdentifier: true,
      organizationId: true,
      status: true,
      companyName: true,
    },
  });

  if (!demo?.organizationId) {
    throw new EcoEnvironmentError("Démo SETRIM introuvable (loginIdentifier / org)");
  }

  const guard = evaluateSetrimEcoGuard({
    loginIdentifier: demo.loginIdentifier,
    organizationId: demo.organizationId,
    status: demo.status,
    companyName: demo.companyName,
  });
  if (!guard.ok) {
    throw new EcoEnvironmentError(guard.reason);
  }

  // Isolation BATINORD
  const batinord = await prisma.demoEnvironment.findFirst({
    where: { loginIdentifier: { in: ["batinord", "bework-batinord"] } },
    select: { organizationId: true },
  });
  if (batinord?.organizationId && batinord.organizationId === demo.organizationId) {
    throw new EcoEnvironmentError("Isolation rompue : org SETRIM = BATINORD");
  }

  const orgId = demo.organizationId;
  let created = 0;
  let updated = 0;

  for (const row of SEED_ROWS) {
    const existing = await prisma.annualServiceContract.findUnique({
      where: {
        organizationId_demoKey: { organizationId: orgId, demoKey: row.demoKey },
      },
      include: { interventions: { select: { id: true, plannedDate: true, status: true } } },
    });

    const nextPlannedDate = row.plannedDate
      ? new Date(`${row.plannedDate}T00:00:00.000Z`)
      : null;

    if (!existing) {
      const contract = await prisma.annualServiceContract.create({
        data: {
          organizationId: orgId,
          demoKey: row.demoKey,
          clientName: row.clientName,
          siteAddress: row.siteAddress,
          contractType: "CE",
          amountHt: row.amountHt,
          plannedCrewCount: row.plannedCrewCount ?? null,
          plannedDuration: row.plannedDuration ?? null,
          comment: row.comment ?? null,
          status: row.status ?? "ACTIVE",
          nextPlannedDate,
        },
      });
      if (nextPlannedDate) {
        await prisma.annualServiceIntervention.create({
          data: {
            contractId: contract.id,
            organizationId: orgId,
            plannedDate: nextPlannedDate,
            plannedCrewCount: row.plannedCrewCount ?? null,
            plannedDuration: row.plannedDuration ?? null,
            status: "TO_PREPARE",
            comment: row.comment ?? null,
          },
        });
      } else {
        // NEXITY / CONCILIA sans date : intervention « à programmer » sans plannedDate impossible (required)
        // → on crée une intervention ouverte uniquement si date connue.
        // Pour NEXITY : contrat sans nextPlannedDate, pas d’intervention jusqu’à programmation manuelle.
      }
      created += 1;
    } else {
      await prisma.annualServiceContract.update({
        where: { id: existing.id },
        data: {
          clientName: row.clientName,
          siteAddress: row.siteAddress,
          amountHt: row.amountHt,
          plannedCrewCount: row.plannedCrewCount ?? null,
          plannedDuration: row.plannedDuration ?? null,
          comment: row.comment ?? null,
          status: row.status ?? existing.status,
          nextPlannedDate: nextPlannedDate ?? existing.nextPlannedDate,
        },
      });

      if (nextPlannedDate) {
        const hasOpen = existing.interventions.some(
          (i) =>
            (i.status === "TO_PREPARE" || i.status === "SCHEDULED") &&
            i.plannedDate.toISOString().slice(0, 10) === row.plannedDate,
        );
        const hasAnyOpen = existing.interventions.some(
          (i) => i.status === "TO_PREPARE" || i.status === "SCHEDULED",
        );
        if (!hasOpen && !hasAnyOpen) {
          await prisma.annualServiceIntervention.create({
            data: {
              contractId: existing.id,
              organizationId: orgId,
              plannedDate: nextPlannedDate,
              plannedCrewCount: row.plannedCrewCount ?? null,
              plannedDuration: row.plannedDuration ?? null,
              status: "TO_PREPARE",
              comment: row.comment ?? null,
            },
          });
        }
      }
      updated += 1;
    }
  }

  const count = await prisma.annualServiceContract.count({
    where: { organizationId: orgId, demoKey: { startsWith: "SETRIM-CE-" } },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        organizationId: orgId,
        loginIdentifier: guard.loginIdentifier,
        created,
        updated,
        totalSeedContracts: count,
        expected: SEED_ROWS.length,
      },
      null,
      2,
    ),
  );

  if (count !== SEED_ROWS.length) {
    throw new Error(`Attendu ${SEED_ROWS.length} contrats seed, trouvé ${count}`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
