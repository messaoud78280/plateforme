import { prisma } from "@/lib/prisma";

export async function logPilotageActivity(params: {
  pilotageId: string;
  userId?: string | null;
  userName?: string | null;
  actionType: string;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  oldValue?: string | null;
  newValue?: string | null;
  comment?: string | null;
}) {
  await prisma.pilotageActivity.create({
    data: {
      pilotageId: params.pilotageId,
      userId: params.userId ?? null,
      userName: params.userName ?? null,
      actionType: params.actionType,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      entityLabel: params.entityLabel ?? null,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
      comment: params.comment ?? null,
    },
  });
}
