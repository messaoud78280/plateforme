import { prisma } from "@/lib/prisma";

export async function appendFollowUpTimeline(params: {
  sheetId: string;
  authorId?: string | null;
  kind: string;
  label: string;
  detail?: string | null;
  occurredAt?: Date;
}) {
  return prisma.followUpTimelineEvent.create({
    data: {
      sheetId: params.sheetId,
      authorId: params.authorId ?? undefined,
      kind: params.kind,
      label: params.label,
      detail: params.detail ?? undefined,
      occurredAt: params.occurredAt ?? new Date(),
    },
  });
}
