/**
 * ONBOARDING-1 — seed client pilote BATINORD.
 *
 *   npm run db:seed-batinord-pilot
 *
 * Refuse SETRIM. Idempotent (2ᵉ exécution = 0 doublon).
 */
import { PrismaClient } from "@prisma/client";
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
    throw new Error("DATABASE_URL manquant — seed BATINORD refusé.");
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

async function main() {
  process.env.DATABASE_URL = await pickWorkingDatabaseUrl();

  const {
    BatinordEnvironmentError,
    BATINORD_LOGIN_IDENTIFIER,
  } = await import("../src/lib/demo-environment/batinord-pilot-guard");
  const { runBatinordPilotSeed, countBatinordEntities } = await import(
    "../src/lib/demo-environment/batinord-pilot"
  );

  console.log("ONBOARDING-1 — seed BATINORD (hors SETRIM)\n");

  let first;
  try {
    first = await runBatinordPilotSeed();
  } catch (e) {
    if (e instanceof BatinordEnvironmentError) {
      console.error(`REFUS ENVIRONNEMENT : ${e.message}`);
      process.exit(1);
    }
    throw e;
  }

  if (first.loginIdentifier !== BATINORD_LOGIN_IDENTIFIER) {
    throw new Error("loginIdentifier inattendu — seed interrompu");
  }

  const afterFirst = await countBatinordEntities(first.organizationId);
  console.log("\n→ Seconde exécution (idempotence)…\n");
  const second = await runBatinordPilotSeed();
  const afterSecond = await countBatinordEntities(second.organizationId);

  if (first.organizationId !== second.organizationId) {
    throw new Error("organizationId a changé entre deux exécutions — SETRIM/BATINORD à risque");
  }

  const keys = Object.keys(afterFirst) as (keyof typeof afterFirst)[];
  const diffs = keys.filter((k) => afterFirst[k] !== afterSecond[k]);
  if (diffs.length > 0) {
    console.error("Doublons détectés :", { afterFirst, afterSecond, diffs });
    process.exit(1);
  }

  console.log("\nBATINORD prêt");
  console.log(`  organisation : ${first.organizationId}`);
  console.log(`  loginIdentifier : ${first.loginIdentifier}`);
  console.log(`  Christopher : ${first.users.christopher.email}`);
  console.log(`  Laura : ${first.users.laura.email}`);
  console.log(`  Nicolas : ${first.users.nicolas.email}`);
  console.log(`  counts : ${JSON.stringify(afterSecond)}`);
  console.log("  mot de passe : convention démo/recette existante (non affiché)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect().catch(() => {});
  });
