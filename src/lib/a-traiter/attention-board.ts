/**
 * W3-B — Transformation / tri / filtre des diagnostics W3-A pour « À traiter ».
 * Pure, sans I/O. Ne recalcule pas l’urgence (utilise evaluateFollowUpAttention).
 */
import type { UrgencyLevel } from "@/lib/follow-up/types";
import { urgencyRank } from "@/lib/follow-up/urgency";
import type { AttentionCode, SerializedAttention } from "@/lib/follow-up/attention";
import { formatKanbanDueLabel } from "@/lib/follow-up/urgency";

export type AttentionProblemCategory =
  | "ECHEANCE"
  | "SUIVI"
  | "FACTURATION"
  | "AVENANT"
  | "LIVRAISON"
  | "INTERVENTION";

export const ATTENTION_CATEGORY_LABELS: Record<AttentionProblemCategory, string> = {
  ECHEANCE: "Échéance",
  SUIVI: "Suivi",
  FACTURATION: "Facturation",
  AVENANT: "Avenant",
  LIVRAISON: "Livraison",
  INTERVENTION: "Intervention",
};

export const ATTENTION_URGENCY_ORDER: UrgencyLevel[] = [
  "CRITIQUE",
  "URGENT",
  "IMPORTANT",
  "A_SURVEILLER",
];

export type ATraiterAttentionCard = {
  sheetId: string;
  title: string;
  clientName: string | null;
  projectTitle: string | null;
  osNumber: string | null;
  orderNumber: string | null;
  workObject: string | null;
  nextAction: string | null;
  nextActionDone: boolean;
  assigneeId: string | null;
  assigneeName: string | null;
  nextActionAt: string | null;
  dueLabel: string | null;
  status: string;
  statusEnteredAt: string | null;
  effectiveUrgency: UrgencyLevel;
  primaryReason: string | null;
  attentionItems: SerializedAttention["attentionItems"];
  otherReasonsCount: number;
  category: AttentionProblemCategory;
  categoryLabel: string;
  relatedAgendaId: string | null;
  relatedTaskId: string | null;
};

export function attentionCodeToCategory(code: AttentionCode | string): AttentionProblemCategory {
  switch (code) {
    case "DUE_SOON":
    case "DUE_TODAY":
    case "DUE_TOMORROW":
    case "DUE_OVERDUE":
      return "ECHEANCE";
    case "STEP_OVERDUE":
      return "SUIVI";
    case "BILLING_PENDING":
      return "FACTURATION";
    case "AVENANT_WAITING":
      return "AVENANT";
    case "DELIVERY_UNCONFIRMED":
    case "DELIVERY_OVERDUE":
      return "LIVRAISON";
    case "INTERVENTION_PREP":
      return "INTERVENTION";
    default:
      return "SUIVI";
  }
}

export function buildAttentionCard(opts: {
  sheet: {
    id: string;
    title: string;
    clientName?: string | null;
    osNumber?: string | null;
    orderNumber?: string | null;
    workObject?: string | null;
    nextAction?: string | null;
    nextActionDone?: boolean;
    nextActionAt?: string | null;
    status: string;
    assigneeId?: string | null;
    assigneeName?: string | null;
    projectTitle?: string | null;
    statusEnteredAt?: string | null;
    relatedTaskId?: string | null;
  };
  attention: SerializedAttention;
  now?: Date;
}): ATraiterAttentionCard | null {
  const { sheet, attention } = opts;
  if (attention.effectiveUrgency === "NORMAL") return null;
  if (!attention.primaryReason && attention.attentionItems.length === 0) return null;

  const primary = attention.attentionItems[0];
  const category = attentionCodeToCategory(primary?.code ?? "STEP_OVERDUE");
  const relatedAgenda =
    attention.attentionItems.find((i) => i.relatedEntity?.type === "agenda")?.relatedEntity?.id ??
    null;

  return {
    sheetId: sheet.id,
    title: sheet.title,
    clientName: sheet.clientName ?? null,
    projectTitle: sheet.projectTitle ?? null,
    osNumber: sheet.osNumber ?? null,
    orderNumber: sheet.orderNumber ?? null,
    workObject: sheet.workObject ?? null,
    nextAction: sheet.nextAction ?? null,
    nextActionDone: Boolean(sheet.nextActionDone),
    assigneeId: sheet.assigneeId ?? null,
    assigneeName: sheet.assigneeName ?? null,
    nextActionAt: sheet.nextActionAt ?? null,
    dueLabel: formatKanbanDueLabel(
      sheet.nextActionAt ? new Date(sheet.nextActionAt) : null,
      opts.now,
    ),
    status: sheet.status,
    statusEnteredAt: sheet.statusEnteredAt ?? null,
    effectiveUrgency: attention.effectiveUrgency,
    primaryReason: attention.primaryReason,
    attentionItems: attention.attentionItems,
    otherReasonsCount: Math.max(0, attention.attentionItems.length - 1),
    category,
    categoryLabel: ATTENTION_CATEGORY_LABELS[category],
    relatedAgendaId: relatedAgenda,
    relatedTaskId: sheet.relatedTaskId ?? null,
  };
}

