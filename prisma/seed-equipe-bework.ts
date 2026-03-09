/**
 * Crée les 6 comptes équipe BeWork : 2 gérantes (MANAGER) + 4 agents (AGENT).
 * Mot de passe commun : Samana78
 * À lancer avec : npm run db:seed:equipe
 */
import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL est requis. Configurez .env avec votre base Supabase.");
}

const prisma = new PrismaClient();

const EQUIPE = [
  { name: "Laure Olivié", email: "laure@bework.fr", role: UserRole.MANAGER as const },
  { name: "Hana", email: "hana@bework.fr", role: UserRole.MANAGER as const },
  { name: "Lina", email: "lina@bework.fr", role: UserRole.AGENT as const },
  { name: "Sara", email: "sara@bework.fr", role: UserRole.AGENT as const },
  { name: "Sonia", email: "sonia@bework.fr", role: UserRole.AGENT as const },
  { name: "Eva", email: "eva@bework.fr", role: UserRole.AGENT as const },
] as const;

const MOT_DE_PASSE_INITIAL = "Samana78";

async function main() {
  const hashedPassword = await bcrypt.hash(MOT_DE_PASSE_INITIAL, 12);

  console.log("Création des comptes équipe BeWork (mot de passe commun : Samana78)\n");

  for (const u of EQUIPE) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        password: hashedPassword,
      },
      create: {
        email: u.email,
        password: hashedPassword,
        name: u.name,
        role: u.role,
      },
    });
    const roleLabel = u.role === "MANAGER" ? "Gérante" : "Agent";
    console.log(`  ${roleLabel}: ${user.name} <${user.email}>`);
  }

  console.log("\nConnexion :");
  console.log("  Gérantes → /connexion/gerante");
  console.log("  Agents   → /connexion/agents");
  console.log("  Mot de passe pour tous :", MOT_DE_PASSE_INITIAL);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
