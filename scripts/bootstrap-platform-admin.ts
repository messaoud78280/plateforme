/**
 * Bootstrap / promotion du premier Platform Admin BeWork.
 *
 * Préfère DIRECT_URL (connexion Postgres directe) pour éviter les échecs
 * d’auth / prepared statements via le pooler transaction mode (6543).
 *
 * Usage :
 *   PLATFORM_ADMIN_BOOTSTRAP_EMAIL=... \
 *   PLATFORM_ADMIN_BOOTSTRAP_PASSWORD=... \
 *   npm run db:bootstrap-platform-admin
 *
 * Ne log jamais le mot de passe. Aucun secret dans le code.
 */

import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import bcrypt from "bcryptjs";
import { PrismaClient, PlatformRole, UserRole } from "@prisma/client";

// .env puis .env.local (local gagne) — comme Next
loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

function pickDatabaseUrl(): string {
  const direct = (process.env.DIRECT_URL ?? "").trim();
  const pooled = (process.env.DATABASE_URL ?? "").trim();
  // Session pooler :5432 ou hôte db.* → préférer pour scripts one-shot
  if (direct) {
    try {
      const u = new URL(direct);
      const isTransactionPooler =
        u.hostname.includes("pooler.supabase.com") && u.port === "6543";
      if (!isTransactionPooler) return direct;
    } catch {
      /* ignore */
    }
  }
  if (!pooled) {
    throw new Error("DATABASE_URL ou DIRECT_URL manquant.");
  }
  return pooled;
}

async function main() {
  const email = (process.env.PLATFORM_ADMIN_BOOTSTRAP_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.PLATFORM_ADMIN_BOOTSTRAP_PASSWORD ?? "";
  const name = (process.env.PLATFORM_ADMIN_BOOTSTRAP_NAME ?? "Administration BeWork").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("PLATFORM_ADMIN_BOOTSTRAP_EMAIL invalide ou manquant.");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("PLATFORM_ADMIN_BOOTSTRAP_PASSWORD requis (12 caractères min.).");
    process.exit(1);
  }

  const url = pickDatabaseUrl();
  let host = "(invalid)";
  try {
    host = new URL(url).hostname;
  } catch {
    /* ignore */
  }
  console.info(`[bootstrap-platform-admin] connexion → ${host}`);

  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[bootstrap-platform-admin] Échec authentification / connexion DB.");
    console.error(msg.split("\n")[0]);
    console.error(
      "Vérifiez DIRECT_URL (hôte db.<project>.supabase.co:5432, user postgres) et le mot de passe Supabase Database (Settings → Database). Le pooler 6543 peut échouer pour les scripts one-shot.",
    );
    await prisma.$disconnect().catch(() => undefined);
    process.exit(1);
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, platformRole: true, organizationsOwned: { select: { id: true } } },
    });

    if (existing?.organizationsOwned?.length) {
      console.error(
        "Refus : cet email possède déjà une organisation cliente. Utilisez un email dédié admin (ex. +admin@).",
      );
      process.exit(1);
    }

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          platformRole: PlatformRole.PLATFORM_ADMIN,
          accountStatus: "APPROVED",
          accessStatus: "ACTIVE",
          mustChangePassword: false,
          password: await bcrypt.hash(password, 12),
        },
      });
      console.log(
        existing.platformRole === PlatformRole.PLATFORM_ADMIN
          ? `OK — admin mis à jour : ${email}`
          : `OK — compte promu PLATFORM_ADMIN : ${email}`,
      );
    } else {
      await prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash(password, 12),
          name,
          role: UserRole.MANAGER,
          platformRole: PlatformRole.PLATFORM_ADMIN,
          accountStatus: "APPROVED",
          accessStatus: "ACTIVE",
          contractStatus: "SIGNED",
          mustChangePassword: false,
          personType: null,
          permissionProfile: null,
        },
      });
      console.log(`OK — compte Platform Admin créé : ${email}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
