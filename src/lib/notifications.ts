import { prisma } from "@/lib/prisma";

type NotificationType =
  | "NEW_TASK"
  | "TASK_ASSIGNED"
  | "MESSAGE_RECEIVED"
  | "TASK_COMPLETED"
  | "TASK_TO_VALIDATE"
  | "DOCUMENT_ADDED"
  | "MISSING_PIECE"
  | "DEADLINE_NEAR"
  | "REPORT_CREATED"
  | "DELIVERABLE_UPLOADED"
  | "CLIENT_DECISION"
  | "AGENDA_INVITE"
  | "AGENDA_REMINDER"
  | "AGENDA_UNCLOSED"
  | "FOLLOWUP_REMINDER"
  | "FOLLOWUP_URGENT"
  | "FOLLOWUP_CRITICAL";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl ?? undefined,
      },
    });
  } catch (e) {
    console.error("createNotification:", e);
  }
}

/** Notifier les gérantes (MANAGER) */
export async function notifyManagers(params: Omit<Parameters<typeof createNotification>[0], "userId">) {
  const managers = await prisma.user.findMany({
    where: { role: "MANAGER" },
    select: { id: true },
  });
  for (const m of managers) {
    await createNotification({ ...params, userId: m.id });
  }
}
