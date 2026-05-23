/**
 * Synchronisation bibliothèque → ressources chantier (ligne de commande).
 *
 * Usage:
 *   npm run db:sync-chantier-from-library
 *   npm run db:sync-chantier-from-library -- --batch-size=8
 *   npm run db:sync-chantier-from-library -- --fresh
 */
import { PrismaClient } from "@prisma/client";
import {
  finalizeLibrarySync,
  findResumableLibrarySyncRunId,
  syncLibraryToChantierResourcesCore,
  type LibrarySyncProgress,
} from "../src/lib/chantier-resources/automated-library-sync";
import {
  getScriptDatabaseUrlCandidatesForLongJobs,
  loadScriptEnv,
} from "./load-script-env";

loadScriptEnv();

let connectionUrl = "";

function createPrisma() {
  return new PrismaClient({ datasourceUrl: connectionUrl });
}

function maskUrl(url: string) {
  return url.replace(/:[^:@]+@/, ":***@");
}

async function pickWorkingDatabaseUrl(): Promise<string> {
  const candidates = getScriptDatabaseUrlCandidatesForLongJobs();
  if (candidates.length === 0) {
    throw new Error("DATABASE_URL manquant (.env ou .env.local)");
  }

  const errors: string[] = [];
  for (const url of candidates) {
    const prisma = new PrismaClient({ datasourceUrl: url });
    try {
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      console.log(`   Connexion OK : ${maskUrl(url)}\n`);
      return url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${maskUrl(url)} → ${msg.split("\n")[0]}`);
      await prisma.$disconnect().catch(() => {});
    }
  }

  throw new Error(
    `Aucune URL Supabase joignable.\n${errors.map((l) => `   • ${l}`).join("\n")}\n\nVérifiez DATABASE_URL, votre réseau (Wi‑Fi / VPN) et que le projet Supabase est actif.`,
  );
}

function parseArgs() {
  let batchSize = 8;
  let finalizeOnly: string | null = null;
  let fresh = false;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--batch-size=")) {
      batchSize = Math.min(30, Math.max(5, Number(arg.split("=")[1]) || 8));
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
  connectionUrl = await pickWorkingDatabaseUrl();

  const { batchSize, finalizeOnly, fresh } = parseArgs();
  const started = Date.now();
  let prisma = createPrisma();

  if (finalizeOnly) {
    console.log(`▶ Finalisation seule (run ${finalizeOnly})…\n`);
    const result = await finalizeLibrarySync(prisma, finalizeOnly);
    printStats(result.stats, result.runId);
    console.log(`\n✅ Finalisation OK (${Math.round((Date.now() - started) / 1000)} s).`);
    await prisma.$disconnect();
    return;
  }

  console.log("▶ Synchronisation bibliothèque → ressources chantier");
  console.log(`   Taille des lots : ${batchSize} (connexion fermée après chaque lot)`);

  let initialRunId: string | null = null;
  if (!fresh) {
    initialRunId = await findResumableLibrarySyncRunId(prisma);
    if (initialRunId) {
      console.log(`   Reprise du run interrompu : ${initialRunId}`);
    }
  }

  console.log("");

  let lastLine = "";
  let reconnects = 0;

  const result = await syncLibraryToChantierResourcesCore(prisma, {
    batchSize,
    initialRunId,
    shortLivedConnections: true,
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
  console.log("   Rafraîchissez « Ressources chantier » dans le navigateur.");
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
  console.error("\n   Relancez la même commande pour reprendre (progression enregistrée par lots).");
  process.exit(1);
});
