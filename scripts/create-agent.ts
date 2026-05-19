/**
 * Crée un compte agent virtuel (assistante) pour la plateforme BeWork.
 * Usage: npx tsx scripts/create-agent.ts [email] [nom] [mot de passe]
 * Exemple: npx tsx scripts/create-agent.ts agent@bework.fr "Sarah" "motdepasse123"
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

const email = process.argv[2]?.trim() || "agent@bework.fr";
const name = process.argv[3]?.trim() || "Agent BeWork";
const password = process.argv[4]?.trim() || "motdepasse123";

async function main() {
  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    create: {
      email: email.toLowerCase(),
      name,
      password: hash,
      role: "AGENT",
    },
    update: { role: "AGENT", password: hash, name },
  });
  console.log("Compte agent créé ou mis à jour:");
  console.log("  ID:", user.id);
  console.log("  Email:", user.email);
  console.log("  Nom:", user.name);
  console.log("  Rôle:", user.role);
  console.log("  Mot de passe (en clair):", password);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
