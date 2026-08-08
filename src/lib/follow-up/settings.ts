import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ALERT_RULES,
  DEFAULT_ESCALATE,
  DEFAULT_URGENCY_THRESHOLDS,
  type AlertRuleConfig,
  type EscalateConfig,
  type UrgencyThresholds,
} from "@/lib/follow-up/types";

export type FollowUpSettingsResolved = {
  thresholds: UrgencyThresholds;
  rules: AlertRuleConfig[];
  escalate: EscalateConfig;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function mergeThresholds(raw: unknown): UrgencyThresholds {
  const o = asObject(raw);
  if (!o) return { ...DEFAULT_URGENCY_THRESHOLDS };
  return {
    normalMinDays: Number(o.normalMinDays ?? DEFAULT_URGENCY_THRESHOLDS.normalMinDays),
    watchMaxDays: Number(o.watchMaxDays ?? DEFAULT_URGENCY_THRESHOLDS.watchMaxDays),
    importantMaxHours: Number(o.importantMaxHours ?? DEFAULT_URGENCY_THRESHOLDS.importantMaxHours),
    urgentMaxHours: Number(o.urgentMaxHours ?? DEFAULT_URGENCY_THRESHOLDS.urgentMaxHours),
    criticalOverdueHours: Number(
      o.criticalOverdueHours ?? DEFAULT_URGENCY_THRESHOLDS.criticalOverdueHours,
    ),
  };
}

function mergeRules(raw: unknown): AlertRuleConfig[] {
  if (!Array.isArray(raw)) return DEFAULT_ALERT_RULES.map((r) => ({ ...r }));
  const byId = new Map(raw.map((r) => [String((r as AlertRuleConfig).id), r as AlertRuleConfig]));
  return DEFAULT_ALERT_RULES.map((def) => {
    const patch = byId.get(def.id);
    if (!patch) return { ...def };
    return {
      ...def,
      enabled: typeof patch.enabled === "boolean" ? patch.enabled : def.enabled,
      delayHours: typeof patch.delayHours === "number" ? patch.delayHours : def.delayHours,
      urgency: patch.urgency ?? def.urgency,
      notifyAssignee: typeof patch.notifyAssignee === "boolean" ? patch.notifyAssignee : def.notifyAssignee,
      notifyOwner: typeof patch.notifyOwner === "boolean" ? patch.notifyOwner : def.notifyOwner,
    };
  });
}

function mergeEscalate(raw: unknown): EscalateConfig {
  const o = asObject(raw);
  if (!o) return { ...DEFAULT_ESCALATE };
  return {
    escalateToOwnerAfterHours: Number(
      o.escalateToOwnerAfterHours ?? DEFAULT_ESCALATE.escalateToOwnerAfterHours,
    ),
    escalateCriticalAfterHours: Number(
      o.escalateCriticalAfterHours ?? DEFAULT_ESCALATE.escalateCriticalAfterHours,
    ),
    notifyOwnerOnUrgent:
      typeof o.notifyOwnerOnUrgent === "boolean"
        ? o.notifyOwnerOnUrgent
        : DEFAULT_ESCALATE.notifyOwnerOnUrgent,
    notifyOwnerOnCritical:
      typeof o.notifyOwnerOnCritical === "boolean"
        ? o.notifyOwnerOnCritical
        : DEFAULT_ESCALATE.notifyOwnerOnCritical,
  };
}

export async function getFollowUpSettings(ownerUserId: string): Promise<FollowUpSettingsResolved> {
  const row = await prisma.followUpAlertSettings.findUnique({
    where: { ownerUserId },
  });
  return {
    thresholds: mergeThresholds(row?.thresholdsJson),
    rules: mergeRules(row?.rulesJson),
    escalate: mergeEscalate(row?.escalateJson),
  };
}

export async function saveFollowUpSettings(
  ownerUserId: string,
  data: {
    thresholds?: UrgencyThresholds;
    rules?: AlertRuleConfig[];
    escalate?: EscalateConfig;
  },
) {
  return prisma.followUpAlertSettings.upsert({
    where: { ownerUserId },
    create: {
      ownerUserId,
      thresholdsJson: data.thresholds ?? DEFAULT_URGENCY_THRESHOLDS,
      rulesJson: data.rules ?? DEFAULT_ALERT_RULES,
      escalateJson: data.escalate ?? DEFAULT_ESCALATE,
    },
    update: {
      ...(data.thresholds ? { thresholdsJson: data.thresholds } : {}),
      ...(data.rules ? { rulesJson: data.rules } : {}),
      ...(data.escalate ? { escalateJson: data.escalate } : {}),
    },
  });
}
