/**
 * Synchronisation batch bibliothèque → ressources chantier (sans UI).
 *
 * Usage:
 *   npx tsx scripts/sync-library-to-chantier.ts
 */
import { PrismaClient } from "@prisma/client";
import { syncLibraryToChantierResourcesCore } from "../src/lib/chantier-resources/automated-library-sync";
import { getScriptDatabaseUrl, loadScriptEnv } from "./load-script-env";

loadScriptEnv();
const connectionUrl = getScriptDatabaseUrl();
if (!connectionUrl) {
  console.error("❌ DATABASE_URL manquant (.env ou .env.local)");
  process.exit(1);
}

const prisma = new PrismaClient({ datasourceUrl: connectionUrl });

async function main() {
  console.log("▶ Synchronisation bibliothèque → ressources chantier…\n");
  const result = await syncLibraryToChantierResourcesCore(prisma);
  const s = result.stats;
  console.log("Run ID:", result.runId);
  console.log("Ouvrages parcourus     :", s.workItemsProcessed);
  console.log("Éléments extraits      :", s.candidatesExtracted);
  console.log("Alias regroupés        :", s.aliasesMerged);
  console.log("Nouvelles fiches       :", s.resourcesCreated);
  console.log("Fiches enrichies       :", s.resourcesMatched);
  console.log("Variantes              :", s.variantsCreated);
  console.log("Alias doublons retirés :", s.aliasesRemoved);
  console.log("Fiches fusionnées      :", s.resourceFichesMerged);
  console.log("\n✅ Terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
