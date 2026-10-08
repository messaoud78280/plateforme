/**
 * Drift métré → besoin. Jamais de modification silencieuse si engagé en BC.
 */
import type { SupplySourceDrift } from "@/lib/supply/types";
import { quantityDriftGap } from "@/lib/supply/quantities";

export function computeSourceFingerprint(input: {
  takeoffCodes: string[];
  sourceQuantities: Array<{ code: string; qty: number; unit: string }>;
  studyVersion?: number | null;
}): string {
  const codes = [...input.takeoffCodes].map((c) => c.trim()).filter(Boolean).sort();
  const qtys = [...input.sourceQuantities]
    .map((q) => `${q.code}:${Number(q.qty)}:${q.unit}`)
    .sort();
  const ver = input.studyVersion != null ? `v${input.studyVersion}` : "v?";
  return `${ver}|${codes.join(",")}|${qtys.join(";")}`;
}

export function evaluateMetreDrift(input: {
  previousFingerprint: string | null | undefined;
  nextFingerprint: string;
  hasActiveOrderLinks: boolean;
}): {
  drift: SupplySourceDrift;
  changed: boolean;
  /** true = le professionnel doit décider (pas d’auto-écriture) */
  requiresHumanDecision: boolean;
} {
  const prev = input.previousFingerprint?.trim() || null;
  const next = input.nextFingerprint.trim();
  if (!prev || prev === next) {
    return { drift: "NONE", changed: false, requiresHumanDecision: false };
  }
  if (input.hasActiveOrderLinks) {
    return {
      drift: "METRE_CHANGED_AFTER_ORDER",
      changed: true,
      requiresHumanDecision: true,
    };
  }
  return {
    drift: "METRE_CHANGED",
    changed: true,
    requiresHumanDecision: true,
  };
}

export function buildDriftDecisionPayload(input: {
  drift: SupplySourceDrift;
  orderedQty: number;
  newRequiredQty: number;
}) {
  const gap = quantityDriftGap({
    newRequiredQty: input.newRequiredQty,
    orderedQty: input.orderedQty,
  });
  return {
    drift: input.drift,
    orderedQty: input.orderedQty,
    newRequiredQty: input.newRequiredQty,
    ...gap,
    allowedActions:
      input.drift === "METRE_CHANGED_AFTER_ORDER"
        ? (["CREATE_COMPLEMENT", "KEEP_ORDER", "REVIEW_NEED"] as const)
        : input.drift === "METRE_CHANGED"
          ? (["RECALCULATE", "KEEP", "CANCEL_NEED"] as const)
          : (["NONE"] as const),
  };
}
