/**
 * Bootstrap / promotion du premier Platform Admin BeWork.
 *
 * Usage (local ou Railway one-off) :
 *   PLATFORM_ADMIN_BOOTSTRAP_EMAIL=... \
 *   PLATFORM_ADMIN_BOOTSTRAP_PASSWORD=... \
 *   npx tsx scripts/bootstrap-platform-admin.ts
 *
 * - Crée le compte s’il n’existe pas, ou lui attribue platformRole=PLATFORM_ADMIN.
 * - Ne lit aucun secret depuis le code source.
 * - Ne log jamais le mot de passe.
 */

import bcrypt from "bcryptjs";
import { PrismaClient, PlatformRole, UserRole } from "@prisma/client";

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

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, platformRole: true },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          platformRole: PlatformRole.PLATFORM_ADMIN,
          accountStatus: "APPROVED",
          accessStatus: "ACTIVE",
          password: await bcrypt.hash(password, 12),
        },
      });
      console.log(
        existing.platformRole === PlatformRole.PLATFORM_ADMIN
          ? `OK — admin existant mis à jour (mot de passe réinitialisé) : ${email}`
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
