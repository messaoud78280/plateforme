/**
 * Vérifie la connexion à Supabase (PostgreSQL).
 * Lancez avec : npm run db:check
 *
 * Même résolution d’URL que `src/lib/prisma.ts` : DIRECT_URL si valide, sinon DATABASE_URL.
 * Charge `.env` puis `.env.local` (comme Next.js en local).
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const root = resolve(__dirname, "..");
config({ path: resolve(root, ".env") });
config({ path: resolve(root, ".env.local"), override: true });

function getConnectionUrl(): { url: string; source: "DIRECT_URL" | "DATABASE_URL" } {
  const rawDirect = (process.env.DIRECT_URL ?? "").trim();
  const validDirect =
    rawDirect && (rawDirect.startsWith("postgresql://") || rawDirect.startsWith("postgres://"));
  const fallback = (process.env.DATABASE_URL ?? "").trim();
  const url = validDirect ? rawDirect : fallback;
  if (url && (url.startsWith("postgresql://") || url.startsWith("postgres://"))) {
    return { url, source: validDirect ? "DIRECT_URL" : "DATABASE_URL" };
  }
  return { url: "", source: "DATABASE_URL" };
}

const { url: connectionString, source: urlSource } = getConnectionUrl();
if (!connectionString) {
  console.error("❌ DATABASE_URL ou DIRECT_URL manquant / invalide (.env ou .env.local)");
  process.exit(1);
}

// Même mode de connexion que l’app (sans driver adapter : preview non activée dans schema.prisma).
const prisma = new PrismaClient({ datasourceUrl: connectionString });

async function main() {
  console.log(`🔌 Connexion à Supabase… (variable utilisée : ${urlSource})`);
  try {
    await prisma.$connect();
    console.log("✅ Connexion réussie !\n");

    try {
      const userCount = await prisma.user.count();
      const projectCount = await prisma.project.count();
      console.log(`   📊 ${userCount} utilisateur(s), ${projectCount} projet(s)`);
    } catch {
      console.log("   ⚠️  Les tables n'existent pas encore.");
      console.log("   → Lancez : npm run db:push  puis  npm run db:seed");
    }
  } catch (e) {
    console.error("❌ Erreur de connexion:", (e as Error).message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
