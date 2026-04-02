/**
 * Recrée uniquement les 6 comptes équipe BeWork (idempotent).
 * Le seed principal (npm run db:seed) les inclut déjà — ce script sert à les réinitialiser seuls.
 * Mot de passe : voir BEWORK_TEAM_PASSWORD dans seed-bework-team.ts
 *
 * À lancer avec : npm run db:seed:equipe
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BEWORK_TEAM, BEWORK_TEAM_PASSWORD } from "./seed-bework-team";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL est requis. Configurez .env avec votre base Supabase.");
}

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash(BEWORK_TEAM_PASSWORD, 12);

  console.log(`Création des comptes équipe BeWork (mot de passe commun : ${BEWORK_TEAM_PASSWORD})\n`);

  for (const u of BEWORK_TEAM) {
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
  console.log("  Mot de passe pour tous :", BEWORK_TEAM_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
