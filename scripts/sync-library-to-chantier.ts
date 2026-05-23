/**
 * Synchronisation bibliothèque → ressources chantier (ligne de commande).
 * Méthode fiable : pas de timeout navigateur, progression dans le terminal.
 *
 * Usage:
 *   npm run db:sync-chantier-from-library
 *   npm run db:sync-chantier-from-library -- --batch-size=12
 *   npm run db:sync-chantier-from-library -- --finalize-only=<runId>
 *
 * Important : DIRECT_URL (port 5432) dans .env.local — le pooler Supabase (6543) coupe
 * les connexions longues (« Server has closed the connection »).
 */
import { PrismaClient } from "@prisma/client";
import {
  finalizeLibrarySync,
  findResumableLibrarySyncRunId,
  syncLibraryToChantierResourcesCore,
  type LibrarySyncProgress,
} from "../src/lib/chantier-resources/automated-library-sync";
import {
  getScriptDatabaseUrlForLongJobs,
  isPoolerDatabaseUrl,
  isTrueSupabaseDirectUrl,
  loadScriptEnv,
  normalizeSupabaseDirectUrl,
} from "./load-script-env";

loadScriptEnv();
const connectionUrl = getScriptDatabaseUrlForLongJobs();
if (!connectionUrl) {
  console.error("❌ DATABASE_URL ou DIRECT_URL manquant (.env ou .env.local)");
  process.exit(1);
}

function createPrisma() {
  return new PrismaClient({ datasourceUrl: connectionUrl });
}

function parseArgs() {
  let batchSize = 12;
  let finalizeOnly: string | null = null;
  let fresh = false;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--batch-size=")) {
      batchSize = Math.min(40, Math.max(5, Number(arg.split("=")[1]) || 12));
    }
    if (arg.startsWith("--finalize-only=")) {
      finalizeOnly = arg.split("=")[1]?.trim() || null;
    }
    if (arg === "--fresh") fresh = true;
  }
  return { batchSize, finalizeOnly, fresh };
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
  const { batchSize, finalizeOnly, fresh } = parseArgs();
  const started = Date.now();
  let prisma = createPrisma();

  const rawDirect = (process.env.DIRECT_URL ?? "").trim();
  if (rawDirect && normalizeSupabaseDirectUrl(rawDirect) !== rawDirect) {
    console.log("   URL directe normalisée : pooler → db.*.supabase.co\n");
  }

  if (!isTrueSupabaseDirectUrl(connectionUrl)) {
    console.warn(
      "⚠ Connexion non directe — ajoutez DIRECT_URL avec db.[ref].supabase.co:5432 dans Supabase → Database.\n",
    );
  } else if (isPoolerDatabaseUrl(connectionUrl)) {
    console.warn("⚠ Pooler détecté — risque de coupure.\n");
  }

  if (finalizeOnly) {
    console.log(`▶ Finalisation seule (run ${finalizeOnly})…\n`);
    const result = await finalizeLibrarySync(prisma, finalizeOnly);
    printStats(result.stats, result.runId);
    console.log(`\n✅ Finalisation OK (${Math.round((Date.now() - started) / 1000)} s).`);
    await prisma.$disconnect();
    return;
  }

  console.log("▶ Synchronisation bibliothèque → ressources chantier");
  console.log(`   Base : ${connectionUrl.replace(/:[^:@]+@/, ":***@")}`);
  console.log(`   Taille des lots : ${batchSize}`);

  let initialRunId: string | null = null;
  if (!fresh) {
    initialRunId = await findResumableLibrarySyncRunId(prisma);
    if (initialRunId) {
      console.log(`   Reprise du run interrompu : ${initialRunId}`);
    }
  }

  console.log("   Reconnexion auto si la connexion est coupée.\n");

  let lastLine = "";
  let reconnects = 0;

  const result = await syncLibraryToChantierResourcesCore(prisma, {
    batchSize,
    initialRunId,
    createClient: createPrisma,
    onReconnect: () => {
      reconnects += 1;
      process.stdout.write(`\n   ↻ Reconnexion (${reconnects})…\n`);
    },
    onProgress: (p) => {
      const line = formatProgress(p);
      if (line !== lastLine) {
        process.stdout.write(`\r   ${line}   `);
        lastLine = line;
      }
    },
  });

  prisma = result.prisma;

  process.stdout.write("\n\n");
  printStats(result.stats, result.runId);
  if (reconnects > 0) {
    console.log(`Reconnexions           : ${reconnects}`);
  }
  console.log(`\n✅ Terminé en ${Math.round((Date.now() - started) / 1000)} s.`);
  console.log("   Rafraîchissez « Ressources chantier » dans le navigateur pour voir le résultat.");
  await prisma.$disconnect();
}

function printStats(s: LibrarySyncProgress["stats"], runId: string) {
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

main().catch((e) => {
  console.error("\n❌", e instanceof Error ? e.message : e);
  console.error("\n   Relancez la même commande : la progression est enregistrée par lots.");
  process.exit(1);
});
