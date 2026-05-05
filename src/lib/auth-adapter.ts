import type { Adapter } from "next-auth/adapters";
import type { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

/**
 * Adaptateur NextAuth + recherche d’utilisateur insensible à la casse sur l’email
 * (PostgreSQL : `findUnique` sur `email` est sensible à la casse).
 * Indispensable pour le magic link après inscription (identifiant dans l’URL toujours en minuscules).
 */
export function prismaAdapterCaseInsensitiveEmail(prisma: PrismaClient): Adapter {
  const base = PrismaAdapter(prisma);
  return {
    ...base,
    async getUserByEmail(email) {
      if (!email?.trim()) return null;
      const fromAdapter = await base.getUserByEmail?.(email);
      if (fromAdapter) return fromAdapter;
      return prisma.user.findFirst({
        where: { email: { equals: email.trim(), mode: "insensitive" } },
      });
    },
  };
}
