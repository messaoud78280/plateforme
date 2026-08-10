import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Une lecture user CLIENT par requête RSC (layout). */
export const getCachedClientGate = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      accountStatus: true,
      company: true,
      personType: true,
      permissionProfile: true,
    },
  });
});

export const getCachedDemoExpiry = cache(async (demoEnvironmentId: string) => {
  return prisma.demoEnvironment.findUnique({
    where: { id: demoEnvironmentId },
    select: {
      expiresAt: true,
      companyName: true,
      logoUrl: true,
      organizationId: true,
      loginIdentifier: true,
    },
  });
});
