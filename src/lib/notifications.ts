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
  | "DELIVERY_CHECK"
  | "DELIVERY_MISSING"
  | "FOLLOWUP_REMINDER"
  | "FOLLOWUP_ESCALATION"
  | "FOLLOWUP_URGENT"
  | "FOLLOWUP_CRITICAL"
  | "FOLLOWUP_ATTENTION"
  | "PURCHASE_ORDER_REMINDER"
  | "PURCHASE_ORDER_ESCALATION"
  | "PURCHASE_ORDER_URGENT"
  | "PURCHASE_ORDER_CRITICAL"
  | "PURCHASE_ORDER_ATTENTION"
  | "MESSAGE_ACTION_ASSIGNED";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  /** Si fourni : upsert / ignore les doublons (W3-C1). */
  dedupeKey?: string | null;
}) {
  try {
    if (params.dedupeKey) {
      await prisma.notification.upsert({
        where: { dedupeKey: params.dedupeKey },
        create: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          actionUrl: params.actionUrl ?? undefined,
          dedupeKey: params.dedupeKey,
        },
        // Ne pas réécrire : préserve lu/non lu et évite le spam
        update: {},
      });
      return;
    }
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
