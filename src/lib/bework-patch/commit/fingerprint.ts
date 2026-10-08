/**
 * Fingerprint déterministe du preview Impact Engine (anti PREVIEW_STALE).
 */
import { createHash } from "crypto";
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";
import type {
  AnalyzePatchImpactResult,
  ImpactPlan,
  ImpactSubgraph,
} from "@/lib/bework-patch/impact/types";

export type VersionSnapshot = {
  study: number | null;
  quoteVersion: number | null;
  quoteVersionId: string | null;
  quoteStatus: string | null;
  planRevision: number | null;
  /** CTX-02A / CTX-04 — version métré source du planning (pas confondre avec planRevision). */
  studyVersionAtGeneration?: number | null;
  /** CTX-02B / CTX-07 — empreinte déterministe VISIT. */
  visitContextVersion?: number | null;
  /** CTX-02C — empreinte déterministe FOLLOW_UP (état exposé ChatGPT). */
  followUpVersion?: number | null;
  /** CTX-02D — empreinte déterministe REPORT (COMPTE_RENDU exposé). */
  reportVersion?: number | null;
  /** CTX-02E — empreinte déterministe NOTICE (kind NOTICE exposé). */
  noticeVersion?: number | null;
  /** Approvisionnements — empreinte besoins + offres. */
  supplyVersion?: number | null;
};

/**
 * Sélectionne le planning fingerprinté.
 * 1. preferredPlanId (origin.entity_id PLANNING)
 * 2. sinon max revisionNumber (pas plans[0] / createdAt)
 */
export function selectPlanForVersionSnapshot(
  plans: ImpactPlan[],
  preferredPlanId?: string | null,
): ImpactPlan | null {
  if (plans.length === 0) return null;
  if (preferredPlanId) {
    const hit = plans.find((p) => p.id === preferredPlanId);
    if (hit) return hit;
  }
  if (plans.length === 1) return plans[0]!;
  return plans.reduce((best, p) =>
    p.revisionNumber > best.revisionNumber ? p : best,
  );
}

export function collectVersionSnapshot(
  subgraph: ImpactSubgraph,
  opts?: { preferredPlanId?: string | null },
): VersionSnapshot {
  const quote = subgraph.quotes[0] ?? null;
  const plan = selectPlanForVersionSnapshot(
    subgraph.plans,
    opts?.preferredPlanId,
  );
  return {
    study: subgraph.study?.version ?? null,
    quoteVersion: quote?.versionNumber ?? null,
    quoteVersionId: quote?.versionId ?? null,
    quoteStatus: quote?.status ?? null,
    planRevision: plan?.revisionNumber ?? null,
    studyVersionAtGeneration: plan?.studyVersionAtGeneration ?? null,
    visitContextVersion: subgraph.visit?.contextVersion ?? null,
    followUpVersion: subgraph.followUp?.contextVersion ?? null,
    reportVersion: subgraph.report?.contextVersion ?? null,
    noticeVersion: subgraph.notice?.contextVersion ?? null,
    supplyVersion: subgraph.supply?.contextVersion ?? null,
  };
}

/** Payload stable pour hash — ordre de clés fixé. */
export function buildFingerprintPayload(input: {
  patch: BeworkPatchV1;
  versions: VersionSnapshot;
  impact: AnalyzePatchImpactResult;
  subgraph: ImpactSubgraph;
}): unknown {
  return {
    patch_id: input.patch.patch_id,
    section: input.patch.origin.section,
    intent: input.patch.change_intent,
    entity_id: input.patch.origin.entity_id,
    base_version: input.patch.origin.base_version,
    versions: input.versions,
    canonical: input.impact.canonicalResolution.status,
    direct: input.impact.directChanges.map((d) => ({
      field: d.field,
      before: d.before,
      after: d.after,
      entityId: d.entityId,
    })),
    derived: input.impact.derivedChanges.map((d) => ({
      section: d.section,
      field: d.field,
      before: d.before,
      after: d.after,
      entityId: d.entityId,
      certainty: d.certainty,
      blocked: !!d.blocked,
      quoteLinkClass: d.quoteLinkClass ?? null,
    })),
    protected: input.impact.protectedEntities.map((p) => ({
      id: p.id,
      reason: p.reason,
      gap: p.gap ?? null,
    })),
    overrides: input.impact.overrides.map((o) => ({
      quoteLineId: o.quoteLineId,
      currentQty: o.currentQty,
      transferQty: o.transferQty,
    })),
    links: {
      quoteLinks: input.subgraph.quoteLinks.map((l) => ({
        id: l.id,
        line: l.studyLineCode,
        quoteLineId: l.quoteLineId,
        qtyAtTransfer: l.quantityAtTransfer,
      })),
      takeoffLinks: input.subgraph.plans.flatMap((p) =>
        p.takeoffLinks.map((l) => ({
          planId: p.id,
          taskId: l.taskId,
          code: l.studyLineCode,
        })),
      ),
    },
    statuses: {
      quotes: input.subgraph.quotes.map((q) => ({ id: q.id, status: q.status })),
    },
  };
}

export function computePreviewFingerprint(payload: unknown): string {
  const json = JSON.stringify(payload);
  return createHash("sha256").update(json).digest("hex");
}
