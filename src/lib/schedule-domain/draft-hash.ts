/**
 * Hash déterministe d’un SchedulePlan normalisé (draftHash).
 *
 * Entre dans le hash :
 * - schemaVersion
 * - sourceSnapshot (projectId, takeoffStudyId, takeoffVersion, takeoffFingerprint, quote*)
 * - calendar
 * - resources
 * - activities (id, name, kind, sourceLinks, duration, resourceRequirements, predecessors, notes)
 *
 * N’entre PAS :
 * - timestamps courants
 * - IDs Prisma
 * - champs UI
 * - ordre des clés JSON (canonical sort)
 * - CalculatedSchedule (dates calculées)
 *
 * Algo : SHA-256 hex (node:crypto), cohérent avec fingerprints BeWork.
 */
import { createHash } from "node:crypto";
import type { SchedulePlan } from "./schema";
import { toDomainSnapshotJson } from "./versioning";

function canonical(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.keys(v as Record<string, unknown>)
        .sort()
        .map((k) => [k, canonical((v as Record<string, unknown>)[k])]),
    );
  }
  return v;
}

export function computeScheduleDraftHash(plan: SchedulePlan): string {
  const payload = toDomainSnapshotJson(plan);
  const json = JSON.stringify(canonical(payload));
  return createHash("sha256").update(json).digest("hex");
}
