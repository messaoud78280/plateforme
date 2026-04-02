import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BEWORK_TEAM, BEWORK_TEAM_PASSWORD } from "./seed-bework-team";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL est requis. Configurez votre projet Supabase.");
}

const prisma = new PrismaClient({ datasourceUrl: connectionString });

async function main() {
  const hashedPassword = await bcrypt.hash("motdepasse123", 12);

  // Compte client de démo
  const client = await prisma.user.upsert({
    where: { email: "client@exemple.com" },
    update: {},
    create: {
      email: "client@exemple.com",
      password: hashedPassword,
      name: "Client Démo",
      role: UserRole.CLIENT,
    },
  });

  // Compte agence de démo
  const agence = await prisma.user.upsert({
    where: { email: "agence@exemple.com" },
    update: {},
    create: {
      email: "agence@exemple.com",
      password: hashedPassword,
      name: "Agence Démo",
      role: UserRole.AGENCE,
    },
  });

  const teamHash = await bcrypt.hash(BEWORK_TEAM_PASSWORD, 12);
  for (const u of BEWORK_TEAM) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        password: teamHash,
      },
      create: {
        email: u.email,
        password: teamHash,
        name: u.name,
        role: u.role,
      },
    });
  }

  console.log("Utilisateurs créés:");
  console.log("  Client:", client.email, "(mot de passe: motdepasse123)");
  console.log("  Agence:", agence.email, "(mot de passe: motdepasse123)");
  console.log("");
  console.log("  Équipe BeWork (gérantes + agents) — mot de passe commun :", BEWORK_TEAM_PASSWORD);
  for (const u of BEWORK_TEAM) {
    const label = u.role === "MANAGER" ? "Gérante" : "Agent";
    console.log(`    ${label}: ${u.email}`);
  }
  console.log("");
  console.log("  Connexion : /connexion/gerante · /connexion/agents · /connexion/clients");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
