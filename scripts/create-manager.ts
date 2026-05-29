/**
 * Crée ou met à jour un compte gérant (MANAGER) BeWork.
 * Usage: npx tsx scripts/create-manager.ts [email] [nom] [mot de passe]
 * Exemple: npx tsx scripts/create-manager.ts alya@bework.fr "Alya" "Samana78"
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { getScriptDatabaseUrl, loadScriptEnv } from "./load-script-env";

loadScriptEnv();
const connectionUrl = getScriptDatabaseUrl();
if (!connectionUrl) {
  console.error("❌ DATABASE_URL manquant (.env ou .env.local)");
  process.exit(1);
}

const prisma = new PrismaClient({ datasourceUrl: connectionUrl });

const email = process.argv[2]?.trim();
const name = process.argv[3]?.trim();
const password = process.argv[4]?.trim();

if (!email || !name || !password) {
  console.error("Usage: npx tsx scripts/create-manager.ts [email] [nom] [mot de passe]");
  process.exit(1);
}

async function main() {
  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    create: {
      email: email.toLowerCase(),
      name,
      password: hash,
      role: "MANAGER",
      contractStatus: "SIGNED",
    },
    update: { role: "MANAGER", password: hash, name, contractStatus: "SIGNED" },
  });
  console.log("Compte gérant créé ou mis à jour :");
  console.log("  ID:", user.id);
  console.log("  Email:", user.email);
  console.log("  Nom:", user.name);
  console.log("  Rôle:", user.role);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
