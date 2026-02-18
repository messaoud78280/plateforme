/**
 * Vérifie la connexion à Supabase (PostgreSQL).
 * Lancez avec : npm run db:check
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL manquant dans .env");
  process.exit(1);
}

const adapter = new PrismaPg({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔌 Connexion à Supabase...");
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
