import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

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

  console.log("Utilisateurs créés:");
  console.log("  Client:", client.email, "(mot de passe: motdepasse123)");
  console.log("  Agence:", agence.email, "(mot de passe: motdepasse123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
