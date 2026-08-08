export {
  evaluateFollowUpAttention,
  serializeAttentionResult,
  statusEnteredAtFromTimeline,
} from "@/lib/follow-up/attention/evaluate";
export type { SerializedAttention } from "@/lib/follow-up/attention/evaluate";
export type {
  AttentionCode,
  AttentionSheetInput,
  AttentionWorkflowStep,
  AttentionAgendaEvent,
  EvaluateFollowUpAttentionContext,
  FollowUpAttentionItem,
  FollowUpAttentionResult,
  AttentionDueDayThresholds,
} from "@/lib/follow-up/attention/types";
export { DEFAULT_ATTENTION_DUE_DAYS } from "@/lib/follow-up/attention/types";
export {
  startOfLocalDay,
  calendarDaysBetween,
  hoursBetween,
  toDate,
} from "@/lib/follow-up/attention/dates";
export {
  shouldNotifyAttentionLevel,
  notificationTypeForAttentionLevel,
  buildAttentionDedupeKey,
  ATTENTION_NOTIFY_MIN_LEVEL,
} from "@/lib/follow-up/attention/notify-policy";
export {
  syncAttentionNotificationsForSheets,
  syncAttentionNotificationsForOwner,
  syncAttentionNotificationsForSheetId,
  resolveAttentionRecipient,
} from "@/lib/follow-up/attention/sync-notifications";
export {
  DEFAULT_ESCALATION_BY_LEVEL,
  resolveLevelEscalationPolicy,
  episodeKeyFromStatusEnteredAt,
  buildStagedAttentionDedupeKey,
  buildLegacyAttentionDedupeKey,
} from "@/lib/follow-up/attention/escalation-policy";
export type { EscalationStage, LevelEscalationPolicy } from "@/lib/follow-up/attention/escalation-policy";
export {
  evaluateAttentionEscalation,
} from "@/lib/follow-up/attention/evaluate-escalation";
export type {
  EvaluateAttentionEscalationInput,
  EvaluateAttentionEscalationResult,
} from "@/lib/follow-up/attention/evaluate-escalation";
export {
  processAttentionEscalations,
  resolveEscalationRecipient,
} from "@/lib/follow-up/attention/process-escalations";