export function sortAttentionCards(a: ATraiterAttentionCard, b: ATraiterAttentionCard): number {
  const ur = urgencyRank(b.effectiveUrgency) - urgencyRank(a.effectiveUrgency);
  if (ur !== 0) return ur;

  const aOverdue = a.attentionItems.some((i) => i.code === "DUE_OVERDUE");
  const bOverdue = b.attentionItems.some((i) => i.code === "DUE_OVERDUE");
  if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

  const da = a.nextActionAt ? new Date(a.nextActionAt).getTime() : Number.POSITIVE_INFINITY;
  const db = b.nextActionAt ? new Date(b.nextActionAt).getTime() : Number.POSITIVE_INFINITY;
  if (da !== db) return da - db;

  const ea = a.statusEnteredAt ? new Date(a.statusEnteredAt).getTime() : 0;
  const eb = b.statusEnteredAt ? new Date(b.statusEnteredAt).getTime() : 0;
  return ea - eb;
}

export type AttentionBoardFilters = {
  q?: string;
  mineOnly?: boolean;
  currentUserId?: string | null;
  urgency?: UrgencyLevel | "all";
  assigneeId?: string | "all";
  clientName?: string | "all";
  projectTitle?: string | "all";
  category?: AttentionProblemCategory | "all";
};

export function filterAttentionCards(
  cards: ATraiterAttentionCard[],
  filters: AttentionBoardFilters,
): ATraiterAttentionCard[] {
  const q = (filters.q ?? "").trim().toLowerCase();
  return cards.filter((c) => {
    if (filters.mineOnly && filters.currentUserId && c.assigneeId !== filters.currentUserId) {
      return false;
    }
    if (filters.urgency && filters.urgency !== "all" && c.effectiveUrgency !== filters.urgency) {
      return false;
    }
    if (filters.assigneeId && filters.assigneeId !== "all" && c.assigneeId !== filters.assigneeId) {
      return false;
    }
    if (filters.clientName && filters.clientName !== "all" && (c.clientName ?? "") !== filters.clientName) {
      return false;
    }
    if (
      filters.projectTitle &&
      filters.projectTitle !== "all" &&
      (c.projectTitle ?? c.title) !== filters.projectTitle
    ) {
      return false;
    }
    if (filters.category && filters.category !== "all" && c.category !== filters.category) {
      return false;
    }
    if (!q) return true;
    const hay = [
      c.title,
      c.clientName,
      c.projectTitle,
      c.osNumber,
      c.orderNumber,
      c.workObject,
      c.nextAction,
      c.assigneeName,
      c.primaryReason,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function countAttentionByUrgency(cards: ATraiterAttentionCard[]) {
  const counts: Record<"CRITIQUE" | "URGENT" | "IMPORTANT" | "A_SURVEILLER", number> = {
    CRITIQUE: 0,
    URGENT: 0,
    IMPORTANT: 0,
    A_SURVEILLER: 0,
  };
  for (const c of cards) {
    if (c.effectiveUrgency in counts) {
      counts[c.effectiveUrgency as keyof typeof counts] += 1;
    }
  }
  return counts;
}

/** Badge nav : URGENT + CRITIQUE (cohérent avec l’existant « points chauds »). */
export function countHotAttention(cards: ATraiterAttentionCard[]): number {
  return cards.filter(
    (c) => c.effectiveUrgency === "URGENT" || c.effectiveUrgency === "CRITIQUE",
  ).length;
}

export function groupAttentionCards(cards: ATraiterAttentionCard[]) {
  const sorted = cards.slice().sort(sortAttentionCards);
  const groups: { urgency: UrgencyLevel; items: ATraiterAttentionCard[] }[] = [];
  for (const u of ATTENTION_URGENCY_ORDER) {
    const items = sorted.filter((c) => c.effectiveUrgency === u);
    if (items.length > 0) groups.push({ urgency: u, items });
  }
  return groups;
}
