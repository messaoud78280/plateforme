/**
 * Helpers purs — sûrs côté client (pas d’import next-auth / nodemailer).
 */

import { PlatformRole } from "@prisma/client";

export function isPlatformAdminRole(
  role: string | PlatformRole | null | undefined,
): boolean {
  return role === PlatformRole.PLATFORM_ADMIN || role === "PLATFORM_ADMIN";
}
