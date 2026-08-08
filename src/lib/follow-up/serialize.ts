import type { FollowUpSheet, FollowUpSheetStatus, FollowUpUrgency, User } from "@prisma/client";
import { computeUrgencyFromDue, formatDelay, formatDueLabel } from "@/lib/follow-up/urgency";
import {
  POSTIT_COLORS,
  STATUS_LABELS,
  URGENCY_LABELS,
  URGENCY_STYLES,
  type UrgencyThresholds,
} from "@/lib/follow-up/types";

type SheetWithRels = FollowUpSheet & {
  assignee?: Pick<User, "id" | "name" | "email"> | null;
  createdBy?: Pick<User, "id" | "name" | "email"> | null;
  project?: { id: string; title: string; siteCity: string | null; siteAddress: string | null } | null;
  timeline?: {
    id: string;
    kind: string;
    label: string;
    detail: string | null;
    occurredAt: Date;
    author: { id: string; name: string } | null;
  }[];
  agendaEvents?: {
    id: string;
    title: string;
    type: string;
    status: string;
    startAt: Date;
    endAt: Date;
    allDay: boolean;
  }[];
};

export function serializeFollowUpSheet(
  sheet: SheetWithRels,
  thresholds?: UrgencyThresholds,
) {
  const urgency = computeUrgencyFromDue(sheet.nextActionAt, {
    nextActionDone: sheet.nextActionDone,
    override: sheet.urgencyOverride,
    thresholds,
  });
  const color = POSTIT_COLORS[sheet.colorKey] ?? POSTIT_COLORS.jaune;
  const delay = formatDelay(sheet.nextActionAt);

  return {
    id: sheet.id,
    reference: sheet.reference,
    title: sheet.title,
    clientName: sheet.clientName,
    marketLabel: sheet.marketLabel,
    siteAddress: sheet.siteAddress,
    workObject: sheet.workObject,
    orderNumber: sheet.orderNumber,
    osNumber: sheet.osNumber,
    receivedAt: sheet.receivedAt?.toISOString() ?? null,
    amountHt: sheet.amountHt != null ? Number(sheet.amountHt) : null,
    status: sheet.status as FollowUpSheetStatus,
    statusLabel: STATUS_LABELS[sheet.status],
    colorKey: sheet.colorKey,
    colorLabel: color.label,
    nextAction: sheet.nextAction,
    nextActionAt: sheet.nextActionAt?.toISOString() ?? null,
    nextActionAtLabel: formatDueLabel(sheet.nextActionAt),
    nextActionDone: sheet.nextActionDone,
    urgency: urgency as FollowUpUrgency,
    urgencyLabel: URGENCY_LABELS[urgency],
    urgencyStyles: URGENCY_STYLES[urgency],
    delayLabel: delay,
    notes: sheet.notes,
    reminderOffsets: sheet.reminderOffsets,
    postponeCount: sheet.postponeCount,
    postponedFromAt: sheet.postponedFromAt?.toISOString() ?? null,
    projectId: sheet.projectId,
    assigneeId: sheet.assigneeId,
    assignee: sheet.assignee
      ? { id: sheet.assignee.id, name: sheet.assignee.name, email: sheet.assignee.email }
      : null,
    createdBy: sheet.createdBy
      ? { id: sheet.createdBy.id, name: sheet.createdBy.name, email: sheet.createdBy.email }
      : null,
    project: sheet.project,
    timeline: (sheet.timeline ?? []).map((t) => ({
      id: t.id,
      kind: t.kind,
      label: t.label,
      detail: t.detail,
      occurredAt: t.occurredAt.toISOString(),
      authorName: t.author?.name ?? null,
    })),
    agendaEvents: (sheet.agendaEvents ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      status: e.status,
      startAt: e.startAt.toISOString(),
      endAt: e.endAt.toISOString(),
      allDay: e.allDay,
    })),
    createdAt: sheet.createdAt.toISOString(),
    updatedAt: sheet.updatedAt.toISOString(),
  };
}
