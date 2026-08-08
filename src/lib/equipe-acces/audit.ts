import { prisma } from "@/lib/prisma";

export async function logAccessAction(input: {
  organizationId?: string | null;
  actorUserId?: string | null;
  targetUserId?: string | null;
  action: string;
  detail?: string | null;
}): Promise<void> {
  try {
    await prisma.accessAuditLog.create({
      data: {
        organizationId: input.organizationId ?? undefined,
        actorUserId: input.actorUserId ?? undefined,
        targetUserId: input.targetUserId ?? undefined,
        action: input.action,
        detail: input.detail ?? undefined,
      },
    });
  } catch (e) {
    console.error("[AccessAuditLog]", e);
  }
}
