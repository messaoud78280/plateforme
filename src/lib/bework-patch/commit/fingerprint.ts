/**
 * Fingerprint déterministe du preview Impact Engine (anti PREVIEW_STALE).
 */
import { createHash } from "crypto";
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";
import type {
  AnalyzePatchImpactResult,
  ImpactSubgraph,
} from "@/lib/bework-patch/impact/types";

export type VersionSnapshot = {
  study: number | null;
  quoteVersion: number | null;
  quoteVersionId: string | null;
  quoteStatus: string | null;
  planRevision: number | null;
};

export function collectVersionSnapshot(subgraph: ImpactSubgraph): VersionSnapshot {
  const quote = subgraph.quotes[0] ?? null;
  const plan = subgraph.plans[0] ?? null;
  return {
    study: subgraph.study?.version ?? null,
    quoteVersion: quote?.versionNumber ?? null,
    quoteVersionId: quote?.versionId ?? null,
    quoteStatus: quote?.status ?? null,
    planRevision: plan?.revisionNumber ?? null,
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
