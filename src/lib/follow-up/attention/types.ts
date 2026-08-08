import type { FollowUpSheetStatus, FollowUpUrgency } from "@prisma/client";
import type { UrgencyLevel, UrgencyThresholds } from "@/lib/follow-up/types";

/** Codes stables — la raison affichée reste en français humain. */
export type AttentionCode =
  | "DUE_SOON"
  | "DUE_TODAY"
  | "DUE_TOMORROW"
  | "DUE_OVERDUE"
  | "STEP_OVERDUE"
  | "BILLING_PENDING"
  | "AVENANT_WAITING"
  | "DELIVERY_UNCONFIRMED"
  | "DELIVERY_OVERDUE"
  | "INTERVENTION_PREP"
  /** CDE-3B1 — commandes / livraisons / réceptions */
  | "SUPPLIER_NO_RESPONSE"
  | "SUPPLIER_REFUSED"
  | "DELIVERY_NOT_RECEIVED"
  | "PARTIAL_DELIVERY_PENDING"
  | "RECEIPT_ISSUE"
  | "DELIVERY_NOTE_MISSING";

export type AttentionRelatedEntity = {
  type: "agenda" | "task" | "sheet" | "purchase_order";
  id: string;
  label?: string;
};

export type FollowUpAttentionItem = {
  code: AttentionCode;
  level: UrgencyLevel;
  reason: string;
  dueAt?: Date | null;
  overdueByHours?: number | null;
  relatedEntity?: AttentionRelatedEntity | null;
};

export type FollowUpAttentionResult = {
  /** Niveau à afficher (max manuel + calculé). */
  effectiveUrgency: UrgencyLevel;
  /** Max des items automatiques uniquement. */
  computedUrgency: UrgencyLevel;
  /** urgencyOverride fiche, si présent. */
  manualUrgency: UrgencyLevel | null;
  primaryReason: string | null;
  attentionItems: FollowUpAttentionItem[];
};

export type AttentionSheetInput = {
  id: string;
  status: FollowUpSheetStatus | string;
  title?: string | null;
  nextActionAt?: Date | string | null;
  nextActionDone?: boolean;
  urgencyOverride?: FollowUpUrgency | UrgencyLevel | null;
  /** Dernière transition statut (timeline kind=statut) — jamais updatedAt. */
  statusEnteredAt?: Date | string | null;
};

export type AttentionWorkflowStep = {
  statusKey: string;
  label: string;
  delayHours?: number | null;
  alertOrangeHours?: number | null;
  alertRedHours?: number | null;
  /** W1 / W3-C2A — délai avant rappel (heures). */
  reminderHours?: number | null;
  escalateHours?: number | null;
};

export type AttentionAgendaEvent = {
  id: string;
  type: string;
  status: string;
  title: string;
  startAt: Date | string;
};

/**
 * Seuils échéance en jours calendaires (timezone locale serveur).
 * Configurables — ne pas dupliquer ailleurs.
 */
export type AttentionDueDayThresholds = {
  /** Échéance dans plus de N jours → pas d’item (NORMAL). */
  normalBeyondDays: number;
  /** Échéance dans ≤ N jours (et > 1) → A_SURVEILLER. */
  watchWithinDays: number;
};

export const DEFAULT_ATTENTION_DUE_DAYS: AttentionDueDayThresholds = {
  normalBeyondDays: 3,
  watchWithinDays: 3,
};

export type EvaluateFollowUpAttentionContext = {
  now?: Date;
  workflowStep?: AttentionWorkflowStep | null;
  /** Événements agenda liés à la fiche (chargés en amont, pas de N+1). */
  agendaEvents?: AttentionAgendaEvent[];
  /** Seuils horaires historiques (retard critique, etc.). */
  thresholds?: UrgencyThresholds;
  dueDayThresholds?: AttentionDueDayThresholds;
};
