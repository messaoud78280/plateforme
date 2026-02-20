/**
 * Met à jour les mots de passe des comptes de démo en base (Supabase).
 * À utiliser quand la modification manuelle dans le Table Editor ne s'enregistre pas (RLS, etc.).
 *
 * Usage:
 *   npm run db:update-demo-passwords
 *   # ou avec un mot de passe personnalisé :
 *   MOT_DE_PASSE_DEMO="monmotdepasse" npm run db:update-demo-passwords
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionUrl) {
  console.error("❌ DIRECT_URL ou DATABASE_URL manquant dans .env");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasourceUrl: connectionUrl,
});

const DEMO_EMAILS = ["agence@exemple.com", "client@exemple.com"];
const PASSWORD = process.env.MOT_DE_PASSE_DEMO ?? "motdepasse123";

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 12);

  console.log("→ Connexion à la base...");
  console.log("→ Mise à jour des comptes de démo avec le mot de passe:", PASSWORD);

  for (const email of DEMO_EMAILS) {
    const updated = await prisma.user.updateMany({
      where: { email },
      data: { password: hash },
    });
    if (updated.count > 0) {
      console.log("  ✓", email);
    } else {
      console.log("  ⚠", email, "(aucune ligne mise à jour, l'utilisateur n'existe peut-être pas)");
    }
  }

  console.log("→ Terminé. Vous pouvez vous connecter avec ces comptes et le mot de passe:", PASSWORD);
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
