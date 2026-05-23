/**
 * Synchronisation bibliothèque → ressources chantier (ligne de commande).
 * Méthode fiable : pas de timeout navigateur, progression dans le terminal.
 *
 * Usage:
 *   npm run db:sync-chantier-from-library
 *   npm run db:sync-chantier-from-library -- --batch-size=20
 *   npm run db:sync-chantier-from-library -- --finalize-only=<runId>
 */
import { PrismaClient } from "@prisma/client";
import {
  finalizeLibrarySync,
  syncLibraryToChantierResourcesCore,
  type LibrarySyncProgress,
} from "../src/lib/chantier-resources/automated-library-sync";
import { getScriptDatabaseUrl, loadScriptEnv } from "./load-script-env";

loadScriptEnv();
const connectionUrl = getScriptDatabaseUrl();
if (!connectionUrl) {
  console.error("❌ DATABASE_URL manquant (.env ou .env.local)");
  process.exit(1);
}

const prisma = new PrismaClient({ datasourceUrl: connectionUrl });

function parseArgs() {
  let batchSize = 25;
  let finalizeOnly: string | null = null;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--batch-size=")) {
      batchSize = Math.min(60, Math.max(5, Number(arg.split("=")[1]) || 25));
    }
    if (arg.startsWith("--finalize-only=")) {
      finalizeOnly = arg.split("=")[1]?.trim() || null;
    }
  }
  return { batchSize, finalizeOnly };
}

function formatProgress(p: LibrarySyncProgress): string {
  const total = p.totalWorkItems;
  const done = p.stats.workItemsProcessed;
  const pct = total && total > 0 ? Math.round((done / total) * 100) : null;
  if (p.phase === "finalize") return "Finalisation (fusion doublons)…";
  if (p.phase === "done") return "Terminé.";
  const head = total ? `${done} / ${total} ouvrages` : `${done} ouvrage(s)`;
  return pct != null ? `${head} (${pct} %)` : head;
}

async function main() {
  const { batchSize, finalizeOnly } = parseArgs();
  const started = Date.now();

  if (finalizeOnly) {
    console.log(`▶ Finalisation seule (run ${finalizeOnly})…\n`);
    const result = await finalizeLibrarySync(prisma, finalizeOnly);
    printStats(result.stats, result.runId);
    console.log(`\n✅ Finalisation OK (${Math.round((Date.now() - started) / 1000)} s).`);
    return;
  }

  console.log("▶ Synchronisation bibliothèque → ressources chantier");
  console.log(`   Base : ${connectionUrl.replace(/:[^:@]+@/, ":***@")}`);
  console.log(`   Taille des lots : ${batchSize}\n`);

  let lastLine = "";
  const result = await syncLibraryToChantierResourcesCore(prisma, {
    batchSize,
    onProgress: (p) => {
      const line = formatProgress(p);
      if (line !== lastLine) {
        process.stdout.write(`\r   ${line}   `);
        lastLine = line;
      }
    },
  });

  process.stdout.write("\n\n");
  printStats(result.stats, result.runId);
  console.log(`\n✅ Terminé en ${Math.round((Date.now() - started) / 1000)} s.`);
  console.log("   Rafraîchissez « Ressources chantier » dans le navigateur pour voir le résultat.");
}

function printStats(
  s: LibrarySyncProgress["stats"],
  runId: string,
) {
  console.log("Run ID                 :", runId);
  console.log("Ouvrages parcourus     :", s.workItemsProcessed);
  console.log("Éléments extraits      :", s.candidatesExtracted);
  console.log("Alias regroupés        :", s.aliasesMerged);
  console.log("Nouvelles fiches       :", s.resourcesCreated);
  console.log("Fiches enrichies       :", s.resourcesMatched);
  console.log("Variantes              :", s.variantsCreated);
  console.log("Alias doublons retirés :", s.aliasesRemoved);
  console.log("Fiches fusionnées      :", s.resourceFichesMerged);
}

main()
  .catch((e) => {
    console.error("\n❌", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
