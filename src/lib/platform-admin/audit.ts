import { prisma } from "@/lib/prisma";

export async function logPlatformAdminAction(input: {
  actorUserId: string;
  organizationId?: string | null;
  action: string;
  context?: string | null;
}) {
  try {
    await prisma.platformAdminAuditEvent.create({
      data: {
        actorUserId: input.actorUserId,
        organizationId: input.organizationId ?? null,
        action: input.action,
        context: input.context ?? null,
      },
    });
  } catch (e) {
    console.error("[platform-admin] audit log failed:", e);
  }
}
