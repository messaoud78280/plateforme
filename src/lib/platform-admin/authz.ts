import { PlatformRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdminRole } from "@/lib/platform-admin/role";

export { isPlatformAdminRole } from "@/lib/platform-admin/role";

export async function getPlatformRoleForUserId(
  userId: string,
): Promise<PlatformRole | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { platformRole: true },
  });
  return u?.platformRole ?? null;
}

export type PlatformAdminSession = {
  userId: string;
  email: string;
  name: string;
  platformRole: PlatformRole;
};

/**
 * Session NextAuth + revalidation DB du platformRole (JWT peut être stale).
 */
export async function requirePlatformAdmin(): Promise<PlatformAdminSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/admin/connexion");
  }

  const db = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      platformRole: true,
      accessStatus: true,
    },
  });

  if (
    !db ||
    !isPlatformAdminRole(db.platformRole) ||
    db.accessStatus === "SUSPENDED" ||
    db.accessStatus === "DISABLED"
  ) {
    redirect("/admin/connexion?error=forbidden");
  }

  return {
    userId: db.id,
    email: db.email,
    name: db.name,
    platformRole: db.platformRole!,
  };
}

/** Pour API — retourne null si non autorisé (pas de redirect). */
export async function getPlatformAdminOrNull(): Promise<PlatformAdminSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const db = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      platformRole: true,
      accessStatus: true,
    },
  });

  if (
    !db ||
    !isPlatformAdminRole(db.platformRole) ||
    db.accessStatus === "SUSPENDED" ||
    db.accessStatus === "DISABLED"
  ) {
    return null;
  }

  return {
    userId: db.id,
    email: db.email,
    name: db.name,
    platformRole: db.platformRole!,
  };
}
