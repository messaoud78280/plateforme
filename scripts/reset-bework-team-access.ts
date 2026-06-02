/**
 * Réinitialise les accès gérantes + agents en base (mot de passe commun).
 * Usage: npm run db:reset-equipe
 */
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BEWORK_TEAM, BEWORK_TEAM_PASSWORD } from "../src/lib/bework-team-accounts";
import { getScriptDatabaseUrl, loadScriptEnv } from "./load-script-env";

loadScriptEnv();
const connectionUrl = getScriptDatabaseUrl();
if (!connectionUrl) {
  console.error("❌ DATABASE_URL manquant (.env ou .env.local)");
  process.exit(1);
}

const prisma = new PrismaClient({ datasourceUrl: connectionUrl });

async function main() {
  const hash = await bcrypt.hash(BEWORK_TEAM_PASSWORD, 12);
  console.log("→ Réinitialisation accès équipe BeWork\n");

  for (const u of BEWORK_TEAM) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password: hash, accountStatus: "APPROVED" },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        password: hash,
        accountStatus: "APPROVED",
      },
    });
    console.log(`  ✓ ${u.email} (${u.role})`);
  }

  const bulk = await prisma.user.updateMany({
    where: { role: { in: [UserRole.MANAGER, UserRole.AGENT, UserRole.AGENCE] } },
    data: { password: hash, accountStatus: "APPROVED" },
  });
  console.log(`\n→ ${bulk.count} compte(s) MANAGER/AGENT/AGENCE mis à jour`);
  console.log("→ Mot de passe :", BEWORK_TEAM_PASSWORD);
  console.log("→ Gérantes : /connexion/gerante");
  console.log("→ Agents   : /connexion/agents");
}

main()
  .catch((e) => {
    console.error("❌", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
